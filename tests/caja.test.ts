import { describe, it, expect } from "vitest";
import { totalConteo, efectivoEsperado, calcularDiferencia } from "../lib/caja/cierre";

describe("cierre de caja", () => {
  it("suma el conteo por denominación", () => {
    const t = totalConteo([
      { denominacion: 50000, cantidad: 3 }, // 150000
      { denominacion: 10000, cantidad: 5 }, // 50000
      { denominacion: 1000, cantidad: 7 },  // 7000
    ]);
    expect(t).toBe(207000);
  });

  it("efectivo esperado = base + ventas efectivo + otros ingresos − egresos", () => {
    expect(efectivoEsperado({ base_inicial: 200000, ventasEfectivo: 480000, otrosIngresos: 50000, egresos: 30000 })).toBe(700000);
  });

  it("diferencia con signo (sobrante / faltante / cuadra)", () => {
    expect(calcularDiferencia(700000, 700000)).toBe(0); // cuadra
    expect(calcularDiferencia(705000, 700000)).toBe(5000); // sobrante
    expect(calcularDiferencia(690000, 700000)).toBe(-10000); // faltante
  });
});
