"use server";

import { prisma } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth/sesion";
import { turnoAbiertoDe } from "@/lib/caja/turno";
import { calcularTotales, validarVenta, type LineaVenta } from "@/lib/ventas/calculo";
import type { EntradaVenta, ResultadoVenta } from "./tipos";

export async function registrarVenta(entrada: EntradaVenta): Promise<ResultadoVenta> {
  const s = await obtenerSesion();
  if (!s) return { ok: false, error: "Sesión expirada." };
  if (!["cajero", "supervisor", "administrador"].includes(s.rol)) {
    return { ok: false, error: "Tu rol no puede registrar ventas." };
  }

  const turno = await turnoAbiertoDe(s.id);
  if (!turno) return { ok: false, error: "No tienes un turno abierto." };

  if (!entrada.lineas?.length) return { ok: false, error: "La venta no tiene líneas." };

  // Recalcular precios en el SERVIDOR desde la tarifa vigente (no confiar en el cliente).
  const tarifas = new Map<string, { tarifa_id: string | null; valor: number }>();
  for (const l of entrada.lineas) {
    if (tarifas.has(l.tipo_visitante_id)) continue;
    const t = await prisma.tarifa.findFirst({
      where: { tipo_visitante_id: l.tipo_visitante_id, vigente_hasta: null },
      orderBy: { vigente_desde: "desc" },
    });
    tarifas.set(l.tipo_visitante_id, { tarifa_id: t?.id ?? null, valor: t?.valor ?? 0 });
  }

  const lineas: LineaVenta[] = entrada.lineas.map((l) => {
    const t = tarifas.get(l.tipo_visitante_id)!;
    const esCortesia = l.tipo_linea !== "pago";
    return {
      tipo_visitante_id: l.tipo_visitante_id,
      cantidad: l.cantidad,
      valor_lista: t.valor,
      valor_cobrado: esCortesia ? 0 : t.valor,
      tipo_linea: l.tipo_linea,
      motivo_cortesia_id: l.motivo_cortesia_id ?? null,
      autorizado_por: l.autorizado_por ?? null,
    };
  });

  const val = validarVenta(lineas, entrada.pagos ?? []);
  if (!val.ok) return { ok: false, error: val.errores.join(" ") };

  const totales = calcularTotales(lineas);

  try {
    const res = await prisma.$transaction(async (tx) => {
      const agg = await tx.venta.aggregate({ where: { turno_id: turno.id }, _max: { numero_venta: true } });
      const numero = (agg._max.numero_venta ?? 0) + 1;

      const venta = await tx.venta.create({
        data: {
          turno_id: turno.id,
          usuario_id: s.id,
          numero_venta: numero,
          total_lista: totales.total_lista,
          total_cobrado: totales.total_cobrado,
          total_descuento: totales.total_descuento,
          cantidad_asistentes: totales.cantidad_asistentes,
          comprador_nombre: entrada.comprador_nombre?.trim() || null,
          comprador_documento: entrada.comprador_documento?.trim() || null,
          creado_por: s.id,
          detalle: {
            create: lineas.map((l) => ({
              tipo_visitante_id: l.tipo_visitante_id,
              tarifa_id: tarifas.get(l.tipo_visitante_id)!.tarifa_id,
              tipo_linea: l.tipo_linea,
              cantidad: l.cantidad,
              valor_lista: l.valor_lista,
              valor_cobrado: l.valor_cobrado,
              motivo_cortesia_id: l.motivo_cortesia_id ?? null,
              autorizado_por: l.autorizado_por ?? null,
              creado_por: s.id,
            })),
          },
          pagos: {
            create: (entrada.pagos ?? []).map((p) => ({
              medio_pago_id: p.medio_pago_id,
              monto: p.monto,
              creado_por: s.id,
            })),
          },
        },
      });
      return { numero, venta_id: venta.id };
    });

    return { ok: true, numero_venta: res.numero, venta_id: res.venta_id };
  } catch (e) {
    console.error("Error registrando venta:", e);
    return { ok: false, error: "No se pudo registrar la venta. Intenta de nuevo." };
  }
}
