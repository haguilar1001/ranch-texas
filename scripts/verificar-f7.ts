import "dotenv/config";
import { prisma } from "../lib/db";
import { comparativoAnual, resumenAnual } from "../lib/reportes/comparativo";
import { variacionPct } from "../lib/reportes/util";

async function main() {
  console.log("\n📈 Verificación F7 — reportes / comparativo\n");
  const check = (cond: boolean, msg: string) => { console.log(`  ${cond ? "✓" : "✗"} ${msg}`); if (!cond) throw new Error("FALLO: " + msg); };

  const resumen = await resumenAnual();
  const t2023 = resumen.find((r) => r.anio === 2023)?.total;
  const t2024 = resumen.find((r) => r.anio === 2024)?.total;
  check(t2023 === 5096947030, `Total 2023 = 5.096.947.030 (${t2023})`);
  check(t2024 === 4474715300, `Total 2024 = 4.474.715.300 (${t2024})`);

  const comp = await comparativoAnual(2024);
  check(comp.totalActual === 4474715300, `Comparativo 2024: total actual = 4.474.715.300 (${comp.totalActual})`);
  check(comp.totalAnterior === 5096947030, `Comparativo 2024: total anterior (2023) = 5.096.947.030 (${comp.totalAnterior})`);
  const sumaMeses = comp.meses.reduce((a, m) => a + m.actual, 0);
  check(sumaMeses === comp.totalActual, "Suma de meses = total anual");
  check(comp.meses.length === 12, "12 meses en el comparativo");

  const v = variacionPct(comp.totalActual, comp.totalAnterior);
  check(v !== null && v < 0, `Variación 2024 vs 2023 negativa (${v?.toFixed(1)}%)`);

  // Filtro por producto ENTRADAS
  const compEnt = await comparativoAnual(2024, "ENTRADAS");
  check(compEnt.totalActual > 0 && compEnt.totalActual < comp.totalActual, "Filtro por producto ENTRADAS reduce el total");

  console.log("\n✅ F7 verificado.\n");
}

main().catch((e) => { console.error("❌", e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
