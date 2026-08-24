// Cálculo de la dieta. La regla clave del módulo:
//
//   modo = individual → `cantidad` es POR CABEZA  → se multiplica por el censo del grupo.
//   modo = grupal     → `cantidad` es el TOTAL del lote → no se multiplica.
//
// Y `frecuencia` dice a qué período corresponde esa cantidad (diaria, semanal, mensual...).
// Todo se devuelve en unidad BASE (g/ml/unidad) para poder sumar entre alimentos.

import { aBase, costoCOP, type AlimentoUnidad } from "./unidades";

export type ModoRacion = "individual" | "grupal";
export type FrecuenciaRacion = "diaria" | "semanal" | "quincenal" | "mensual";

/** Días que cubre cada frecuencia. El mes se toma de 30 días (convención del parque). */
export const DIAS_FRECUENCIA: Record<FrecuenciaRacion, number> = {
  diaria: 1,
  semanal: 7,
  quincenal: 15,
  mensual: 30,
};

export const DIAS_MES = 30;

export interface RacionCalculo {
  cantidad: number;
  unidad: string;
  modo: ModoRacion;
  frecuencia: FrecuenciaRacion;
}

/** Cantidad total del período, en la unidad de la ración (sin convertir). */
export function cantidadTotalPeriodo(racion: RacionCalculo, cabezas: number): number {
  const censo = Math.max(0, Math.trunc(cabezas));
  return racion.modo === "individual" ? racion.cantidad * censo : racion.cantidad;
}

/** Cantidad total del período en unidad base. null si el alimento no es convertible. */
export function consumoBasePeriodo(
  racion: RacionCalculo,
  cabezas: number,
  alimento: AlimentoUnidad,
): number | null {
  return aBase(cantidadTotalPeriodo(racion, cabezas), racion.unidad, alimento);
}

/** Consumo diario en unidad base (redondeado al entero). */
export function consumoBaseDiario(
  racion: RacionCalculo,
  cabezas: number,
  alimento: AlimentoUnidad,
): number | null {
  const periodo = consumoBasePeriodo(racion, cabezas, alimento);
  if (periodo === null) return null;
  return Math.round(periodo / DIAS_FRECUENCIA[racion.frecuencia]);
}

/** Consumo mensual (30 días) en unidad base. */
export function consumoBaseMensual(
  racion: RacionCalculo,
  cabezas: number,
  alimento: AlimentoUnidad,
): number | null {
  const periodo = consumoBasePeriodo(racion, cabezas, alimento);
  if (periodo === null) return null;
  return Math.round((periodo / DIAS_FRECUENCIA[racion.frecuencia]) * DIAS_MES);
}

/** Costo diario en COP entero. null si falta costo o equivalencia. */
export function costoDiario(
  racion: RacionCalculo,
  cabezas: number,
  alimento: AlimentoUnidad,
): number | null {
  const base = consumoBaseDiario(racion, cabezas, alimento);
  if (base === null) return null;
  return costoCOP(base, alimento);
}

/** Costo mensual (30 días) en COP entero. */
export function costoMensual(
  racion: RacionCalculo,
  cabezas: number,
  alimento: AlimentoUnidad,
): number | null {
  const base = consumoBaseMensual(racion, cabezas, alimento);
  if (base === null) return null;
  return costoCOP(base, alimento);
}

/**
 * Cuánto toca entregar HOY, en unidad base. La bitácora es un registro diario,
 * así que una ración mensual se prorratea al día (8 bultos/mes → 10,67 kg/día).
 * Es la cantidad que se le propone al operario y contra la que se compara lo entregado.
 */
export function cantidadPorEntrega(
  racion: RacionCalculo,
  cabezas: number,
  alimento: AlimentoUnidad,
): number | null {
  return consumoBaseDiario(racion, cabezas, alimento);
}

/**
 * La misma cantidad diaria pero lista para un formulario: en kg/L si es grande,
 * en g/ml si es pequeña. Evita pedirle al operario que escriba "10667 g".
 */
export function sugerenciaDeEntrega(
  racion: RacionCalculo,
  cabezas: number,
  alimento: AlimentoUnidad,
): { cantidad: string; unidad: string } | null {
  const base = cantidadPorEntrega(racion, cabezas, alimento);
  if (base === null) return null;
  const liquido = ["ml", "l", "lt", "litro", "litros"].includes(alimento.unidad_medida.toLowerCase());
  if (base >= 1000) {
    return { cantidad: String(Math.round(base / 10) / 100), unidad: liquido ? "litro" : "kg" };
  }
  return { cantidad: String(base), unidad: liquido ? "ml" : "g" };
}

/** Texto corto para la UI: "800 g por cabeza · diaria" / "5 kg al lote · diaria". */
export function describirRacion(racion: RacionCalculo): string {
  const destino = racion.modo === "individual" ? "por cabeza" : "al lote";
  return `${racion.cantidad.toLocaleString("es-CO")} ${racion.unidad} ${destino} · ${racion.frecuencia}`;
}
