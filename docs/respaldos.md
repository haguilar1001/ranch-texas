# Respaldos y restauración — Parque Ranch Texas

La base de datos es el activo crítico. Nada se borra físicamente (baja lógica), pero igual se
requiere respaldo ante fallos, errores humanos o migración de proveedor.

## Producción (Railway)

Railway hace **backups automáticos** del servicio PostgreSQL:

1. Servicio **Postgres → pestaña "Backups"**: verifica que estén activados y su frecuencia.
2. Para restaurar: selecciona un backup → **Restore**. (Railway crea una copia; sigue sus pasos.)
3. **Verifica la restauración cada cierto tiempo** restaurando a una base de prueba y revisando
   que los datos estén completos. Un backup que nunca se probó no es un backup.

## Respaldo manual (recomendado además del automático)

Descarga un volcado completo con `pg_dump` (necesitas la `DATABASE_PUBLIC_URL` de Railway):

```bash
pg_dump "<DATABASE_PUBLIC_URL>" -Fc -f ranch_texas_$(date +%Y%m%d).dump
```

Guarda ese archivo en un lugar seguro (nube personal, disco externo). Formato `-Fc` (custom) es
comprimido y restaurable con `pg_restore`.

### Local (Docker)

```bash
docker exec ranch_texas_db pg_dump -U ranch -Fc ranch_texas > ranch_texas.dump
```

## Restaurar

```bash
# En una base vacía:
pg_restore --clean --if-exists -d "<DATABASE_URL_destino>" ranch_texas.dump
```

Después de restaurar, vuelve a aplicar migraciones si es necesario (`npx prisma migrate deploy`) y
recrea el usuario de solo lectura (`scripts/sql/bi_readonly.sql`).

## Buenas prácticas

- **Frecuencia:** diaria en operación (los días de apertura).
- **Retención:** conserva al menos 30 días.
- **Secretos:** `QR_HMAC_SECRET` y `AUTH_SECRET` NO están en la base; guárdalos aparte (si se pierden,
  las manillas viejas no se pueden validar). Rotar `QR_HMAC_SECRET` invalida las manillas ya emitidas.
