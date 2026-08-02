import { describe, it, expect } from "vitest";
import { textoManilla, construirEscPos, type DatosManilla } from "../lib/impresion";

const base: DatosManilla = {
  parque: "Ranch Texas",
  tipoVisitante: "Adulto",
  consecutivo: "1-1",
  payloadQr: "uuid-abc.firma-xyz",
  caja: "Caja 1",
  cajero: "Administrador",
  emitida: "2 ago 2026, 12:20",
  valida: "2 ago 2026, 23:59",
  esCortesia: false,
};

describe("texto de manilla", () => {
  it("incluye los datos clave", () => {
    const t = textoManilla(base);
    expect(t).toContain("RANCH TEXAS");
    expect(t).toContain("ADULTO");
    expect(t).toContain("1-1");
    expect(t).toContain("uuid-abc.firma-xyz");
    expect(t).toContain("Caja 1");
  });

  it("muestra CORTESÍA cuando corresponde", () => {
    const t = textoManilla({ ...base, esCortesia: true, tipoVisitante: "Adulto" });
    expect(t).toContain("CORTESÍA");
  });

  it("ESC/POS inicia con reset y termina con corte", () => {
    const bytes = construirEscPos(base);
    expect(bytes[0]).toBe(0x1b);
    expect(bytes[1]).toBe(0x40);
    expect(Array.from(bytes.slice(-3))).toEqual([0x1d, 0x56, 0x00]);
  });
});
