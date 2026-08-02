import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { prisma } from "../lib/db";

// Export CSV diario de las vistas analíticas (plan B para Power BI / respaldo).
// Uso: npm run export:analitica   (carpeta configurable con EXPORT_DIR, por defecto ./export)

const VISTAS = [
  "dim_fecha", "dim_tipo_visitante", "dim_medio_pago", "dim_atraccion", "dim_cajero", "dim_rubro_gasto",
  "hechos_ventas", "hechos_ventas_pagos", "hechos_accesos", "hechos_gastos", "hechos_cuadre_caja", "hechos_ventas_historicas",
];

function celda(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}

function aCsv(filas: Record<string, unknown>[]): string {
  if (filas.length === 0) return "";
  const cols = Object.keys(filas[0]);
  const linea = (vals: string[]) => vals.map((c) => `"${c.replace(/"/g, '""')}"`).join(";");
  return "﻿" + [linea(cols), ...filas.map((f) => linea(cols.map((c) => celda(f[c]))))].join("\r\n");
}

async function main() {
  const dir = process.env.EXPORT_DIR || "./export";
  fs.mkdirSync(dir, { recursive: true });
  console.log(`\n📤 Exportando vistas analíticas a ${path.resolve(dir)}\n`);

  for (const vista of VISTAS) {
    const filas = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(`SELECT * FROM analitica.${vista}`);
    const archivo = path.join(dir, `${vista}.csv`);
    fs.writeFileSync(archivo, aCsv(filas), "utf8");
    console.log(`  ✓ ${vista}.csv (${filas.length} filas)`);
  }
  console.log("\n✅ Export completado.\n");
}

main().catch((e) => { console.error("❌", e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
