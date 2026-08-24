-- F11: alimentación (dieta individual/grupal + bitácora + kardex) y ubicación con historial.
-- Escrita a mano para NO perder datos: `raciones.frecuencia` pasa de texto a enum con CAST,
-- y `alimentos.existencia` se RENOMBRA (no se recrea).

-- CreateEnum
CREATE TYPE "ModoRacion" AS ENUM ('individual', 'grupal');

-- CreateEnum
CREATE TYPE "FrecuenciaRacion" AS ENUM ('diaria', 'semanal', 'quincenal', 'mensual');

-- CreateEnum
CREATE TYPE "EstadoAlimentacion" AS ENUM ('realizada', 'parcial', 'omitida');

-- CreateEnum
CREATE TYPE "TipoMovimientoAlimento" AS ENUM ('entrada', 'salida', 'ajuste');

-- AlterTable: el alimento sabe cuántos gramos trae su unidad de compra y guarda
-- la existencia en unidad BASE (g/ml/unidad), no en bultos.
ALTER TABLE "alimentos" ADD COLUMN "equivalencia_g" INTEGER;
ALTER TABLE "alimentos" RENAME COLUMN "existencia" TO "existencia_base";

-- AlterTable: el recinto es la UBICACIÓN física dentro del parque.
ALTER TABLE "recintos" ADD COLUMN "tipo" TEXT;
ALTER TABLE "recintos" ADD COLUMN "ubicacion" TEXT;

-- AlterTable: la ración dice si la cantidad es por cabeza o para todo el lote.
ALTER TABLE "raciones" ADD COLUMN "modo" "ModoRacion" NOT NULL DEFAULT 'grupal';
ALTER TABLE "raciones" ADD COLUMN "horario" TEXT;
ALTER TABLE "raciones" ADD COLUMN "activo" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "raciones" ALTER COLUMN "frecuencia" DROP DEFAULT;
ALTER TABLE "raciones" ALTER COLUMN "frecuencia" TYPE "FrecuenciaRacion"
  USING (CASE lower("frecuencia")
           WHEN 'diaria'     THEN 'diaria'
           WHEN 'semanal'    THEN 'semanal'
           WHEN 'quincenal'  THEN 'quincenal'
           WHEN 'mensual'    THEN 'mensual'
           ELSE 'diaria'
         END)::"FrecuenciaRacion";
ALTER TABLE "raciones" ALTER COLUMN "frecuencia" SET DEFAULT 'diaria';

-- CreateTable: historial de ubicación.
CREATE TABLE "traslados_animal" (
    "id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "recinto_origen_id" TEXT,
    "recinto_destino_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "traslados_animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable: bitácora de alimentación.
CREATE TABLE "registros_alimentacion" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "racion_id" TEXT,
    "animal_id" TEXT,
    "categoria_animal_id" TEXT,
    "recinto_id" TEXT,
    "alimento_id" TEXT NOT NULL,
    "cantidad_planeada" INTEGER,
    "cantidad_entregada" INTEGER NOT NULL,
    "costo" INTEGER,
    "estado" "EstadoAlimentacion" NOT NULL DEFAULT 'realizada',
    "motivo" TEXT,
    "empleado_id" TEXT,
    "usuario_id" TEXT,
    "observaciones" TEXT,
    "anulado" BOOLEAN NOT NULL DEFAULT false,
    "motivo_anulacion" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "registros_alimentacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable: kardex del alimento.
CREATE TABLE "movimientos_alimento" (
    "id" TEXT NOT NULL,
    "alimento_id" TEXT NOT NULL,
    "tipo" "TipoMovimientoAlimento" NOT NULL,
    "cantidad_base" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT,
    "costo" INTEGER,
    "alimentacion_id" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "movimientos_alimento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "traslados_animal_animal_id_idx" ON "traslados_animal"("animal_id");
CREATE INDEX "traslados_animal_recinto_destino_id_idx" ON "traslados_animal"("recinto_destino_id");
CREATE INDEX "traslados_animal_fecha_idx" ON "traslados_animal"("fecha");

CREATE INDEX "registros_alimentacion_fecha_idx" ON "registros_alimentacion"("fecha");
CREATE INDEX "registros_alimentacion_animal_id_idx" ON "registros_alimentacion"("animal_id");
CREATE INDEX "registros_alimentacion_alimento_id_idx" ON "registros_alimentacion"("alimento_id");
CREATE INDEX "registros_alimentacion_recinto_id_idx" ON "registros_alimentacion"("recinto_id");

CREATE UNIQUE INDEX "movimientos_alimento_alimentacion_id_key" ON "movimientos_alimento"("alimentacion_id");
CREATE INDEX "movimientos_alimento_alimento_id_idx" ON "movimientos_alimento"("alimento_id");
CREATE INDEX "movimientos_alimento_fecha_idx" ON "movimientos_alimento"("fecha");

-- AddForeignKey
ALTER TABLE "traslados_animal" ADD CONSTRAINT "traslados_animal_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "traslados_animal" ADD CONSTRAINT "traslados_animal_recinto_origen_id_fkey" FOREIGN KEY ("recinto_origen_id") REFERENCES "recintos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "traslados_animal" ADD CONSTRAINT "traslados_animal_recinto_destino_id_fkey" FOREIGN KEY ("recinto_destino_id") REFERENCES "recintos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "registros_alimentacion" ADD CONSTRAINT "registros_alimentacion_racion_id_fkey" FOREIGN KEY ("racion_id") REFERENCES "raciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "registros_alimentacion" ADD CONSTRAINT "registros_alimentacion_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "registros_alimentacion" ADD CONSTRAINT "registros_alimentacion_categoria_animal_id_fkey" FOREIGN KEY ("categoria_animal_id") REFERENCES "categorias_animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "registros_alimentacion" ADD CONSTRAINT "registros_alimentacion_recinto_id_fkey" FOREIGN KEY ("recinto_id") REFERENCES "recintos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "registros_alimentacion" ADD CONSTRAINT "registros_alimentacion_alimento_id_fkey" FOREIGN KEY ("alimento_id") REFERENCES "alimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "movimientos_alimento" ADD CONSTRAINT "movimientos_alimento_alimento_id_fkey" FOREIGN KEY ("alimento_id") REFERENCES "alimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimientos_alimento" ADD CONSTRAINT "movimientos_alimento_alimentacion_id_fkey" FOREIGN KEY ("alimentacion_id") REFERENCES "registros_alimentacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
