import { describe, it, expect } from "vitest";
import { pascua, festivosColombia } from "../scripts/festivos-co";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

describe("festivos Colombia", () => {
  it("calcula la Pascua correctamente", () => {
    expect(iso(pascua(2024))).toBe("2024-03-31");
    expect(iso(pascua(2025))).toBe("2025-04-20");
    expect(iso(pascua(2026))).toBe("2026-04-05");
  });

  it("mantiene los festivos fijos (no se trasladan)", () => {
    const f = festivosColombia(2025);
    expect(f["2025-01-01"]).toBe("Año Nuevo");
    expect(f["2025-05-01"]).toBe("Día del Trabajo");
    expect(f["2025-07-20"]).toBe("Día de la Independencia");
    expect(f["2025-08-07"]).toBe("Batalla de Boyacá");
    expect(f["2025-12-25"]).toBe("Navidad");
  });

  it("aplica traslado Emiliani al lunes siguiente", () => {
    const f = festivosColombia(2025);
    // 19 de marzo de 2025 (miércoles) → San José se corre al lunes 24
    expect(f["2025-03-19"]).toBeUndefined();
    expect(f["2025-03-24"]).toBe("San José");
    // 6 de enero de 2025 ya es lunes → se mantiene
    expect(f["2025-01-06"]).toBe("Reyes Magos");
  });

  it("incluye Jueves y Viernes Santo sin traslado", () => {
    const f = festivosColombia(2025); // Pascua 2025-04-20
    expect(f["2025-04-17"]).toBe("Jueves Santo");
    expect(f["2025-04-18"]).toBe("Viernes Santo");
  });
});
