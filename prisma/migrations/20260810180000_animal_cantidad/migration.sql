-- AlterTable: headcount por grupo/lote en el inventario de animales (1 = individuo)
ALTER TABLE "animales" ADD COLUMN "cantidad" INTEGER NOT NULL DEFAULT 1;
