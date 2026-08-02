import { prisma } from "../db";

// Comparativos año vs. año a partir de la venta histórica (tabla ventas_historicas).

export async function productosVentaHistorica(): Promise<string[]> {
  const rows = await prisma.ventaHistorica.findMany({ distinct: ["producto"], select: { producto: true }, orderBy: { producto: "asc" } });
  return rows.map((r) => r.producto);
}

export async function resumenAnual(producto?: string): Promise<{ anio: number; total: number }[]> {
  const rows = await prisma.ventaHistorica.groupBy({
    by: ["anio"],
    where: producto ? { producto } : {},
    _sum: { valor: true },
    orderBy: { anio: "asc" },
  });
  return rows.map((r) => ({ anio: r.anio, total: r._sum.valor ?? 0 }));
}

export interface FilaMesComparativo {
  mes: number;
  anterior: number;
  actual: number;
}

export interface Comparativo {
  meses: FilaMesComparativo[];
  totalActual: number;
  totalAnterior: number;
}

/** Comparativo mensual del año vs. el año anterior (opcionalmente por producto). */
export async function comparativoAnual(anio: number, producto?: string): Promise<Comparativo> {
  const where = (a: number) => ({ anio: a, ...(producto ? { producto } : {}) });
  const [act, ant] = await Promise.all([
    prisma.ventaHistorica.groupBy({ by: ["mes"], where: where(anio), _sum: { valor: true } }),
    prisma.ventaHistorica.groupBy({ by: ["mes"], where: where(anio - 1), _sum: { valor: true } }),
  ]);
  const actMap = new Map(act.map((r) => [r.mes, r._sum.valor ?? 0]));
  const antMap = new Map(ant.map((r) => [r.mes, r._sum.valor ?? 0]));
  const meses = Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    actual: actMap.get(i + 1) ?? 0,
    anterior: antMap.get(i + 1) ?? 0,
  }));
  return {
    meses,
    totalActual: meses.reduce((a, m) => a + m.actual, 0),
    totalAnterior: meses.reduce((a, m) => a + m.anterior, 0),
  };
}
