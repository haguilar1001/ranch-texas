import { prisma } from "../db";

const NOMBRES_DIA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** Convierte un instante UTC a la hora local de Bogotá (UTC-5). */
function aBogota(d: Date): Date {
  return new Date(d.getTime() - 5 * 3600000);
}

export interface IndicadoresVentas {
  numVentas: number;
  asistentes: number;
  ingreso: number;
  ticketPromedio: number;
  valorNoCobrado: number; // cortesías + descuentos
  pctCortesias: number; // sobre el valor lista
  porTipo: { tipo: string; cantidad: number; total: number }[];
  porMedio: { medio: string; total: number }[];
  porDiaSemana: { dia: string; total: number }[];
  porHora: { hora: number; total: number }[];
}

export async function indicadoresVentas(desde: Date, hasta: Date): Promise<IndicadoresVentas> {
  const ventas = await prisma.venta.findMany({
    where: { estado: "completada", creado_en: { gte: desde, lt: hasta } },
    select: { id: true, total_cobrado: true, total_lista: true, total_descuento: true, cantidad_asistentes: true, creado_en: true },
  });
  const ids = ventas.map((v) => v.id);

  const ingreso = ventas.reduce((a, v) => a + v.total_cobrado, 0);
  const asistentes = ventas.reduce((a, v) => a + v.cantidad_asistentes, 0);
  const totalLista = ventas.reduce((a, v) => a + v.total_lista, 0);
  const valorNoCobrado = ventas.reduce((a, v) => a + v.total_descuento, 0);

  // Por tipo de visitante
  const detalle = ids.length
    ? await prisma.ventaDetalle.findMany({ where: { venta_id: { in: ids } }, include: { tipo_visitante: true } })
    : [];
  const tipoAcc = new Map<string, { tipo: string; cantidad: number; total: number }>();
  for (const d of detalle) {
    const acc = tipoAcc.get(d.tipo_visitante.nombre) ?? { tipo: d.tipo_visitante.nombre, cantidad: 0, total: 0 };
    acc.cantidad += d.cantidad;
    acc.total += d.valor_cobrado * d.cantidad;
    tipoAcc.set(d.tipo_visitante.nombre, acc);
  }

  // Por medio de pago
  const pagos = ids.length
    ? await prisma.ventaPago.groupBy({ by: ["medio_pago_id"], where: { venta_id: { in: ids } }, _sum: { monto: true } })
    : [];
  const medios = await prisma.medioPago.findMany();
  const medioMap = new Map(medios.map((m) => [m.id, m.nombre]));
  const porMedio = pagos.map((p) => ({ medio: medioMap.get(p.medio_pago_id) ?? "?", total: p._sum.monto ?? 0 }));

  // Por día de semana y por hora (Bogotá)
  const diaAcc = new Array(7).fill(0);
  const horaAcc = new Map<number, number>();
  for (const v of ventas) {
    const b = aBogota(v.creado_en);
    diaAcc[b.getUTCDay()] += v.total_cobrado;
    horaAcc.set(b.getUTCHours(), (horaAcc.get(b.getUTCHours()) ?? 0) + v.total_cobrado);
  }

  return {
    numVentas: ventas.length,
    asistentes,
    ingreso,
    ticketPromedio: ventas.length ? Math.round(ingreso / ventas.length) : 0,
    valorNoCobrado,
    pctCortesias: totalLista ? (valorNoCobrado / totalLista) * 100 : 0,
    porTipo: [...tipoAcc.values()].sort((a, b) => b.total - a.total),
    porMedio: porMedio.sort((a, b) => b.total - a.total),
    porDiaSemana: diaAcc.map((total, i) => ({ dia: NOMBRES_DIA[i], total })).filter((d) => d.total > 0),
    porHora: [...horaAcc.entries()].map(([hora, total]) => ({ hora, total })).sort((a, b) => a.hora - b.hora),
  };
}
