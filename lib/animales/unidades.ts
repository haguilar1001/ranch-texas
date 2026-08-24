// Conversión de unidades de alimento. Todo se lleva a una UNIDAD BASE entera
// (gramos para sólidos, mililitros para líquidos, unidades para lo indivisible)
// para no usar decimales: "800 g por perro" y "15 bultos al mes" conviven sin floats.

export interface AlimentoUnidad {
  /** Unidad de COMPRA del alimento: bulto, kg, litro, unidad... */
  unidad_medida: string;
  /** Gramos (o ml) que trae una unidad de compra. null = no convertible. */
  equivalencia_g: number | null;
  /** COP por unidad de compra. */
  costo_unitario?: number | null;
}

/** Unidades universales → cuántas unidades base vale cada una. */
const FACTORES: Record<string, number> = {
  g: 1,
  gr: 1,
  gramo: 1,
  gramos: 1,
  kg: 1000,
  kilo: 1000,
  kilos: 1000,
  kilogramo: 1000,
  kilogramos: 1000,
  lb: 500,
  libra: 500,
  libras: 500,
  ml: 1,
  mililitro: 1,
  mililitros: 1,
  l: 1000,
  lt: 1000,
  litro: 1000,
  litros: 1000,
  unidad: 1,
  unidades: 1,
  und: 1,
  u: 1,
};

/** minúsculas, sin tildes ni espacios sobrantes. */
export function normalizarUnidad(unidad: string): string {
  return unidad
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Cuántas unidades base vale 1 de `unidad` para este alimento.
 * Si la unidad es la de compra (p. ej. "bulto"), usa su equivalencia.
 * null = no se puede convertir (falta la equivalencia del alimento).
 */
export function factorBase(unidad: string, alimento: AlimentoUnidad): number | null {
  const u = normalizarUnidad(unidad);
  const compra = normalizarUnidad(alimento.unidad_medida);

  // La unidad de compra manda: si el alimento se compra por "kg", 1 kg es su equivalencia
  // declarada (o 1000 g por defecto). Esto evita que un "bulto" caiga en la tabla genérica.
  if (u === compra) return alimento.equivalencia_g ?? FACTORES[u] ?? null;

  const f = FACTORES[u];
  return f ?? null;
}

/** Convierte una cantidad a unidad base (g/ml/unidad). null si no es convertible. */
export function aBase(cantidad: number, unidad: string, alimento: AlimentoUnidad): number | null {
  const f = factorBase(unidad, alimento);
  if (f === null) return null;
  return Math.round(cantidad * f);
}

/** Cuántas unidades base trae una unidad de compra. null si no está declarada. */
export function baseporUnidadCompra(alimento: AlimentoUnidad): number | null {
  return factorBase(alimento.unidad_medida, alimento);
}

/** Costo en COP (entero) de una cantidad expresada en unidad base. null si falta el dato. */
export function costoCOP(cantidadBase: number, alimento: AlimentoUnidad): number | null {
  const porUnidad = baseporUnidadCompra(alimento);
  if (porUnidad === null || porUnidad === 0) return null;
  if (alimento.costo_unitario === null || alimento.costo_unitario === undefined) return null;
  return Math.round((cantidadBase / porUnidad) * alimento.costo_unitario);
}

/**
 * Presentación legible de una cantidad en unidad base: 8000 → "8 kg", 800 → "800 g",
 * 240000 con bulto de 40 kg → "240 kg (6 bultos)".
 */
export function formatearBase(cantidadBase: number, alimento: AlimentoUnidad): string {
  const compra = normalizarUnidad(alimento.unidad_medida);
  const esLiquido = ["l", "lt", "litro", "litros", "ml"].includes(compra);
  const esUnidad = ["unidad", "unidades", "und", "u"].includes(compra);

  if (esUnidad) return `${cantidadBase.toLocaleString("es-CO")} und`;

  const grande = esLiquido ? "L" : "kg";
  const chico = esLiquido ? "ml" : "g";
  const legible =
    cantidadBase >= 1000
      ? `${(cantidadBase / 1000).toLocaleString("es-CO", { maximumFractionDigits: 2 })} ${grande}`
      : `${cantidadBase.toLocaleString("es-CO")} ${chico}`;

  // Si se compra por presentación (bulto, saco...), mostrar también cuántas caben.
  const porUnidad = baseporUnidadCompra(alimento);
  const generica = FACTORES[compra] !== undefined;
  if (!generica && porUnidad) {
    const unidades = cantidadBase / porUnidad;
    return `${legible} (${unidades.toLocaleString("es-CO", { maximumFractionDigits: 2 })} ${alimento.unidad_medida}${unidades === 1 ? "" : "s"})`;
  }
  return legible;
}
