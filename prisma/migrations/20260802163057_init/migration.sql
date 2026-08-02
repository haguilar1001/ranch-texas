-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('administrador', 'supervisor', 'cajero', 'control_acceso', 'consulta');

-- CreateEnum
CREATE TYPE "EstadoManilla" AS ENUM ('activa', 'usada', 'anulada', 'vencida');

-- CreateEnum
CREATE TYPE "EstadoVenta" AS ENUM ('completada', 'anulada');

-- CreateEnum
CREATE TYPE "TipoLineaVenta" AS ENUM ('pago', 'atencion', 'invitacion');

-- CreateEnum
CREATE TYPE "TipoMovCaja" AS ENUM ('apertura', 'ingreso', 'egreso', 'cierre');

-- CreateEnum
CREATE TYPE "EstadoTurno" AS ENUM ('abierto', 'cerrado', 'reabierto');

-- CreateEnum
CREATE TYPE "EstadoGasto" AS ENUM ('pendiente', 'pagado', 'anulado');

-- CreateEnum
CREATE TYPE "TipoReglaAcceso" AS ENUM ('un_ingreso', 'reingreso', 'entrada_salida');

-- CreateEnum
CREATE TYPE "SentidoAcceso" AS ENUM ('entrada', 'salida');

-- CreateEnum
CREATE TYPE "ResultadoAcceso" AS ENUM ('permitido', 'denegado');

-- CreateEnum
CREATE TYPE "NivelRubro" AS ENUM ('grupo', 'rubro', 'subrubro');

-- CreateEnum
CREATE TYPE "TipoGasto" AS ENUM ('unico', 'recurrente');

