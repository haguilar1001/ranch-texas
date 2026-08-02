# CLAUDE.md — Parque Ranch Texas

Contexto del proyecto y convenciones para trabajar en este repositorio.

## Qué es
App web única para operar el Parque Ranch Texas (Baranoa, Colombia): venta de manillas con QR,
control de acceso, consentimientos firmados, cuadre de caja, gastos y capa analítica para Power BI.

## Stack
- **Next.js (App Router) + TypeScript + Tailwind** — una sola app (frontend + backend).
- **PostgreSQL** administrado en **Railway** (producción). Docker Postgres para desarrollo local.
- **Prisma** ORM con migraciones versionadas.
- **GitHub** para el repo/CI; deploy automático a Railway.
- Auth usuario/contraseña con roles y sesión corta (JWT en cookie httpOnly).
- Pruebas: **Vitest**.

## Convenciones
- **Idioma:** entidades y campos de negocio en **español** (`ventas`, `valor_total`, `tipo_visitante`);
  funciones y código técnico en **inglés**.
- **Moneda:** COP entero, sin decimales. Nunca `Float`/`Decimal` para dinero → siempre `Int`.
  Formateo con `lib/dinero` (`$ 1.234.567`).
- **Zona horaria:** guardar en UTC; presentar en `America/Bogota`.
- **Nada se borra físicamente.** Baja lógica con estados (`activo`, enums de estado) + usuario/motivo/fecha.
- **Auditoría transversal:** toda tabla lleva `creado_en`, `creado_por`, `actualizado_en`, `actualizado_por`.
- **Totales de venta** se guardan en el encabezado pero deben poder recalcularse desde el detalle
  (hay test de consistencia).
- **Operación NO restringida por calendario:** el parque abre fines de semana, festivos y **entre semana
  cuando hay eventos**. El "día operativo" se define porque se abre un turno de caja, cualquier día.

## Estructura
```
/app     rutas (taquilla, caja, escaneo, consentimiento público, admin, reportes) + /api
/lib     impresion, qr (firma HMAC), offline, dinero, auth, db, audit, facturacion
/prisma  schema.prisma + migrations (incluye migración manual del schema `analitica`)
/scripts seed.ts, gen-dim-fecha.ts, festivos-co.ts
/tests   pruebas Vitest
```

## Comandos
```bash
npm run dev            # desarrollo
npm run db:up          # docker compose up postgres (dev)
npm run prisma:migrate # migraciones dev
npm run seed           # datos maestros + dim_fecha (+ seeds de prueba con --demo)
npm test               # pruebas
```

## Fases
Ver `progreso.md`. Se entrega **una fase a la vez**, con pruebas verdes + commit + resumen, y no se
avanza sin visto bueno del responsable. Decisiones y pendientes en `decisiones.md`.

## Reglas de negocio clave
- Tarifa **todo incluido** $60.000 solo **adulto y niño**; **bebé (≤2) y adulto mayor (+70) = $0**
  (generan manilla igual). `atencion`/`invitacion` no pagan pero exigen motivo + autorización.
- Tarifas con **vigencia por fechas**, nunca se sobrescriben (nueva fila con `vigente_desde`).
- Parque de **una sola entrada** con **reingreso el mismo día** (regla `entrada_salida`).
  **Aforo del parque: 3.000**.
- **Sin factura DIAN** y **sin IVA/impoconsumo** por ahora (interface de facturación lista pero inactiva).
