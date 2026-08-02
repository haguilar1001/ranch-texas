import "dotenv/config";
import { prisma } from "../lib/db";
import { totalGasto } from "../lib/gastos/calculo";
import { rubrosPlano } from "../lib/gastos/rubros";

async function main() {
  console.log("\n🧾 Verificación F6 — gastos\n");
  const check = (cond: boolean, msg: string) => { console.log(`  ${cond ? "✓" : "✗"} ${msg}`); if (!cond) throw new Error("FALLO: " + msg); };

  const rubros = await rubrosPlano();
  const energia = rubros.find((r) => r.nombre === "Energía");
  const internet = rubros.find((r) => r.nombre === "Internet");
  check(!!energia && energia.grupo === "Servicios públicos", `Rubro 'Energía' roll-up a grupo 'Servicios públicos' (${energia?.grupo})`);
  check(!!internet && internet.grupoId === energia!.grupoId, "Energía e Internet comparten el mismo grupo");

  const admin = await prisma.usuario.findFirstOrThrow({ where: { rol: "administrador" } });
  const t1 = totalGasto({ base_gravable: 1000000, iva: 190000, retefuente: 0, reteica: 0, otras_retenciones: 0 });
  const t2 = totalGasto({ base_gravable: 200000, iva: 38000, retefuente: 0, reteica: 0, otras_retenciones: 0 });
  check(t1 === 1190000 && t2 === 238000, `Total gasto con IVA: 1.190.000 y 238.000 (${t1}, ${t2})`);

  const fecha = new Date();
  const g1 = await prisma.gasto.create({ data: { rubro_gasto_id: energia!.id, descripcion: "Luz test", fecha_gasto: fecha, base_gravable: 1000000, iva: 190000, total: t1, estado: "pendiente", creado_por: admin.id } });
  const g2 = await prisma.gasto.create({ data: { rubro_gasto_id: internet!.id, descripcion: "Internet test", fecha_gasto: fecha, base_gravable: 200000, iva: 38000, total: t2, estado: "pagado", pagado_en: fecha, creado_por: admin.id } });

  // Roll-up por grupo (como el reporte)
  const grupoDeRubro = new Map(rubros.map((r) => [r.id, r.grupoId]));
  const gastos = await prisma.gasto.findMany({ where: { id: { in: [g1.id, g2.id] } }, select: { rubro_gasto_id: true, total: true } });
  const porGrupo = new Map<string, number>();
  for (const g of gastos) {
    const gid = grupoDeRubro.get(g.rubro_gasto_id)!;
    porGrupo.set(gid, (porGrupo.get(gid) ?? 0) + g.total);
  }
  check(porGrupo.get(energia!.grupoId) === 1428000, `Grupo 'Servicios públicos' ejecutado = 1.428.000 (${porGrupo.get(energia!.grupoId)})`);

  await prisma.gasto.deleteMany({ where: { id: { in: [g1.id, g2.id] } } });
  console.log("  ✓ Limpieza completada");
  console.log("\n✅ F6 verificado.\n");
}

main().catch((e) => { console.error("❌", e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
