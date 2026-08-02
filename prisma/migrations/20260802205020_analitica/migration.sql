-- Capa analítica para Power BI: esquema `analitica` con vistas en modelo estrella.
-- Los timestamps se guardan en UTC (timestamp sin zona); se convierten a fecha local de Bogotá
-- con: ((ts AT TIME ZONE 'UTC') AT TIME ZONE 'America/Bogota')::date

CREATE SCHEMA IF NOT EXISTS analitica;

-- ------------------------- DIMENSIONES -------------------------

CREATE OR REPLACE VIEW analitica.dim_fecha AS
  SELECT * FROM public.dim_fecha;

CREATE OR REPLACE VIEW analitica.dim_tipo_visitante AS
  SELECT id AS tipo_visitante_id, nombre, codigo, requiere_pago FROM public.tipos_visitante;

CREATE OR REPLACE VIEW analitica.dim_medio_pago AS
  SELECT id AS medio_pago_id, nombre, codigo, es_efectivo FROM public.medios_pago;

CREATE OR REPLACE VIEW analitica.dim_atraccion AS
  SELECT id AS atraccion_id, nombre, requiere_consentimiento, activa FROM public.atracciones;

CREATE OR REPLACE VIEW analitica.dim_cajero AS
  SELECT id AS cajero_id, nombre, usuario, rol::text AS rol
  FROM public.usuarios
  WHERE rol IN ('cajero', 'supervisor', 'administrador');

-- Rubros de gasto aplanados (grupo / rubro / subrubro) para jerarquía en Power BI.
CREATE OR REPLACE VIEW analitica.dim_rubro_gasto AS
  WITH RECURSIVE r AS (
    SELECT id, nombre, nivel::text AS nivel, padre_id, nombre AS grupo, id AS grupo_id, nombre::text AS ruta
    FROM public.rubros_gasto WHERE padre_id IS NULL
    UNION ALL
    SELECT c.id, c.nombre, c.nivel::text, c.padre_id, r.grupo, r.grupo_id, r.ruta || ' / ' || c.nombre
    FROM public.rubros_gasto c JOIN r ON c.padre_id = r.id
  )
  SELECT id AS rubro_gasto_id, nombre, nivel, grupo, grupo_id, ruta FROM r;

-- ------------------------- HECHOS -------------------------

-- Ventas a grano de detalle (una fila por línea de venta).
CREATE OR REPLACE VIEW analitica.hechos_ventas AS
  SELECT
    d.id AS detalle_id,
    ((v.creado_en AT TIME ZONE 'UTC') AT TIME ZONE 'America/Bogota')::date AS fecha_key,
    v.turno_id, t.caja_id, v.usuario_id AS cajero_id,
    d.tipo_visitante_id, d.tipo_linea::text AS tipo_linea,
    d.cantidad, d.valor_lista, d.valor_cobrado,
    (d.valor_lista - d.valor_cobrado) * d.cantidad AS descuento_total,
    d.valor_cobrado * d.cantidad AS total_cobrado
  FROM public.venta_detalle d
  JOIN public.ventas v ON v.id = d.venta_id AND v.estado = 'completada'
  JOIN public.turnos_caja t ON t.id = v.turno_id;

-- Pagos a grano de pago (para analizar por medio sin fan-out con el detalle).
CREATE OR REPLACE VIEW analitica.hechos_ventas_pagos AS
  SELECT
    p.id AS pago_id,
    ((v.creado_en AT TIME ZONE 'UTC') AT TIME ZONE 'America/Bogota')::date AS fecha_key,
    v.turno_id, p.medio_pago_id, p.monto
  FROM public.venta_pagos p
  JOIN public.ventas v ON v.id = p.venta_id AND v.estado = 'completada';

-- Accesos (escaneos) a grano de evento.
CREATE OR REPLACE VIEW analitica.hechos_accesos AS
  SELECT
    a.id AS acceso_id,
    ((a.escaneado_en AT TIME ZONE 'UTC') AT TIME ZONE 'America/Bogota')::date AS fecha_key,
    a.punto_control_id, pc.atraccion_id,
    a.resultado::text AS resultado, a.sentido::text AS sentido, a.motivo_denegacion
  FROM public.accesos a
  JOIN public.puntos_control pc ON pc.id = a.punto_control_id;

-- Gastos (excluye anulados).
CREATE OR REPLACE VIEW analitica.hechos_gastos AS
  SELECT
    g.id AS gasto_id,
    ((g.fecha_gasto AT TIME ZONE 'UTC') AT TIME ZONE 'America/Bogota')::date AS fecha_key,
    g.rubro_gasto_id, g.proveedor_id,
    g.base_gravable, g.iva, (g.retefuente + g.reteica + g.otras_retenciones) AS retenciones,
    g.total, g.estado::text AS estado
  FROM public.gastos g
  WHERE g.estado <> 'anulado';

-- Cuadre de caja a grano de turno cerrado.
CREATE OR REPLACE VIEW analitica.hechos_cuadre_caja AS
  SELECT
    t.id AS turno_id,
    ((t.cerrado_en AT TIME ZONE 'UTC') AT TIME ZONE 'America/Bogota')::date AS fecha_key,
    t.caja_id, t.usuario_id AS cajero_id,
    t.base_inicial, t.efectivo_esperado, t.efectivo_contado, t.diferencia
  FROM public.turnos_caja t
  WHERE t.estado = 'cerrado';

-- Venta histórica (importada del Excel) — para comparativos año vs. año en Power BI.
CREATE OR REPLACE VIEW analitica.hechos_ventas_historicas AS
  SELECT id, fecha AS fecha_key, anio, mes, producto, valor, negocio
  FROM public.ventas_historicas;
