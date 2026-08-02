-- CreateTable
CREATE TABLE "ventas_historicas" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "producto" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "negocio" TEXT NOT NULL DEFAULT 'RANCH TEXAS',
    "origen" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventas_historicas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ventas_historicas_fecha_idx" ON "ventas_historicas"("fecha");

-- CreateIndex
CREATE INDEX "ventas_historicas_anio_mes_idx" ON "ventas_historicas"("anio", "mes");

-- CreateIndex
CREATE INDEX "ventas_historicas_producto_idx" ON "ventas_historicas"("producto");
