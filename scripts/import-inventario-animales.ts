// Importa el INVENTARIO REAL de animales del Parque Ranch Texas y el consumo
// mensual de alimento. Reemplaza los datos inventados de `seed-boceto` para el
// módulo de Animales.
//
// Fuentes:
//   - "INVENTARIO ANIMALES RANCH.xlsx" (hoja LISTADO CABALLOS): censo por grupo,
//     cantidad y observación.
//   - Infografía "ALIMENTO ANIMALES DE GRANJA — CONSUMO MENSUAL": alimentos,
//     costos por bulto/kg y consumo mensual por grupo.
//
// Idempotente: reejecutar no duplica (upsert por nombre). Baja lógica, nunca borra.
//
//   npx tsx scripts/import-inventario-animales.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const POR = "import-inventario";

// ---------------------------------------------------------------- CENSO (Excel)
// [nombre, cantidad, categoria, especie, observacion]
const CENSO: Array<[string, number, string, string, string]> = [
  ["Perros", 10, "Caninos", "Perro", ""],
  ["Cabras", 12, "Caprinos", "Cabra", ""],
  ["Crías hembras cabras", 7, "Caprinos", "Cabra", "Nacimientos"],
  ["Cabros", 5, "Caprinos", "Cabra", "3 crías"],
  ["Ovejos", 1, "Ovinos", "Oveja", "Exhibición granja"],
  ["Vacas", 9, "Bovinos", "Vaca", ""],
  ["Toros", 3, "Bovinos", "Toro", "1 reproductor (Texano, Paturro)"],
  ["Terneras", 7, "Bovinos", "Ternera", "2 mayores de un año, 4 en lactancia"],
  ["Terneros", 3, "Bovinos", "Ternero", "Crías nuevas 2026"],
  ["Toretes", 5, "Bovinos", "Torete", "1 Paturro, 4 para team penning"],
  ["Pavo real", 5, "Aves ornamentales", "Pavo real", "3 hembras, 2 machos"],
  ["Gansos", 30, "Aves de corral", "Ganso", ""],
  ["Patos de moño", 24, "Aves de corral", "Pato de moño", "Comprados enero 2026"],
  ["Gallinas Brahaman", 3, "Aves de corral", "Gallina Brahaman", "1 macho, 2 hembras"],
  ["Pato Pekín", 12, "Aves de corral", "Pato Pekín", ""],
  ["Pato corredor", 8, "Aves de corral", "Pato corredor", ""],
  ["Gallo fino", 1, "Aves de corral", "Gallo fino", "Chano"],
  ["Gallo Brahaman", 1, "Aves de corral", "Gallo Brahaman", ""],
  ["Patos", 47, "Aves de corral", "Pato", "2 chilenos, 11 machos, 34 hembras"],
  ["Gallinetas", 15, "Aves de corral", "Gallineta", ""],
  ["Gallinas", 36, "Aves de corral", "Gallina", "4 finas, 17 hembras, 15 gallos kikis"],
  ["Conejos", 7, "Lagomorfos", "Conejo", ""],
  ["Faisanes", 6, "Aves ornamentales", "Faisán", "3 machos, hembras"],
  ["Tigrilla", 1, "Fauna silvestre", "Tigrilla", "Pendiente entregar a Amigos de la Fauna"],
  ["Ocelote", 1, "Fauna silvestre", "Ocelote", "Pendiente entregar a Amigos de la Fauna"],
  ["Tortugas", 28, "Reptiles", "Tortuga", ""],
  ["Peces koi", 300, "Peces", "Pez koi", "Aproximado"],
  ["Mojarras", 0, "Peces", "Mojarra", "Aproximado, cantidad por confirmar"],
  ["Gallinas ponedoras", 96, "Aves de corral", "Gallina ponedora", ""],
];

// ---------------------------------------------------------------- ALIMENTOS (imagen)
// [nombre, tipo, unidad, costo_unitario COP por unidad]
const ALIMENTOS: Array<[string, string, string, number | null]> = [
  ["Prepico Dorado", "concentrado", "bulto", 80_000],
  ["Leche 16", "concentrado", "bulto", 85_000],
  ["Maíz Molido", "concentrado", "bulto", 70_000],
  ["Italcán", "concentrado", "bulto", 110_000],
  ["Súper Ternera", "concentrado", "bulto", 85_000],
  ["Conejina", "concentrado", "kg", 5_000],
  ["Acuatilapia", "concentrado", "bulto", 152_500], // ESTIMADO: 2 bultos = $305.000/mes (ajustar)
  ["Sal mineralizada", "suplemento", "bulto", 95_000],
  ["Melaza", "suplemento", "bulto", 52_000],
];

