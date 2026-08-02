// Cálculo del cierre de caja (puro, testeable). Todo en enteros COP.

// Denominaciones de peso colombiano para el conteo físico del efectivo.
export const DENOMINACIONES_COP = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];

export interface Conteo {
  denominacion: number;
  cantidad: number;
}

/** Total del conteo físico de efectivo (Σ denominación × cantidad). */
export function totalConteo(conteos: Conteo[]): number {
  return conteos.reduce((acc, c) => acc + c.denominacion * c.cantidad, 0);
}

export interface DatosEfectivoEsperado {
  base_inicial: number;
  ventasEfectivo: number;
  otrosIngresos: number;
  egresos: number;
}

/** Efectivo esperado en caja = base + ventas en efectivo + otros ingresos − egresos. */
export function efectivoEsperado(d: DatosEfectivoEsperado): number {
  return d.base_inicial + d.ventasEfectivo + d.otrosIngresos - d.egresos;
}

/** Diferencia = contado − esperado. Positivo = sobrante, negativo = faltante, 0 = cuadra. */
export function calcularDiferencia(contado: number, esperado: number): number {
  return contado - esperado;
}
