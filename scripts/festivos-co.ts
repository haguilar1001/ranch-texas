// Festivos de Colombia (Ley 35/1939 y Ley 51/1983 — "Ley Emiliani").
// Reglas:
//  - Festivos fijos que NO se trasladan.
//  - Festivos "Emiliani": si no caen lunes, se trasladan al lunes siguiente.
//  - Festivos relativos a la Pascua (Jueves/Viernes Santo no se trasladan;
//    Ascensión, Corpus Christi y Sagrado Corazón se cuentan desde Pascua y caen lunes).

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86_400_000);
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Domingo de Resurrección (Pascua) para el año dado — algoritmo de Gauss/Butcher (gregoriano). */
export function pascua(anio: number): Date {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31); // 3 = marzo, 4 = abril
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(anio, mes - 1, dia));
}

/** Traslada una fecha al lunes siguiente (si ya es lunes, la deja igual). */
function lunesSiguiente(d: Date): Date {
  const dow = d.getUTCDay(); // 0=domingo ... 6=sábado
  const delta = (1 - dow + 7) % 7;
  return addDays(d, delta);
}

/**
 * Devuelve el mapa de festivos del año: { "YYYY-MM-DD": "Nombre del festivo" }.
 */
export function festivosColombia(anio: number): Record<string, string> {
  const festivos: Record<string, string> = {};
  const fijo = (mes: number, dia: number) => new Date(Date.UTC(anio, mes - 1, dia));

  // Fijos (no se trasladan)
  festivos[iso(fijo(1, 1))] = "Año Nuevo";
  festivos[iso(fijo(5, 1))] = "Día del Trabajo";
  festivos[iso(fijo(7, 20))] = "Día de la Independencia";
  festivos[iso(fijo(8, 7))] = "Batalla de Boyacá";
  festivos[iso(fijo(12, 8))] = "Inmaculada Concepción";
  festivos[iso(fijo(12, 25))] = "Navidad";

  // Emiliani (trasladables al lunes siguiente)
  const emiliani: Array<[number, number, string]> = [
    [1, 6, "Reyes Magos"],
    [3, 19, "San José"],
    [6, 29, "San Pedro y San Pablo"],
    [8, 15, "Asunción de la Virgen"],
    [10, 12, "Día de la Raza"],
    [11, 1, "Todos los Santos"],
    [11, 11, "Independencia de Cartagena"],
  ];
  for (const [mes, dia, nombre] of emiliani) {
    festivos[iso(lunesSiguiente(fijo(mes, dia)))] = nombre;
  }

  // Relativos a la Pascua
  const p = pascua(anio);
  festivos[iso(addDays(p, -3))] = "Jueves Santo"; // no se traslada
  festivos[iso(addDays(p, -2))] = "Viernes Santo"; // no se traslada
  festivos[iso(lunesSiguiente(addDays(p, 39)))] = "Ascensión del Señor";
  festivos[iso(lunesSiguiente(addDays(p, 60)))] = "Corpus Christi";
  festivos[iso(lunesSiguiente(addDays(p, 68)))] = "Sagrado Corazón de Jesús";

  return festivos;
}

/** Semana Santa (domingo de ramos a domingo de resurrección) — para temporada alta. */
export function semanaSanta(anio: number): { desde: Date; hasta: Date } {
  const p = pascua(anio);
  return { desde: addDays(p, -7), hasta: p };
}
