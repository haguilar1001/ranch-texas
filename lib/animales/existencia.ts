// Kardex del alimento. La existencia NUNCA se escribe a mano: se recalcula desde
// los movimientos, igual que el total de una venta se recalcula desde su detalle.
//
//   entrada → suma (compra, donación)
//   salida  → resta (entrega a los animales, merma)
//   ajuste  → FIJA el saldo (conteo físico): lo anterior deja de importar.

export type TipoMovimientoAlimento = "entrada" | "salida" | "ajuste";

export interface MovimientoCalculo {
  tipo: TipoMovimientoAlimento;
  /** Siempre en unidad base (g/ml/unidad) y no negativo. */
  cantidad_base: number;
  fecha: Date;
}

/**
 * Existencia resultante en unidad base. Los movimientos se ordenan por fecha
 * (el ajuste más reciente borra la historia anterior).
 */
export function calcularExistencia(movimientos: MovimientoCalculo[]): number {
  const ordenados = [...movimientos].sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  let saldo = 0;
  for (const m of ordenados) {
    if (m.tipo === "ajuste") saldo = m.cantidad_base;
    else if (m.tipo === "entrada") saldo += m.cantidad_base;
    else saldo -= m.cantidad_base;
  }
  return saldo;
}

/** ¿La entrega deja el inventario en negativo? (se permite, pero se avisa). */
export function quedaEnNegativo(existenciaActual: number | null, entrega: number): boolean {
  if (existenciaActual === null) return false;
  return existenciaActual - entrega < 0;
}

/**
 * Días de autonomía que quedan con la existencia actual y un consumo diario dado.
 * null si no hay consumo o no hay existencia registrada.
 */
export function diasDeAutonomia(existenciaBase: number | null, consumoDiarioBase: number): number | null {
  if (existenciaBase === null || consumoDiarioBase <= 0) return null;
  return Math.floor(existenciaBase / consumoDiarioBase);
}
