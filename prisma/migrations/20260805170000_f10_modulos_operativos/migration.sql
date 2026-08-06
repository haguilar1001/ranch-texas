-- CreateEnum
CREATE TYPE "EstadoEmpleado" AS ENUM ('activo', 'inactivo', 'retirado');

-- CreateEnum
CREATE TYPE "SexoAnimal" AS ENUM ('macho', 'hembra', 'desconocido');

-- CreateEnum
CREATE TYPE "EstadoAnimal" AS ENUM ('activo', 'enfermo', 'cuarentena', 'fallecido', 'trasladado');

-- CreateEnum
CREATE TYPE "EstadoEquipo" AS ENUM ('operativo', 'en_mantenimiento', 'fuera_servicio', 'dado_de_baja');

-- CreateEnum
CREATE TYPE "TipoMantenimiento" AS ENUM ('preventivo', 'correctivo');

-- CreateEnum
CREATE TYPE "EstadoMantenimiento" AS ENUM ('programado', 'en_proceso', 'realizado', 'cancelado');

-- CreateTable
CREATE TABLE "areas_trabajo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "areas_trabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "area_id" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "cargos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo_documento" TEXT,
    "documento" TEXT,
    "cargo_id" TEXT,
    "area_id" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "fecha_ingreso" TIMESTAMP(3),
    "fecha_retiro" TIMESTAMP(3),
    "estado" "EstadoEmpleado" NOT NULL DEFAULT 'activo',
    "usuario_id" TEXT,
    "observaciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_animal" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "categorias_animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recintos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "capacidad" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "recintos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "categoria_id" TEXT NOT NULL,
    "recinto_id" TEXT,
    "especie" TEXT,
    "raza" TEXT,
    "sexo" "SexoAnimal" NOT NULL DEFAULT 'desconocido',
    "fecha_nacimiento" TIMESTAMP(3),
    "fecha_ingreso" TIMESTAMP(3),
    "estado" "EstadoAnimal" NOT NULL DEFAULT 'activo',
    "observaciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "animales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alimentos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT,
    "unidad_medida" TEXT NOT NULL DEFAULT 'kg',
    "costo_unitario" INTEGER,
    "existencia" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "alimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raciones" (
    "id" TEXT NOT NULL,
    "categoria_animal_id" TEXT,
    "animal_id" TEXT,
    "alimento_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "unidad" TEXT NOT NULL DEFAULT 'kg',
    "frecuencia" TEXT NOT NULL DEFAULT 'diaria',
    "observaciones" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "raciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_equipo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "categorias_equipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "categoria_id" TEXT NOT NULL,
    "area_id" TEXT,
    "ubicacion" TEXT,
    "marca" TEXT,
    "modelo" TEXT,
    "serie" TEXT,
    "fecha_compra" TIMESTAMP(3),
    "fecha_instalacion" TIMESTAMP(3),
    "estado" "EstadoEquipo" NOT NULL DEFAULT 'operativo',
    "observaciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "equipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mantenimientos_equipo" (
    "id" TEXT NOT NULL,
    "equipo_id" TEXT NOT NULL,
    "tipo" "TipoMantenimiento" NOT NULL DEFAULT 'preventivo',
    "descripcion" TEXT NOT NULL,
    "fecha_programada" TIMESTAMP(3),
    "fecha_realizada" TIMESTAMP(3),
    "costo" INTEGER NOT NULL DEFAULT 0,
    "responsable" TEXT,
    "estado" "EstadoMantenimiento" NOT NULL DEFAULT 'programado',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "mantenimientos_equipo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cargos_area_id_idx" ON "cargos"("area_id");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_documento_key" ON "empleados"("documento");

-- CreateIndex
CREATE INDEX "empleados_area_id_idx" ON "empleados"("area_id");

-- CreateIndex
CREATE INDEX "empleados_cargo_id_idx" ON "empleados"("cargo_id");

-- CreateIndex
CREATE INDEX "animales_categoria_id_idx" ON "animales"("categoria_id");

-- CreateIndex
CREATE INDEX "animales_recinto_id_idx" ON "animales"("recinto_id");

-- CreateIndex
CREATE INDEX "raciones_categoria_animal_id_idx" ON "raciones"("categoria_animal_id");

-- CreateIndex
CREATE INDEX "raciones_animal_id_idx" ON "raciones"("animal_id");

-- CreateIndex
CREATE INDEX "equipos_categoria_id_idx" ON "equipos"("categoria_id");

-- CreateIndex
CREATE INDEX "equipos_area_id_idx" ON "equipos"("area_id");

-- CreateIndex
CREATE INDEX "mantenimientos_equipo_equipo_id_idx" ON "mantenimientos_equipo"("equipo_id");

-- CreateIndex
CREATE INDEX "mantenimientos_equipo_estado_idx" ON "mantenimientos_equipo"("estado");

-- AddForeignKey
ALTER TABLE "cargos" ADD CONSTRAINT "cargos_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas_trabajo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_cargo_id_fkey" FOREIGN KEY ("cargo_id") REFERENCES "cargos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas_trabajo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animales" ADD CONSTRAINT "animales_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animales" ADD CONSTRAINT "animales_recinto_id_fkey" FOREIGN KEY ("recinto_id") REFERENCES "recintos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raciones" ADD CONSTRAINT "raciones_categoria_animal_id_fkey" FOREIGN KEY ("categoria_animal_id") REFERENCES "categorias_animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raciones" ADD CONSTRAINT "raciones_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raciones" ADD CONSTRAINT "raciones_alimento_id_fkey" FOREIGN KEY ("alimento_id") REFERENCES "alimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipos" ADD CONSTRAINT "equipos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_equipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipos" ADD CONSTRAINT "equipos_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas_trabajo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mantenimientos_equipo" ADD CONSTRAINT "mantenimientos_equipo_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

