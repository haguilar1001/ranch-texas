import { describe, it, expect } from "vitest";
import { validarConsentimiento, type EntradaConsentimiento } from "../lib/consentimiento/validar";

const base: EntradaConsentimiento = {
  payload: "uuid.firma",
  atraccion_id: "atr-1",
  nombre_firmante: "Juan Pérez",
  documento_firmante: "123456",
  es_menor: false,
  acepta: true,
  firma_imagen: "data:image/png;base64,AAAA",
};

describe("validación de consentimiento", () => {
  it("acepta uno bien formado", () => {
    expect(validarConsentimiento(base)).toEqual({ ok: true, errores: [] });
  });

  it("exige aceptación y firma", () => {
    expect(validarConsentimiento({ ...base, acepta: false }).ok).toBe(false);
    expect(validarConsentimiento({ ...base, firma_imagen: "" }).ok).toBe(false);
    expect(validarConsentimiento({ ...base, firma_imagen: "no-es-imagen" }).ok).toBe(false);
  });

  it("exige nombre y documento", () => {
    expect(validarConsentimiento({ ...base, nombre_firmante: "" }).ok).toBe(false);
    expect(validarConsentimiento({ ...base, documento_firmante: "  " }).ok).toBe(false);
  });

  it("menor de edad exige datos del acudiente", () => {
    const r = validarConsentimiento({ ...base, es_menor: true });
    expect(r.ok).toBe(false);
    expect(r.errores.some((e) => e.includes("acudiente"))).toBe(true);
  });

  it("menor con acudiente completo es válido", () => {
    const r = validarConsentimiento({
      ...base,
      es_menor: true,
      nombre_acudiente: "María Pérez",
      documento_acudiente: "987654",
      parentesco: "Madre",
    });
    expect(r.ok).toBe(true);
  });
});
