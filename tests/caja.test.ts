import { describe, it, expect } from "vitest";
import { totalConteo, efectivoEsperado, calcularDiferencia } from "../lib/caja/cierre";
import { consolidarDia, type EntradaTurnoDia } from "../lib/caja/cuadreDiario";
import type { ResumenTurno } from "../lib/caja/resumen";

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

describe("cuadre diario consolidado", () => {
  const resumen = (over: Partial<ResumenTurno>): ResumenTurno => ({
    base_inicial: 0, numVentas: 0, totalVentas: 0, asistentes: 0, cortesias: 0, anuladas: 0,
    ventasPorMedio: [], ventasPorTipo: [], ventasEfectivo: 0, otrosIngresos: 0, egresos: 0,
    esperadoEfectivo: 0, ...over,
  });
  const entrada = (over: Partial<EntradaTurnoDia>): EntradaTurnoDia => ({
    turnoId: "t", caja: "Caja 1", usuario: "Ana", estado: "cerrado", abiertoEn: "", cerradoEn: null,
    resumen: resumen({}), efectivoContado: null, diferencia: null, ...over,
  });

  it("suma totales y cuenta turnos abiertos/cerrados", () => {
    const c = consolidarDia("2026-08-10", [
      entrada({ turnoId: "a", estado: "cerrado", resumen: resumen({ numVentas: 3, totalVentas: 180000, asistentes: 3, base_inicial: 200000, esperadoEfectivo: 380000 }), efectivoContado: 385000, diferencia: 5000 }),
      entrada({ turnoId: "b", caja: "Caja 2", estado: "abierto", resumen: resumen({ numVentas: 2, totalVentas: 120000, asistentes: 2, base_inicial: 100000, esperadoEfectivo: 220000 }) }),
    ]);
    expect(c.turnos).toBe(2);
    expect(c.turnosCerrados).toBe(1);
    expect(c.turnosAbiertos).toBe(1);
    expect(c.numVentas).toBe(5);
    expect(c.totalVentas).toBe(300000);
    expect(c.asistentes).toBe(5);
    expect(c.baseInicial).toBe(300000);
    expect(c.esperadoEfectivo).toBe(600000);
  });

  it("contado y diferencia solo cuentan turnos cerrados", () => {
    const c = consolidarDia("2026-08-10", [
      entrada({ estado: "cerrado", efectivoContado: 300000, diferencia: -5000 }),
      entrada({ estado: "abierto", efectivoContado: 999999, diferencia: 999999 }),
    ]);
    expect(c.efectivoContado).toBe(300000);
    expect(c.diferencia).toBe(-5000);
    expect(c.detalle.find((d) => d.estado === "abierto")?.contado).toBeNull();
  });

  it("agrega ventas por medio y por tipo entre cajas", () => {
    const c = consolidarDia("2026-08-10", [
      entrada({ resumen: resumen({
        ventasPorMedio: [{ medio: "Efectivo", codigo: "efectivo", es_efectivo: true, total: 100000 }],
        ventasPorTipo: [{ tipo: "Adulto", cantidad: 2, total: 120000 }],
      }) }),
      entrada({ caja: "Caja 2", resumen: resumen({
        ventasPorMedio: [{ medio: "Efectivo", codigo: "efectivo", es_efectivo: true, total: 60000 }],
        ventasPorTipo: [{ tipo: "Adulto", cantidad: 1, total: 60000 }],
      }) }),
    ]);
    expect(c.ventasPorMedio).toHaveLength(1);
    expect(c.ventasPorMedio[0].total).toBe(160000);
    expect(c.ventasPorTipo[0]).toMatchObject({ tipo: "Adulto", cantidad: 3, total: 180000 });
  });
});