-- CreateEnum
CREATE TYPE "EstadoImpresion" AS ENUM ('pendiente', 'impreso', 'fallido');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "hash_password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_ingreso" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cajas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ubicacion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "cajas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnos_caja" (
    "id" TEXT NOT NULL,
    "caja_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "base_inicial" INTEGER NOT NULL DEFAULT 0,
    "abierto_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerrado_en" TIMESTAMP(3),
    "estado" "EstadoTurno" NOT NULL DEFAULT 'abierto',
    "efectivo_esperado" INTEGER,
    "efectivo_contado" INTEGER,
    "diferencia" INTEGER,
    "observacion_cierre" TEXT,
    "reabierto_por" TEXT,
    "reabierto_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "turnos_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_caja" (
    "id" TEXT NOT NULL,
    "turno_id" TEXT NOT NULL,
    "tipo" "TipoMovCaja" NOT NULL,
    "monto" INTEGER NOT NULL,
    "concepto" TEXT NOT NULL,
    "medio_pago_id" TEXT,
    "venta_id" TEXT,
    "referencia" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "movimientos_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conteo_denominaciones" (
    "id" TEXT NOT NULL,
    "turno_id" TEXT NOT NULL,
    "denominacion" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "conteo_denominaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_visitante" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "requiere_pago" BOOLEAN NOT NULL DEFAULT true,
    "edad_min" INTEGER,
    "edad_max" INTEGER,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "tipos_visitante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifas" (
    "id" TEXT NOT NULL,
    "tipo_visitante_id" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "vigente_desde" TIMESTAMP(3) NOT NULL,
    "vigente_hasta" TIMESTAMP(3),
    "motivo_cambio" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "tarifas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "motivos_cortesia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "requiere_autorizacion" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "motivos_cortesia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medios_pago" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "es_efectivo" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "medios_pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" TEXT NOT NULL,
    "turno_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "numero_venta" INTEGER NOT NULL,
    "total_lista" INTEGER NOT NULL DEFAULT 0,
    "total_cobrado" INTEGER NOT NULL DEFAULT 0,
    "total_descuento" INTEGER NOT NULL DEFAULT 0,
    "cantidad_asistentes" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoVenta" NOT NULL DEFAULT 'completada',
    "motivo_anulacion" TEXT,
    "anulada_por" TEXT,
    "anulada_en" TIMESTAMP(3),
    "comprador_nombre" TEXT,
    "comprador_documento" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venta_detalle" (
    "id" TEXT NOT NULL,
    "venta_id" TEXT NOT NULL,
    "tipo_visitante_id" TEXT NOT NULL,
    "tarifa_id" TEXT,
    "tipo_linea" "TipoLineaVenta" NOT NULL DEFAULT 'pago',
    "cantidad" INTEGER NOT NULL,
    "valor_lista" INTEGER NOT NULL,
    "valor_cobrado" INTEGER NOT NULL,
    "motivo_descuento" TEXT,
    "autorizado_por" TEXT,
    "motivo_cortesia_id" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "venta_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venta_pagos" (
    "id" TEXT NOT NULL,
    "venta_id" TEXT NOT NULL,
    "medio_pago_id" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "referencia" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "venta_pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manillas" (
    "id" TEXT NOT NULL,
    "codigo_uuid" TEXT NOT NULL,
    "firma_hmac" TEXT NOT NULL,
    "consecutivo" TEXT NOT NULL,
    "venta_detalle_id" TEXT NOT NULL,
    "tipo_visitante_id" TEXT NOT NULL,
    "estado" "EstadoManilla" NOT NULL DEFAULT 'activa',
    "es_bebe" BOOLEAN NOT NULL DEFAULT false,
    "vencimiento" TIMESTAMP(3),
    "usada_en" TIMESTAMP(3),
    "anulada_en" TIMESTAMP(3),
    "anulada_por" TEXT,
    "motivo_anulacion" TEXT,
    "reimpresa_veces" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "manillas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atracciones" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "edad_minima" INTEGER,
    "estatura_minima" INTEGER,
    "requiere_consentimiento" BOOLEAN NOT NULL DEFAULT false,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "atracciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puntos_control" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "atraccion_id" TEXT,
    "tipo_regla" "TipoReglaAcceso" NOT NULL DEFAULT 'entrada_salida',
    "edad_minima" INTEGER,
    "estatura_minima" INTEGER,
    "requiere_consentimiento" BOOLEAN NOT NULL DEFAULT false,
    "aforo_maximo" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "puntos_control_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accesos" (
    "id" TEXT NOT NULL,
    "manilla_id" TEXT,
    "punto_control_id" TEXT NOT NULL,
    "resultado" "ResultadoAcceso" NOT NULL,
    "sentido" "SentidoAcceso",
    "motivo_denegacion" TEXT,
    "escaneado_por" TEXT,
    "dispositivo" TEXT,
    "escaneado_en" TIMESTAMP(3) NOT NULL,
    "registrado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sincronizado" BOOLEAN NOT NULL DEFAULT true,
    "id_cliente" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "accesos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "textos_consentimiento" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "atraccion_id" TEXT,
    "vigente_desde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigente_hasta" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "textos_consentimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consentimientos" (
    "id" TEXT NOT NULL,
    "manilla_id" TEXT NOT NULL,
    "atraccion_id" TEXT NOT NULL,
    "texto_consentimiento_id" TEXT NOT NULL,
    "es_menor" BOOLEAN NOT NULL DEFAULT false,
    "nombre_firmante" TEXT NOT NULL,
    "documento_firmante" TEXT NOT NULL,
    "nombre_acudiente" TEXT,
    "documento_acudiente" TEXT,
    "parentesco" TEXT,
    "firma_imagen" TEXT NOT NULL,
    "ip" TEXT,
    "dispositivo" TEXT,
    "user_agent" TEXT,
    "firmado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "consentimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nit_cedula" TEXT,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rubros_gasto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nivel" "NivelRubro" NOT NULL,
    "padre_id" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "rubros_gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos" (
    "id" TEXT NOT NULL,
    "proveedor_id" TEXT,
    "rubro_gasto_id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha_gasto" TIMESTAMP(3) NOT NULL,
    "base_gravable" INTEGER NOT NULL DEFAULT 0,
    "iva" INTEGER NOT NULL DEFAULT 0,
    "retefuente" INTEGER NOT NULL DEFAULT 0,
    "reteica" INTEGER NOT NULL DEFAULT 0,
    "otras_retenciones" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoGasto" NOT NULL DEFAULT 'pendiente',
    "tipo" "TipoGasto" NOT NULL DEFAULT 'unico',
    "plantilla_id" TEXT,
    "soporte_archivo" TEXT,
    "pagado_en" TIMESTAMP(3),
    "medio_pago_id" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos_recurrentes" (
    "id" TEXT NOT NULL,
    "rubro_gasto_id" TEXT NOT NULL,
    "proveedor_id" TEXT,
    "descripcion" TEXT NOT NULL,
    "monto_estimado" INTEGER NOT NULL,
    "dia_del_mes" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "gastos_recurrentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presupuesto" (
    "id" TEXT NOT NULL,
    "rubro_gasto_id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER,
    "monto_presupuestado" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "presupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impresiones" (
    "id" TEXT NOT NULL,
    "manilla_id" TEXT,
    "tipo" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "estado" "EstadoImpresion" NOT NULL DEFAULT 'pendiente',
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "impreso_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" TEXT,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "actualizado_por" TEXT,

    CONSTRAINT "impresiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_auditoria" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "datos_antes" JSONB,
    "datos_despues" JSONB,
    "ip" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_fecha" (
    "fecha" DATE NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "dia" INTEGER NOT NULL,
    "trimestre" INTEGER NOT NULL,
    "semana_iso" INTEGER NOT NULL,
    "nombre_dia" TEXT NOT NULL,
    "nombre_mes" TEXT NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "es_fin_semana" BOOLEAN NOT NULL,
    "es_festivo" BOOLEAN NOT NULL DEFAULT false,
    "nombre_festivo" TEXT,
    "es_temporada_alta" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "dim_fecha_pkey" PRIMARY KEY ("fecha")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_usuario_key" ON "usuarios"("usuario");

-- CreateIndex
CREATE INDEX "turnos_caja_caja_id_estado_idx" ON "turnos_caja"("caja_id", "estado");

-- CreateIndex
CREATE INDEX "turnos_caja_abierto_en_idx" ON "turnos_caja"("abierto_en");

-- CreateIndex
CREATE INDEX "movimientos_caja_turno_id_tipo_idx" ON "movimientos_caja"("turno_id", "tipo");

-- CreateIndex
CREATE INDEX "conteo_denominaciones_turno_id_idx" ON "conteo_denominaciones"("turno_id");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_visitante_codigo_key" ON "tipos_visitante"("codigo");

-- CreateIndex
CREATE INDEX "tarifas_tipo_visitante_id_vigente_desde_idx" ON "tarifas"("tipo_visitante_id", "vigente_desde");

-- CreateIndex
CREATE UNIQUE INDEX "medios_pago_codigo_key" ON "medios_pago"("codigo");

-- CreateIndex
CREATE INDEX "ventas_creado_en_idx" ON "ventas"("creado_en");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_turno_id_numero_venta_key" ON "ventas"("turno_id", "numero_venta");

-- CreateIndex
CREATE INDEX "venta_detalle_venta_id_idx" ON "venta_detalle"("venta_id");

-- CreateIndex
CREATE INDEX "venta_pagos_venta_id_idx" ON "venta_pagos"("venta_id");

-- CreateIndex
CREATE UNIQUE INDEX "manillas_codigo_uuid_key" ON "manillas"("codigo_uuid");

-- CreateIndex
CREATE INDEX "manillas_estado_idx" ON "manillas"("estado");

-- CreateIndex
CREATE INDEX "manillas_venta_detalle_id_idx" ON "manillas"("venta_detalle_id");

-- CreateIndex
CREATE UNIQUE INDEX "accesos_id_cliente_key" ON "accesos"("id_cliente");

-- CreateIndex
CREATE INDEX "accesos_punto_control_id_escaneado_en_idx" ON "accesos"("punto_control_id", "escaneado_en");

-- CreateIndex
CREATE INDEX "accesos_manilla_id_idx" ON "accesos"("manilla_id");

-- CreateIndex
CREATE INDEX "accesos_sincronizado_idx" ON "accesos"("sincronizado");

-- CreateIndex
CREATE UNIQUE INDEX "textos_consentimiento_codigo_version_key" ON "textos_consentimiento"("codigo", "version");

-- CreateIndex
CREATE INDEX "consentimientos_manilla_id_idx" ON "consentimientos"("manilla_id");

-- CreateIndex
CREATE INDEX "consentimientos_atraccion_id_idx" ON "consentimientos"("atraccion_id");

-- CreateIndex
CREATE INDEX "rubros_gasto_padre_id_idx" ON "rubros_gasto"("padre_id");

-- CreateIndex
CREATE INDEX "gastos_rubro_gasto_id_idx" ON "gastos"("rubro_gasto_id");

-- CreateIndex
CREATE INDEX "gastos_fecha_gasto_idx" ON "gastos"("fecha_gasto");

-- CreateIndex
CREATE INDEX "gastos_estado_idx" ON "gastos"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "presupuesto_rubro_gasto_id_anio_mes_key" ON "presupuesto"("rubro_gasto_id", "anio", "mes");

-- CreateIndex
CREATE INDEX "impresiones_estado_idx" ON "impresiones"("estado");

-- CreateIndex
CREATE INDEX "log_auditoria_entidad_entidad_id_idx" ON "log_auditoria"("entidad", "entidad_id");

-- CreateIndex
CREATE INDEX "log_auditoria_usuario_id_creado_en_idx" ON "log_auditoria"("usuario_id", "creado_en");

-- CreateIndex
CREATE INDEX "dim_fecha_anio_mes_idx" ON "dim_fecha"("anio", "mes");

-- AddForeignKey
ALTER TABLE "turnos_caja" ADD CONSTRAINT "turnos_caja_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos_caja" ADD CONSTRAINT "turnos_caja_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "turnos_caja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_medio_pago_id_fkey" FOREIGN KEY ("medio_pago_id") REFERENCES "medios_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conteo_denominaciones" ADD CONSTRAINT "conteo_denominaciones_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "turnos_caja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifas" ADD CONSTRAINT "tarifas_tipo_visitante_id_fkey" FOREIGN KEY ("tipo_visitante_id") REFERENCES "tipos_visitante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "turnos_caja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_detalle" ADD CONSTRAINT "venta_detalle_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_detalle" ADD CONSTRAINT "venta_detalle_tipo_visitante_id_fkey" FOREIGN KEY ("tipo_visitante_id") REFERENCES "tipos_visitante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_detalle" ADD CONSTRAINT "venta_detalle_tarifa_id_fkey" FOREIGN KEY ("tarifa_id") REFERENCES "tarifas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_detalle" ADD CONSTRAINT "venta_detalle_motivo_cortesia_id_fkey" FOREIGN KEY ("motivo_cortesia_id") REFERENCES "motivos_cortesia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_pagos" ADD CONSTRAINT "venta_pagos_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_pagos" ADD CONSTRAINT "venta_pagos_medio_pago_id_fkey" FOREIGN KEY ("medio_pago_id") REFERENCES "medios_pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manillas" ADD CONSTRAINT "manillas_venta_detalle_id_fkey" FOREIGN KEY ("venta_detalle_id") REFERENCES "venta_detalle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manillas" ADD CONSTRAINT "manillas_tipo_visitante_id_fkey" FOREIGN KEY ("tipo_visitante_id") REFERENCES "tipos_visitante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puntos_control" ADD CONSTRAINT "puntos_control_atraccion_id_fkey" FOREIGN KEY ("atraccion_id") REFERENCES "atracciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accesos" ADD CONSTRAINT "accesos_manilla_id_fkey" FOREIGN KEY ("manilla_id") REFERENCES "manillas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accesos" ADD CONSTRAINT "accesos_punto_control_id_fkey" FOREIGN KEY ("punto_control_id") REFERENCES "puntos_control"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "textos_consentimiento" ADD CONSTRAINT "textos_consentimiento_atraccion_id_fkey" FOREIGN KEY ("atraccion_id") REFERENCES "atracciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consentimientos" ADD CONSTRAINT "consentimientos_manilla_id_fkey" FOREIGN KEY ("manilla_id") REFERENCES "manillas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consentimientos" ADD CONSTRAINT "consentimientos_atraccion_id_fkey" FOREIGN KEY ("atraccion_id") REFERENCES "atracciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consentimientos" ADD CONSTRAINT "consentimientos_texto_consentimiento_id_fkey" FOREIGN KEY ("texto_consentimiento_id") REFERENCES "textos_consentimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubros_gasto" ADD CONSTRAINT "rubros_gasto_padre_id_fkey" FOREIGN KEY ("padre_id") REFERENCES "rubros_gasto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_rubro_gasto_id_fkey" FOREIGN KEY ("rubro_gasto_id") REFERENCES "rubros_gasto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_plantilla_id_fkey" FOREIGN KEY ("plantilla_id") REFERENCES "gastos_recurrentes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_medio_pago_id_fkey" FOREIGN KEY ("medio_pago_id") REFERENCES "medios_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos_recurrentes" ADD CONSTRAINT "gastos_recurrentes_rubro_gasto_id_fkey" FOREIGN KEY ("rubro_gasto_id") REFERENCES "rubros_gasto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos_recurrentes" ADD CONSTRAINT "gastos_recurrentes_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presupuesto" ADD CONSTRAINT "presupuesto_rubro_gasto_id_fkey" FOREIGN KEY ("rubro_gasto_id") REFERENCES "rubros_gasto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impresiones" ADD CONSTRAINT "impresiones_manilla_id_fkey" FOREIGN KEY ("manilla_id") REFERENCES "manillas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
