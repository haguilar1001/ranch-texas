import { prisma } from "../db";
import { resumenTurno, type ResumenTurno, type LineaMedio, type LineaTipo } from "./resumen";
import { formatearFechaHoraBogota } from "../tiempo";

// Cuadre diario CONSOLIDADO: agrupa todos los turnos de un mismo día operativo (varias cajas y
// cajeros) en un solo resumen. El "día operativo" se define por la fecha (America/Bogota) en que
// se ABRIÓ el turno. La consolidación es pura y testeable; la consulta a BD reutiliza resumenTurno.

export interface EntradaTurnoDia {
  turnoId: string;
  caja: string;
  usuario: string;
  estado: string; // abierto | reabierto | cerrado
  abiertoEn: string;
  cerradoEn: string | null;
  resumen: ResumenTurno;
  efectivoContado: number | null;
  diferencia: number | null;
}

export interface DetalleTurnoDia {
  turnoId: string;
  caja: string;
  usuario: string;
  estado: string;
  abiertoEn: string;
  cerradoEn: string | null;
  totalVentas: number;
  esperado: number;
  contado: number | null;
  diferencia: number | null;
}

export interface ConsolidadoDia {
  fecha: string;
  turnos: number;
  turnosCerrados: number;
  turnosAbiertos: number;
  numVentas: number;
  totalVentas: number;
  asistentes: number;
  cortesias: number;
  anuladas: number;
  ventasPorMedio: LineaMedio[];
  ventasPorTipo: LineaTipo[];
  baseInicial: number;
  ventasEfectivo: number;
  otrosIngresos: number;
  egresos: number;
  esperadoEfectivo: number;
  efectivoContado: number; // solo turnos cerrados
  diferencia: number; // solo turnos cerrados
  detalle: DetalleTurnoDia[];
}

/** Consolida (PURO) los resúmenes de varios turnos en el cuadre de un día. Todo en enteros COP. */
export function consolidarDia(fecha: string, entradas: EntradaTurnoDia[]): ConsolidadoDia {
  const porMedio = new Map<string, LineaMedio>();
  const porTipo = new Map<string, LineaTipo>();

  const acc: ConsolidadoDia = {
    fecha,
    turnos: entradas.length,
    turnosCerrados: 0,
    turnosAbiertos: 0,
    numVentas: 0,
    totalVentas: 0,
    asistentes: 0,
    cortesias: 0,
    anuladas: 0,
    ventasPorMedio: [],
    ventasPorTipo: [],
    baseInicial: 0,
    ventasEfectivo: 0,
    otrosIngresos: 0,
    egresos: 0,
    esperadoEfectivo: 0,
    efectivoContado: 0,
    diferencia: 0,
    detalle: [],
  };

  for (const e of entradas) {
    const r = e.resumen;
    const cerrado = e.estado === "cerrado";
    if (cerrado) acc.turnosCerrados += 1;
    else acc.turnosAbiertos += 1;

    acc.numVentas += r.numVentas;
    acc.totalVentas += r.totalVentas;
    acc.asistentes += r.asistentes;
    acc.cortesias += r.cortesias;
    acc.anuladas += r.anuladas;
    acc.baseInicial += r.base_inicial;
    acc.ventasEfectivo += r.ventasEfectivo;
    acc.otrosIngresos += r.otrosIngresos;
    acc.egresos += r.egresos;
    acc.esperadoEfectivo += r.esperadoEfectivo;

    // El contado y la diferencia solo tienen sentido en turnos cerrados.
    if (cerrado) {
      acc.efectivoContado += e.efectivoContado ?? 0;
      acc.diferencia += e.diferencia ?? 0;
    }

    for (const m of r.ventasPorMedio) {
      const prev = porMedio.get(m.codigo);
      if (prev) prev.total += m.total;
      else porMedio.set(m.codigo, { ...m });
    }
    for (const t of r.ventasPorTipo) {
      const prev = porTipo.get(t.tipo);
      if (prev) { prev.cantidad += t.cantidad; prev.total += t.total; }
      else porTipo.set(t.tipo, { ...t });
    }

    acc.detalle.push({
      turnoId: e.turnoId,
      caja: e.caja,
      usuario: e.usuario,
      estado: e.estado,
      abiertoEn: e.abiertoEn,
      cerradoEn: e.cerradoEn,
      totalVentas: r.totalVentas,
      esperado: r.esperadoEfectivo,
      contado: cerrado ? e.efectivoContado ?? 0 : null,
      diferencia: cerrado ? e.diferencia ?? 0 : null,
    });
  }

  acc.ventasPorMedio = [...porMedio.values()].sort((a, b) => b.total - a.total);
  acc.ventasPorTipo = [...porTipo.values()].sort((a, b) => b.total - a.total);
  return acc;
}

/** Límites del día operativo (00:00:00 a 23:59:59.999 hora Bogotá) para una fecha YYYY-MM-DD. */
export function limitesDiaOperativo(fecha: string): { inicio: Date; fin: Date } {
  return {
    inicio: new Date(`${fecha}T00:00:00.000-05:00`),
    fin: new Date(`${fecha}T23:59:59.999-05:00`),
  };
}

/** Cuadre diario consolidado de todos los turnos abiertos en la fecha dada (YYYY-MM-DD, Bogotá). */
export async function cuadreDiario(fecha: string): Promise<ConsolidadoDia> {
  const { inicio, fin } = limitesDiaOperativo(fecha);
  const turnos = await prisma.turnoCaja.findMany({
    where: { abierto_en: { gte: inicio, lte: fin } },
    include: { caja: true, usuario: { select: { nombre: true } } },
    orderBy: [{ caja: { nombre: "asc" } }, { abierto_en: "asc" }],
  });

  const entradas: EntradaTurnoDia[] = [];
  for (const t of turnos) {
    entradas.push({
      turnoId: t.id,
      caja: t.caja.nombre,
      usuario: t.usuario.nombre,
      estado: t.estado,
      abiertoEn: formatearFechaHoraBogota(t.abierto_en),
      cerradoEn: t.cerrado_en ? formatearFechaHoraBogota(t.cerrado_en) : null,
      resumen: await resumenTurno(t.id),
      efectivoContado: t.efectivo_contado,
      diferencia: t.diferencia,
    });
  }

  return consolidarDia(fecha, entradas);
}
