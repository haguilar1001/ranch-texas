# progreso.md — Parque Ranch Texas

Estado por fase. Se entrega una fase a la vez; no se avanza sin visto bueno del responsable.

| Fase | Contenido | Estado |
|------|-----------|--------|
| F0 | Setup, esquema BD, migraciones, seeds, auth y roles, GitHub + Railway | 🚧 En curso |
| F1 | Taquilla: venta, cálculo, medios de pago, cortesías con motivo | ⬜ Pendiente |
| F2 | Manillas con QR firmado + impresión | ⬜ Pendiente |
| F3 | Escaneo y control de acceso con reglas por punto | ⬜ Pendiente |
| F4 | Consentimientos digitales con firma | ⬜ Pendiente |
| F5 | Caja: apertura, movimientos, cierre y cuadre diario | ⬜ Pendiente |
| F6 | Gastos y rubros con soportes | ⬜ Pendiente |
| F7 | Reportes de ventas mes/año y comparativos | ⬜ Pendiente |
| F8 | Vistas `analitica`, usuario read-only y export para Power BI | ⬜ Pendiente |
| F9 | Modo offline, respaldos, despliegue y manual de usuario | ⬜ Pendiente |

## F0 — Setup (en curso)

Checklist:
- [x] Documentos del proyecto: `CLAUDE.md`, `progreso.md`, `decisiones.md`
- [x] Configuración base: `package.json`, `tsconfig`, Next, Tailwind (paleta de marca), PostCSS
- [x] Docker Compose (Postgres dev) + `.env.example`
- [x] `prisma/schema.prisma` completo (modelos, enums, índices, auditoría) — **validado** ✓
- [x] Utilidades base: `lib/dinero`, `lib/db`, `lib/qr/firma` (+ `generar`), `lib/auth`
- [x] Scripts: `festivos-co.ts`, `gen-dim-fecha.ts`, `seed.ts` (maestros + dim_fecha)
- [x] Pruebas base con Vitest — **15/15 verdes** (dinero, festivos Emiliani/Semana Santa, firma QR)
- [x] `npm install` OK, Prisma Client generado
- [x] Migración inicial aplicada — `20260802163057_init` en Postgres local ✓
- [x] Seed ejecutado — 1 admin, 6 cajas, 4 tipos+tarifas, 7 medios, 3 atracciones, 4 puntos,
      36 rubros, dim_fecha 4.748 días (festivos verificados: San José 2025 → 24-mar por Emiliani) ✓
- [ ] Repo GitHub + proyecto Railway con deploy automático — **pendiente (cuentas ya creadas)**

Notas de la fase:
- App Next.js arranca con landing por fases y la paleta de marca (provisional, ver P4).
- Dinero siempre entero COP; firma QR HMAC lista y probada offline.
- dim_fecha se genera 2023–2035 con festivos oficiales (traslado Emiliani) — banderas informativas,
  no restringen operación (el parque abre entre semana por eventos).
- Deprecación menor: `package.json#prisma` (seed) → migrar a `prisma.config.ts` en Prisma 7 (no urgente).
- **Extra:** cargada la venta histórica del Excel a `ventas_historicas` (5.302 filas, 2020–2026,
  $20.906.273.922). Tabla + migración `ventas_historicas` + `scripts/import-historico.ts`. Insumo
  para comparativos año vs año (F7/F8). Ver decisiones.md.
