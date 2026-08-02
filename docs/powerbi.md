# Conectar Power BI — Parque Ranch Texas

La capa analítica vive en el esquema **`analitica`** (vistas en modelo estrella) sobre el mismo
PostgreSQL. Power BI se conecta directo con un usuario **de solo lectura**.

## 1. Crear el usuario de solo lectura (una vez)

Edita `scripts/sql/bi_readonly.sql` y reemplaza `CAMBIA_ESTA_CLAVE` por una clave fuerte. Luego:

- **Railway:** `psql "<DATABASE_PUBLIC_URL>" -f scripts/sql/bi_readonly.sql`
  (usa la `DATABASE_PUBLIC_URL` del servicio Postgres; requiere el TCP proxy público activado).
- **Local (Docker):** `docker exec -i ranch_texas_db psql -U ranch -d ranch_texas < scripts/sql/bi_readonly.sql`

Este usuario solo puede leer el esquema `analitica`; nunca ve las tablas de `public`.

## 2. Conectar desde Power BI Desktop

1. **Obtener datos → PostgreSQL database**.
2. Servidor: el host y puerto de Railway (`...proxy.rlwy.net:PUERTO`) o `localhost:5432` en local.
3. Base de datos: `railway` (Railway) o `ranch_texas` (local).
4. Modo: **Import** (recomendado) o DirectQuery.
5. Usuario: `bi_readonly` · Contraseña: la que definiste.
6. En el navegador, expande el esquema **`analitica`** y selecciona las vistas.

## 3. Modelo (estrella)

- **Dimensiones:** `dim_fecha`, `dim_tipo_visitante`, `dim_medio_pago`, `dim_atraccion`,
  `dim_cajero`, `dim_rubro_gasto` (con grupo/rubro/subrubro).
- **Hechos:** `hechos_ventas` (grano detalle), `hechos_ventas_pagos` (grano pago),
  `hechos_accesos`, `hechos_gastos`, `hechos_cuadre_caja`, `hechos_ventas_historicas`.

Relaciona los hechos con `dim_fecha` por `fecha_key`, y con las demás dimensiones por sus `*_id`.
`dim_fecha` trae año/trimestre/mes/nombre_mes, festivos de Colombia y bandera de temporada alta.

Para el **comparativo año vs. año**, usa `hechos_ventas_historicas` (2020–2026) junto con `dim_fecha`.

## 4. Plan B — CSV diario

Si prefieres no exponer la base: `npm run export:analitica` genera un CSV por vista en la carpeta
`EXPORT_DIR` (por defecto `./export`). Se puede programar como tarea diaria y apuntar Power BI a esa carpeta.
