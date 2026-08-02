// Genera las filas de dim_fecha para un rango de años.
// Solo banderas informativas para reportes/Power BI; NO restringe la operación.

import { festivosColombia, semanaSanta } from "./festivos-co";

const NOMBRES_MES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const NOMBRES_DIA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export interface FilaDimFecha {
  fecha: Date;
  anio: number;
  mes: number;
  dia: number;
  trimestre: number;
  semana_iso: number;
  nombre_dia: string;
  nombre_mes: string;
  dia_semana: number; // 1=lunes ... 7=domingo
  es_fin_semana: boolean;
  es_festivo: boolean;
  nombre_festivo: string | null;
  es_temporada_alta: boolean;
}

function semanaISO(d: Date): number {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = (t.getUTCDay() + 6) % 7; // lunes=0
  t.setUTCDate(t.getUTCDate() - dow + 3); // jueves de esta semana
  const primerJueves = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const dowPJ = (primerJueves.getUTCDay() + 6) % 7;
  primerJueves.setUTCDate(primerJueves.getUTCDate() - dowPJ + 3);
  return 1 + Math.round((t.getTime() - primerJueves.getTime()) / (7 * 86_400_000));
}

/** Heurística inicial de temporada alta (editable después por admin). */
function esTemporadaAlta(d: Date, ss: { desde: Date; hasta: Date }): boolean {
  const mes = d.getUTCMonth() + 1;
  if (mes === 1 || mes === 6 || mes === 7 || mes === 12) return true; // vacaciones
  return d >= ss.desde && d <= ss.hasta; // Semana Santa
}

export function filasDimFecha(desdeAnio: number, hastaAnio: number): FilaDimFecha[] {
  const filas: FilaDimFecha[] = [];
  for (let anio = desdeAnio; anio <= hastaAnio; anio++) {
    const festivos = festivosColombia(anio);
    const ss = semanaSanta(anio);
    let d = new Date(Date.UTC(anio, 0, 1));
    const fin = new Date(Date.UTC(anio, 11, 31));
    while (d <= fin) {
      const key = d.toISOString().slice(0, 10);
      const dow = d.getUTCDay(); // 0=domingo
      const diaSemana = dow === 0 ? 7 : dow; // 1=lunes ... 7=domingo
      const nombreFestivo = festivos[key] ?? null;
      filas.push({
        fecha: new Date(d),
        anio,
        mes: d.getUTCMonth() + 1,
        dia: d.getUTCDate(),
        trimestre: Math.floor(d.getUTCMonth() / 3) + 1,
        semana_iso: semanaISO(d),
        nombre_dia: NOMBRES_DIA[dow],
        nombre_mes: NOMBRES_MES[d.getUTCMonth()],
        dia_semana: diaSemana,
        es_fin_semana: dow === 0 || dow === 6,
        es_festivo: nombreFestivo !== null,
        nombre_festivo: nombreFestivo,
        es_temporada_alta: esTemporadaAlta(d, ss),
      });
      d = new Date(d.getTime() + 86_400_000);
    }
  }
  return filas;
}
