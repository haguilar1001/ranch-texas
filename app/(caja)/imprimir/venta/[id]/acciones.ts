"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerSesion, tieneRol } from "@/lib/auth/sesion";
import { registrarAuditoria } from "@/lib/audit";

export interface ResultadoAccion {
  ok: boolean;
  error?: string;
}

/** Marca como impresas las manillas de la venta (cola de impresión). */
export async function marcarImpreso(ventaId: string): Promise<ResultadoAccion> {
  const s = await obtenerSesion();
  if (!s) return { ok: false, error: "Sesión expirada." };
  await prisma.impresion.updateMany({
    where: { manilla: { venta_detalle: { venta_id: ventaId } }, estado: "pendiente" },
    data: { estado: "impreso", impreso_en: new Date() },
  });
  return { ok: true };
}

/** Reimpresión: solo supervisor/administrador, con motivo. Cuenta y audita. */
export async function reimprimirVenta(ventaId: string, motivo: string): Promise<ResultadoAccion> {
  const s = await obtenerSesion();
  if (!s) return { ok: false, error: "Sesión expirada." };
  if (!tieneRol(s.rol, "supervisor")) return { ok: false, error: "Solo un supervisor puede reimprimir." };
  if (!motivo.trim()) return { ok: false, error: "Indica el motivo de la reimpresión." };

  const manillas = await prisma.manilla.findMany({ where: { venta_detalle: { venta_id: ventaId } }, select: { id: true } });
  if (manillas.length === 0) return { ok: false, error: "La venta no tiene manillas." };

  await prisma.$transaction(async (tx) => {
    for (const m of manillas) {
      await tx.manilla.update({ where: { id: m.id }, data: { reimpresa_veces: { increment: 1 }, actualizado_por: s.id } });
    }
    await registrarAuditoria({
      usuario_id: s.id,
      entidad: "venta",
      entidad_id: ventaId,
      accion: "reimprimir",
      datos_despues: { motivo: motivo.trim(), manillas: manillas.length },
    });
  });

  revalidatePath(`/imprimir/venta/${ventaId}`);
  return { ok: true };
}

/** Anulación de venta: solo supervisor/administrador, con motivo. Anula venta + manillas. */
export async function anularVenta(ventaId: string, motivo: string): Promise<ResultadoAccion> {
  const s = await obtenerSesion();
  if (!s) return { ok: false, error: "Sesión expirada." };
  if (!tieneRol(s.rol, "supervisor")) return { ok: false, error: "Solo un supervisor puede anular." };
  if (!motivo.trim()) return { ok: false, error: "Indica el motivo de la anulación." };

  const venta = await prisma.venta.findUnique({ where: { id: ventaId }, select: { estado: true } });
  if (!venta) return { ok: false, error: "Venta no encontrada." };
  if (venta.estado === "anulada") return { ok: false, error: "La venta ya está anulada." };

  const ahora = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.venta.update({
      where: { id: ventaId },
      data: { estado: "anulada", motivo_anulacion: motivo.trim(), anulada_por: s.id, anulada_en: ahora, actualizado_por: s.id },
    });
    await tx.manilla.updateMany({
      where: { venta_detalle: { venta_id: ventaId }, estado: { not: "anulada" } },
      data: { estado: "anulada", anulada_en: ahora, anulada_por: s.id, motivo_anulacion: motivo.trim() },
    });
    await registrarAuditoria({
      usuario_id: s.id,
      entidad: "venta",
      entidad_id: ventaId,
      accion: "anular",
      datos_despues: { motivo: motivo.trim() },
    });
  });

  revalidatePath(`/imprimir/venta/${ventaId}`);
  return { ok: true };
}