// Consumo mensual documentado. Se ata al GRUPO (animal) cuando existe, o a la
// CATEGORÍA cuando el consumo es "en general".
// [alimento, cantidad, unidad, destino_animal | null, destino_categoria | null, obs]
const RACIONES: Array<[string, number, string, string | null, string | null, string]> = [
  ["Prepico Dorado", 9, "bulto", "Gallinas ponedoras", null, "$720.000/mes"],
  ["Leche 16", 15, "bulto", "Vacas", null, "$1.275.000/mes"],
  ["Sal mineralizada", 2, "bulto", "Vacas", null, "Consumo libre · $190.000/mes"],
  ["Melaza", 6, "bulto", "Vacas", null, "Consumo libre · $312.000/mes"],
  ["Italcán", 8, "bulto", "Perros", null, "800 g/animal · $880.000/mes"],
  ["Súper Ternera", 8, "bulto", "Terneros", null, "1 kg/animal · $680.000/mes"],
  ["Conejina", 15, "kg", "Conejos", null, "500 g entre todos · $75.000/mes"],
  ["Leche 16", 4, "bulto", "Cabras", null, "5 kg diarios entre el lote · $340.000/mes"],
  ["Acuatilapia", 2, "bulto", "Peces koi", null, "ESTIMADO 2 bultos × $152.500 = $305.000/mes (ajustar)"],
  ["Maíz Molido", 6, "bulto", null, "Aves de corral", "Aves en general · parte de $580.000/mes"],
  ["Prepico Dorado", 2, "bulto", null, "Aves de corral", "Aves en general · parte de $580.000/mes"],
];

async function upsertCategoria(nombre: string): Promise<string> {
  const found = await prisma.categoriaAnimal.findFirst({ where: { nombre } });
  if (found) return found.id;
  return (await prisma.categoriaAnimal.create({ data: { nombre, creado_por: POR } })).id;
}

async function upsertAlimento(nombre: string, tipo: string, unidad: string, costo: number | null): Promise<string> {
  const found = await prisma.alimento.findFirst({ where: { nombre } });
  if (found) {
    await prisma.alimento.update({ where: { id: found.id }, data: { tipo, unidad_medida: unidad, costo_unitario: costo, actualizado_por: POR } });
    return found.id;
  }
  return (await prisma.alimento.create({ data: { nombre, tipo, unidad_medida: unidad, costo_unitario: costo, creado_por: POR } })).id;
}

async function upsertAnimal(nombre: string, cantidad: number, categoria_id: string, especie: string, obs: string): Promise<string> {
  const found = await prisma.animal.findFirst({ where: { nombre } });
  const data = { cantidad, categoria_id, especie, observaciones: obs || null, estado: "activo" as const };
  if (found) {
    await prisma.animal.update({ where: { id: found.id }, data: { ...data, actualizado_por: POR } });
    return found.id;
  }
  return (await prisma.animal.create({ data: { ...data, nombre, creado_por: POR } })).id;
}

async function main() {
  console.log("\n🐄 Importando inventario REAL de animales · Ranch Texas\n");

  // Categorías
  const catNombres = Array.from(new Set(CENSO.map((c) => c[2])));
  const cats: Record<string, string> = {};
  for (const n of catNombres) cats[n] = await upsertCategoria(n);

  // Animales (grupos)
  const animalIds: Record<string, string> = {};
  let totalCabezas = 0;
  for (const [nombre, cantidad, cat, especie, obs] of CENSO) {
    animalIds[nombre] = await upsertAnimal(nombre, cantidad, cats[cat], especie, obs);
    totalCabezas += cantidad;
  }

  // Alimentos
  const alim: Record<string, string> = {};
  for (const [nombre, tipo, unidad, costo] of ALIMENTOS) alim[nombre] = await upsertAlimento(nombre, tipo, unidad, costo);

  // Raciones (idempotente por alimento + destino)
  let racCreadas = 0;
  for (const [alimento, cantidad, unidad, destAnimal, destCat, obs] of RACIONES) {
    const animal_id = destAnimal ? animalIds[destAnimal] ?? null : null;
    const categoria_animal_id = destCat ? cats[destCat] ?? null : null;
    const existente = await prisma.racion.findFirst({
      where: { alimento_id: alim[alimento], animal_id, categoria_animal_id },
    });
    if (existente) {
      await prisma.racion.update({ where: { id: existente.id }, data: { cantidad, unidad, frecuencia: "mensual", observaciones: obs, actualizado_por: POR } });
    } else {
      await prisma.racion.create({
        data: { alimento_id: alim[alimento], animal_id, categoria_animal_id, cantidad, unidad, frecuencia: "mensual", observaciones: obs, creado_por: POR },
      });
      racCreadas++;
    }
  }

  console.log(`  ✓ ${catNombres.length} categorías`);
  console.log(`  ✓ ${CENSO.length} grupos de animales · ${totalCabezas.toLocaleString("es-CO")} cabezas`);
  console.log(`  ✓ ${ALIMENTOS.length} alimentos`);
  console.log(`  ✓ ${RACIONES.length} raciones (${racCreadas} nuevas)`);
  console.log("\n✅ Inventario cargado.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
