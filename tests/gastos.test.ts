import { describe, it, expect } from "vitest";
import { totalGasto } from "../lib/gastos/calculo";

describe("cálculo de gasto", () => {
  it("total = base + IVA − retenciones", () => {
    expect(totalGasto({ base_gravable: 1000000, iva: 190000, retefuente: 25000, reteica: 7000, otras_retenciones: 0 })).toBe(1158000);
  });
  it("sin impuestos ni retenciones = base", () => {
    expect(totalGasto({ base_gravable: 500000, iva: 0, retefuente: 0, reteica: 0, otras_retenciones: 0 })).toBe(500000);
  });
});
