import { obtenerSesion, tieneRol } from "@/lib/auth/sesion";
import { cuadreDiario } from "@/lib/caja/cuadreDiario";
import { fechaBogota } from "@/lib/tiempo";

const ES_FECHA = /^\d{4}-\d{2}-\d{2}$/;

// Exporta el cuadre diario CONSOLIDADO como CSV (se abre en Excel). Separador ';' y BOM UTF-8.
export async function GET(req: Request) {
  const s = await obtenerSesion();
  if (!s || !tieneRol(s.rol, "supervisor")) return new Response("No autorizado", { status: 401 });

  const url = new URL(req.url);
  const param = url.searchParams.get("fecha");
  const fecha = param && ES_FECHA.test(param) ? param : fechaBogota();
  const c = await cuadreDiario(fecha);

  const filas: string[][] = [
    ["Cuadre diario consolidado"],
    ["Fecha (dia operativo)", fecha],
    ["Turnos", String(c.turnos), "Cerrados", String(c.turnosCerrados), "Abiertos", String(c.turnosAbiertos)],
    [],
    ["Ventas por medio de pago", "Total"],
    ...c.ventasPorMedio.map((m) => [m.medio, String(m.total)]),
    ["Total ventas", String(c.totalVentas)],
    [],
    ["Ventas por tipo", "Cantidad", "Total"],
    ...c.ventasPorTipo.map((t) => [t.tipo, String(t.cantidad), String(t.total)]),
    [],
    ["Efectivo consolidado", "Valor"],
    ["Base inicial (todas las cajas)", String(c.baseInicial)],
    ["Ventas efectivo", String(c.ventasEfectivo)],
    ["Otros ingresos", String(c.otrosIngresos)],
    ["Egresos", String(c.egresos)],
    ["Efectivo esperado", String(c.esperadoEfectivo)],
    ["Efectivo contado (turnos cerrados)", String(c.efectivoContado)],
    ["Diferencia (turnos cerrados)", c.turnosAbiertos === 0 ? String(c.diferencia) : "parcial: hay turnos abiertos"],
    [],
    ["Cortesias/descuentos (no cobrado)", String(c.cortesias)],
    ["Ventas anuladas", String(c.anuladas)],
    ["Asistentes", String(c.asistentes)],
    ["Numero de ventas", String(c.numVentas)],
    [],
    ["Detalle por turno"],
    ["Caja", "Cajero", "Estado", "Abierto", "Cerrado", "Ventas", "Esperado", "Contado", "Diferencia"],
    ...c.detalle.map((d) => [
      d.caja,
      d.usuario,
      d.estado,
      d.abiertoEn,
      d.cerradoEn ?? "",
      String(d.totalVentas),
      String(d.esperado),
      d.contado === null ? "" : String(d.contado),
      d.diferencia === null ? "" : String(d.diferencia),
    ]),
  ];

  const csv = "﻿" + filas.map((f) => f.map((c) => `"${(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cuadre-diario-${fecha}.csv"`,
    },
  });
}
