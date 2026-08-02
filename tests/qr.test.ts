import { describe, it, expect } from "vitest";
import { construirPayload, verificarPayload, firmarUuid, generarManilla } from "../lib/qr/firma";

const CLAVE = "clave-de-prueba-super-secreta";
const OTRA = "otra-clave-distinta";
const UUID = "11111111-1111-4111-8111-111111111111";

describe("firma del QR", () => {
  it("firma y verifica ida y vuelta", () => {
    const payload = construirPayload(UUID, CLAVE);
    const r = verificarPayload(payload, CLAVE);
    expect(r.valido).toBe(true);
    if (r.valido) expect(r.uuid).toBe(UUID);
  });

  it("rechaza firma alterada", () => {
    const payload = construirPayload(UUID, CLAVE) + "x";
    const r = verificarPayload(payload, CLAVE);
    expect(r.valido).toBe(false);
    if (!r.valido) expect(r.motivo).toBe("firma_invalida");
  });

  it("rechaza uuid alterado (firma no coincide)", () => {
    const firma = firmarUuid(UUID, CLAVE);
    const payload = `22222222-2222-4222-8222-222222222222.${firma}`;
    const r = verificarPayload(payload, CLAVE);
    expect(r.valido).toBe(false);
  });

  it("rechaza clave distinta", () => {
    const payload = construirPayload(UUID, CLAVE);
    const r = verificarPayload(payload, OTRA);
    expect(r.valido).toBe(false);
  });

  it("rechaza payload malformado sin lanzar excepción", () => {
    expect(verificarPayload("sin-punto", CLAVE).valido).toBe(false);
    expect(verificarPayload("", CLAVE).valido).toBe(false);
    expect(verificarPayload(".", CLAVE).valido).toBe(false);
  });

  it("genera manillas con uuid único y payload válido", () => {
    const m1 = generarManilla(CLAVE);
    const m2 = generarManilla(CLAVE);
    expect(m1.uuid).not.toBe(m2.uuid);
    expect(verificarPayload(m1.payload, CLAVE).valido).toBe(true);
  });
});
