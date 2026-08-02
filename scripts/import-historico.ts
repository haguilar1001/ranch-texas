import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

// Importa venta histórica (por fecha y línea de producto) desde el/los Excel de operación anterior
// a la tabla `ventas_historicas`. Es data AGREGADA (no transaccional), separada del modelo en vivo,
// que alimenta los comparativos año vs año en Power BI.
//
// Estructura esperada en la hoja "Datos": columnas FECHA / PRODUCTO / VALOR / NEGOCIO (en cualquier
// posición; el encabezado se detecta por nombre). Filas sin VALOR o sin FECHA se omiten.
//
// REFRESCO COMPLETO por `origen` (nombre del archivo): reimportar un archivo reemplaza solo sus filas.
//
// Uso:
//   tsx scripts/import-historico.ts "<archivo.xlsx | carpeta>"
//   npm run import:historico -- "D:/Datos/13 - Ventas No Salud"

const prisma = new PrismaClient();

const OBJETIVO = ["FECHA", "PRODUCTO", "VALOR", "NEGOCIO"] as const;
const CORTE_VACIAS = 1000; // filas consecutivas vacías → fin de datos (hojas con rango inflado)

interface Cols { FECHA: number; PRODUCTO: number; VALOR: number; NEGOCIO: number }

function cellVal(ws: XLSX.WorkSheet, r: number, c: number): unknown {
  const cell = ws[XLSX.utils.encode_cell({ r, c })];
  return cell ? cell.v : null;
}

function detectarEncabezado(ws: XLSX.WorkSheet, rangoInicioR: number): { fila: number; cols: Cols } | null {
  const ref = ws["!ref"];
  if (!ref) return null;
  const rango = XLSX.utils.decode_range(ref);
  const finBusqueda = Math.min(rango.e.r, rangoInicioR + 25);
  for (let r = rango.s.r; r <= finBusqueda; r++) {
    const mapa: Record<string, number> = {};
    for (let c = rango.s.c; c <= rango.e.c; c++) {
      const v = cellVal(ws, r, c);
      if (v != null) {
        const key = String(v).trim().toUpperCase();
        if ((OBJETIVO as readonly string[]).includes(key) && mapa[key] === undefined) mapa[key] = c;
      }
    }
    const hits = OBJETIVO.filter((o) => mapa[o] !== undefined);
    if (hits.length >= 3 && mapa.FECHA !== undefined && mapa.PRODUCTO !== undefined && mapa.VALOR !== undefined) {
      return {
        fila: r,
        cols: {
          FECHA: mapa.FECHA,
          PRODUCTO: mapa.PRODUCTO,
          VALOR: mapa.VALOR,
          NEGOCIO: mapa.NEGOCIO ?? -1,
        },
      };
    }
  }
  return null;
}

function aFechaUTC(v: unknown): Date | null {
  if (v instanceof Date) return new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate()));
  return null;
}

interface FilaHist {
  fecha: Date; anio: number; mes: number; producto: string; valor: number; negocio: string; origen: string;
}

async function importarArchivo(archivo: string): Promise<{ negocios: Record<string, { filas: number; total: number }>; omitidas: number }> {
  const origen = `excel:${path.basename(archivo)}`;
  const wb = XLSX.readFile(archivo, { cellDates: true });
  const ws = wb.Sheets["Datos"] ?? wb.Sheets[wb.SheetNames[0]];
  if (!ws || !ws["!ref"]) throw new Error(`Sin datos legibles en ${path.basename(archivo)}`);

  const rango = XLSX.utils.decode_range(ws["!ref"]);
  const enc = detectarEncabezado(ws, rango.s.r);
  if (!enc) throw new Error(`No se detectó encabezado FECHA/PRODUCTO/VALOR en ${path.basename(archivo)}`);

  const filas: FilaHist[] = [];
  let omitidas = 0;
  let vaciasSeguidas = 0;
  const negocios: Record<string, { filas: number; total: number }> = {};

  for (let r = enc.fila + 1; r <= rango.e.r; r++) {
    const rawF = cellVal(ws, r, enc.cols.FECHA);
    const rawP = cellVal(ws, r, enc.cols.PRODUCTO);
    const rawV = cellVal(ws, r, enc.cols.VALOR);
    const rawN = enc.cols.NEGOCIO >= 0 ? cellVal(ws, r, enc.cols.NEGOCIO) : null;

    if (rawF == null && rawP == null && rawV == null && rawN == null) {
      if (++vaciasSeguidas >= CORTE_VACIAS) break;
      continue;
    }
    vaciasSeguidas = 0;

    const fecha = aFechaUTC(rawF);
    const producto = rawP != null ? String(rawP).trim() : "";
    const valor = typeof rawV === "number" ? Math.round(rawV) : NaN;
    const negocio = (rawN != null ? String(rawN).trim() : path.basename(archivo, ".xlsx").replace(/^\d+\s*-\s*/, "").trim()).toUpperCase();

    if (!fecha || !producto || Number.isNaN(valor)) { omitidas++; continue; }

    filas.push({ fecha, anio: fecha.getUTCFullYear(), mes: fecha.getUTCMonth() + 1, producto, valor, negocio, origen });
    const acc = (negocios[negocio] ??= { filas: 0, total: 0 });
    acc.filas++; acc.total += valor;
  }

  await prisma.ventaHistorica.deleteMany({ where: { origen } });
  const lote = 1000;
  for (let i = 0; i < filas.length; i += lote) {
    await prisma.ventaHistorica.createMany({ data: filas.slice(i, i + lote) });
  }
  return { negocios, omitidas };
}

async function main() {
  // Por defecto SOLO Ranch Texas. El importador soporta carpeta (multi-negocio) si se pasa una ruta
  // de carpeta como argumento, pero el negocio de este proyecto es Ranch Texas.
  const entrada = process.argv[2] ?? "D:/Datos/13 - Ventas No Salud/01 - Ranch Texas.xlsx";
  const stat = fs.statSync(entrada);
  const archivos = stat.isDirectory()
    ? fs.readdirSync(entrada).filter((f) => f.toLowerCase().endsWith(".xlsx")).map((f) => path.join(entrada, f))
    : [entrada];

  const fmt = (x: number) => new Intl.NumberFormat("es-CO").format(Math.round(x));
  console.log(`\n📥 Importando venta histórica (${archivos.length} archivo(s))\n`);

  let granTotal = 0, granFilas = 0;
  for (const archivo of archivos) {
    try {
      const { negocios, omitidas } = await importarArchivo(archivo);
      const nombres = Object.keys(negocios);
      for (const n of nombres) {
        console.log(`  ✓ ${path.basename(archivo).padEnd(28)} → ${n.padEnd(26)} ${String(negocios[n].filas).padStart(6)} filas  ${fmt(negocios[n].total).padStart(16)}`);
        granTotal += negocios[n].total; granFilas += negocios[n].filas;
      }
      if (omitidas) console.log(`      (omitidas ${omitidas} filas sin fecha/valor)`);
    } catch (e) {
      console.log(`  ✗ ${path.basename(archivo)} — ${(e as Error).message}`);
    }
  }
  console.log(`\n✅ Total importado: ${fmt(granFilas)} filas · ${fmt(granTotal)} COP\n`);
}

main()
  .catch((e) => { console.error("❌ Error importando:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
