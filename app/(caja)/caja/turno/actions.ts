"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerSesion, tieneRol } from "@/lib/auth/sesion";
import { turnoAbiertoDe } from "@/lib/caja/turno";
import { resumenTurno } from "@/lib/caja/resumen";
import { totalConteo } from "@/lib/caja/cierre";
import { registrarAuditoria } from "@/lib/audit";

interface EstadoTurno {
  error?: string;
  ok?: boolean;
}

export async function abrirTurno(_prev: EstadoTurno | null, formData: FormData): Promise<EstadoTurno> {
  const s = await obtenerSesion();
  if (!s) return { error: "Sesión expirada." };

  const caja_id = String(formData.get("caja_id") ?? "");
  const base_inicial = parseInt(String(formData.get("base_inicial") ?? "0").replace(/\D/g, ""), 10) || 0;
  if (!caja_id) return { error: "Selecciona una caja." };
  if (await turnoAbiertoDe(s.id)) return { error: "Ya tienes un turno abierto." };

  await prisma.turnoCaja.create({ data: { caja_id, usuario_id: s.id, base_inicial, creado_por: s.id } });
  revalidatePath("/caja/turno");
  revalidatePath("/taquilla");
  return { ok: true };
}

export interface ResultadoAccionCaja {
  ok: boolean;
  error?: string;
}

/** Movimiento de caja distinto a ventas (ingreso/egreso), con motivo. */
export async function registrarMovimiento(input: {
  tipo: "ingreso" | "egreso";
  monto: number;
  concepto: string;
  medio_pago_id?: string | null;
}): Promise<ResultadoAccionCaja> {
  const s = await obtenerSesion();
  if (!s) return { ok: false, error: "Sesión expirada." };
  const turno = await turnoAbiertoDe(s.id);
  if (!turno) return { ok: false, error: "No tienes un turno abierto." };
  if (!Number.isInteger(input.monto) || input.monto <= 0) return { ok: false, error: "Monto inválido." };
  if (!input.concepto?.trim()) return { ok: false, error: "Indica el concepto." };

  await prisma.movimientoCaja.create({
    data: {
      turno_id: turno.id,
      tipo: input.tipo,
      monto: input.monto,
      concepto: input.concepto.trim(),
      medio_pago_id: input.medio_pago_id ?? null,
      creado_por: s.id,
    },
  });
  revalidatePath("/caja/turno");
  return { ok: true };
}

export interface ResultadoCierre {
  ok: boolean;
  error?: string;
  esperado?: number;
  contado?: number;
  diferencia?: number;
}

/** Cierre del turno: conteo por denominación → esperado vs. contado → diferencia. */
export async function cerrarTurno(input: {
  conteos: { denominacion: number; cantidad: number }[];
  observacion: string;
}): Promise<ResultadoCierre> {
  const s = await obtenerSesion();
  if (!s) return { ok: false, error: "Sesión expirada." };
  const turno = await turnoAbiertoDe(s.id);
  if (!turno) return { ok: false, error: "No tienes un turno abierto." };

  const resumen = await resumenTurno(turno.id);
  const conteos = (input.conteos ?? []).filter((c) => c.cantidad > 0);
  const contado = totalConteo(conteos);
  const esperado = resumen.esperadoEfectivo;
  const diferencia = contado - esperado;

  if (diferencia !== 0 && !input.observacion?.trim()) {
    return { ok: false, error: "Hay diferencia; escribe una observación.", esperado, contado, diferencia };
  }

  const ahora = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.conteoDenominacion.deleteMany({ where: { turno_id: turno.id } });
    if (conteos.length) {
      await tx.conteoDenominacion.createMany({
        data: conteos.map((c) => ({ turno_id: turno.id, denominacion: c.denominacion, cantidad: c.cantidad, creado_por: s.id })),
      });
    }
    await tx.movimientoCaja.create({
      data: { turno_id: turno.id, tipo: "cierre", monto: contado, concepto: "Cierre de turno", creado_por: s.id },
    });
    await tx.turnoCaja.update({
      where: { id: turno.id },
      data: {
        estado: "cerrado",
        cerrado_en: ahora,
        efectivo_esperado: esperado,
        efectivo_contado: contado,
        diferencia,
        observacion_cierre: input.observacion?.trim() || null,
        actualizado_por: s.id,
      },
    });
    await registrarAuditoria({
      usuario_id: s.id, entidad: "turno_caja", entidad_id: turno.id, accion: "cerrar",
      datos_despues: { esperado, contado, diferencia },
    });
  });

  revalidatePath("/caja/turno");
  return { ok: true, esperado, contado, diferencia };
}

/** Reapertura de un turno cerrado: solo administrador, con motivo y auditoría. */
export async function reabrirTurno(turnoId: string, motivo: string): Promise<ResultadoAccionCaja> {
  const s = await obtenerSesion();
  if (!s) return { ok: false, error: "Sesión expirada." };
  if (!tieneRol(s.rol, "administrador")) return { ok: false, error: "Solo un administrador puede reabrir." };
  if (!motivo?.trim()) return { ok: false, error: "Indica el motivo de la reapertura." };

  const turno = await prisma.turnoCaja.findUnique({ where: { id: turnoId } });
  if (!turno) return { ok: false, error: "Turno no encontrado." };
  if (turno.estado !== "cerrado") return { ok: false, error: "El turno no está cerrado." };

  await prisma.$transaction(async (tx) => {
    await tx.turnoCaja.update({ where: { id: turnoId }, data: { estado: "reabierto", reabierto_por: s.id, reabierto_en: new Date(), actualizado_por: s.id } });
    await registrarAuditoria({ usuario_id: s.id, entidad: "turno_caja", entidad_id: turnoId, accion: "reabrir", datos_despues: { motivo: motivo.trim() } });
  });
  revalidatePath("/caja/turno");
  return { ok: true };
}
