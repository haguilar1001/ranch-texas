import { describe, it, expect } from "vitest";
import { variacionPct, formatearVariacion } from "../lib/reportes/util";

describe("variación porcentual", () => {
  it("calcula la variación", () => {
    expect(variacionPct(120, 100)).toBeCloseTo(20);
    expect(variacionPct(80, 100)).toBeCloseTo(-20);
    expect(variacionPct(100, 100)).toBe(0);
  });
  it("null cuando no hay base", () => {
    expect(variacionPct(100, 0)).toBeNull();
  });
  it("formatea con signo", () => {
    expect(formatearVariacion(20)).toBe("+20,0%");
    expect(formatearVariacion(-4)).toBe("−4,0%");
    expect(formatearVariacion(null)).toBe("—");
  });
});
