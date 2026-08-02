-- Usuario de SOLO LECTURA para conectar Power BI al esquema `analitica`.
-- Ejecutar UNA VEZ por el administrador de la base. Reemplaza 'CAMBIA_ESTA_CLAVE'
-- por una clave fuerte ANTES de ejecutar. NO subas este archivo con la clave real.
--
-- Local (Docker):  docker exec -i ranch_texas_db psql -U ranch -d ranch_texas < scripts/sql/bi_readonly.sql
-- Railway:         psql "<DATABASE_PUBLIC_URL>" -f scripts/sql/bi_readonly.sql

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bi_readonly') THEN
    CREATE ROLE bi_readonly LOGIN PASSWORD 'CAMBIA_ESTA_CLAVE';
  END IF;
END $$;

-- Acceso SOLO al esquema analitica (las vistas resuelven las tablas de public con permisos
-- del dueño; bi_readonly nunca ve las tablas de public directamente).
GRANT USAGE ON SCHEMA analitica TO bi_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA analitica TO bi_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA analitica GRANT SELECT ON TABLES TO bi_readonly;

-- Asegurar que NO tenga acceso al esquema public.
REVOKE ALL ON SCHEMA public FROM bi_readonly;
