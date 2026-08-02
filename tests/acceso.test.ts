import { describe, it, expect } from "vitest";
import { evaluarAcceso, type ReglaPunto, type ContextoAcceso } from "../lib/acceso/validar";

const AHORA = new Date("2026-08-02T15:00:00-05:00");

const ctxBase: ContextoAcceso = {
  firmaValida: true,
  manilla: { estado: "activa", vencimiento: new Date("2026-08-02T23:59:59-05:00") },
  tieneConsentimiento: false,
  ingresosPrevios: 0,
  ultimoSentido: null,
  aforoActual: 0,
  ahora: AHORA,
};

const entradaSalida: ReglaPunto = { tipo_regla: "entrada_salida", requiere_consentimiento: false, aforo_maximo: 3000 };
const unIngreso: ReglaPunto = { tipo_regla: "un_ingreso", requiere_consentimiento: false, aforo_maximo: null };
const conConsentimiento: ReglaPunto = { tipo_regla: "reingreso", requiere_consentimiento: true, aforo_maximo: null };

describe("control de acceso", () => {
  it("permite entrada de una manilla activa", () => {
    const r = evaluarAcceso(entradaSalida, ctxBase);
    expect(r).toEqual({ permitido: true, sentido: "entrada" });
  });

  it("rechaza firma inválida", () => {
    expect(evaluarAcceso(entradaSalida, { ...ctxBase, firmaValida: false }).motivo).toBe("firma_invalida");
  });

  it("rechaza manilla inexistente, anulada o vencida", () => {
    expect(evaluarAcceso(entradaSalida, { ...ctxBase, manilla: null }).motivo).toBe("no_existe");
    expect(evaluarAcceso(entradaSalida, { ...ctxBase, manilla: { estado: "anulada", vencimiento: null } }).motivo).toBe("anulada");
    expect(evaluarAcceso(entradaSalida, { ...ctxBase, manilla: { estado: "activa", vencimiento: new Date("2026-08-01T23:59:59-05:00") } }).motivo).toBe("vencida");
  });

  it("un_ingreso: primer acceso permitido, segundo denegado", () => {
    expect(evaluarAcceso(unIngreso, ctxBase).permitido).toBe(true);
    expect(evaluarAcceso(unIngreso, { ...ctxBase, ingresosPrevios: 1 }).motivo).toBe("ya_usada");
    expect(evaluarAcceso(unIngreso, { ...ctxBase, manilla: { estado: "usada", vencimiento: null } }).motivo).toBe("ya_usada");
  });

  it("entrada_salida: alterna entrada y salida", () => {
    expect(evaluarAcceso(entradaSalida, { ...ctxBase, ultimoSentido: null }).sentido).toBe("entrada");
    expect(evaluarAcceso(entradaSalida, { ...ctxBase, ultimoSentido: "entrada" }).sentido).toBe("salida");
    expect(evaluarAcceso(entradaSalida, { ...ctxBase, ultimoSentido: "salida" }).sentido).toBe("entrada");
  });

  it("la salida no exige consentimiento ni aforo", () => {
    const r = evaluarAcceso(
      { tipo_regla: "entrada_salida", requiere_consentimiento: true, aforo_maximo: 0 },
      { ...ctxBase, ultimoSentido: "entrada", tieneConsentimiento: false, aforoActual: 999 },
    );
    expect(r).toEqual({ permitido: true, sentido: "salida" });
  });

  it("exige consentimiento cuando el punto lo requiere", () => {
    expect(evaluarAcceso(conConsentimiento, { ...ctxBase, tieneConsentimiento: false }).motivo).toBe("falta_consentimiento");
    expect(evaluarAcceso(conConsentimiento, { ...ctxBase, tieneConsentimiento: true }).permitido).toBe(true);
  });

  it("rechaza cuando el aforo está lleno (solo en entrada)", () => {
    expect(evaluarAcceso(entradaSalida, { ...ctxBase, aforoActual: 3000 }).motivo).toBe("aforo_lleno");
    expect(evaluarAcceso(entradaSalida, { ...ctxBase, aforoActual: 2999 }).permitido).toBe(true);
  });
});
