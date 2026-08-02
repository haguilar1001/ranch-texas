// Cálculo del total de un gasto (puro). Enteros COP.

export interface MontosGasto {
  base_gravable: number;
  iva: number;
  retefuente: number;
  reteica: number;
  otras_retenciones: number;
}

/** Total a pagar = base + IVA − retenciones. */
export function totalGasto(m: MontosGasto): number {
  return m.base_gravable + m.iva - m.retefuente - m.reteica - m.otras_retenciones;
}
