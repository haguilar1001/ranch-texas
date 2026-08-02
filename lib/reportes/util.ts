// Utilidades puras para reportes.

/** Variación porcentual actual vs. anterior. null si no hay base (anterior = 0). */
export function variacionPct(actual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return ((actual - anterior) / anterior) * 100;
}

/** Formatea la variación como "+12,3%" / "−4,0%" / "—". */
export function formatearVariacion(v: number | null): string {
  if (v === null) return "—";
  const signo = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${signo}${Math.abs(v).toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}
