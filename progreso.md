# progreso.md — Parque Ranch Texas

Estado por fase. Se entrega una fase a la vez; no se avanza sin visto bueno del responsable.

| Fase | Contenido | Estado |
|------|-----------|--------|
| F0 | Setup, esquema BD, migraciones, seeds, auth y roles, GitHub + Railway | ✅ Completada (desplegado en Railway) |
| F1 | Taquilla: venta, cálculo, medios de pago, cortesías con motivo | ✅ Completada |
| F2 | Manillas con QR firmado + impresión | ✅ Completada |
| F3 | Escaneo y control de acceso con reglas por punto | ✅ Completada |
| F4 | Consentimientos digitales con firma | ⬜ Pendiente |
| F5 | Caja: apertura, movimientos, cierre y cuadre diario | ⬜ Pendiente |
| F6 | Gastos y rubros con soportes | ⬜ Pendiente |
| F7 | Reportes de ventas mes/año y comparativos | ⬜ Pendiente |
| F8 | Vistas `analitica`, usuario read-only y export para Power BI | ⬜ Pendiente |
| F9 | Modo offline, respaldos, despliegue y manual de usuario | ⬜ Pendiente |

## F3 — Escaneo y control de acceso (completada, verificada)

- [x] Reglas de acceso puras y probadas: `lib/acceso/validar.ts` (`evaluarAcceso`); 8 tests.
- [x] Núcleo `lib/acceso/procesar.ts`: verifica firma, aplica reglas del punto, registra el acceso
      (permitido/denegado + motivo) y calcula aforo del día. Testeable sin HTTP.
- [x] Reglas por punto: un_ingreso / reingreso / entrada_salida; requiere consentimiento; aforo máx.
- [x] Pantalla `/escaneo` móvil: selección de punto, lector manual/USB (Enter) y **cámara**
      (BarcodeDetector, mejora progresiva), **semáforo verde/rojo** con motivo, sentido y aforo en vivo.
- [x] Todo escaneo se guarda en `accesos` (hora, punto, usuario, resultado, sentido).
- [x] Verificado con `scripts/verificar-f3.ts`: entrada/salida alterna, aforo neto correcto,
      QR falsificado / falta consentimiento / manilla anulada → DENEGADO. Typecheck limpio, 38 tests.

Pendiente / próximo:
- Modo **offline** del escáner (validar por firma + cola IndexedDB + sync) → va en F9.
- Reglas de edad/estatura por punto: la estructura existe, pero su aplicación estricta depende de los
  datos del **consentimiento (F4)** (la manilla no lleva la edad exacta).
- Interacción de la UI probada por render + verificación determinista; el clic automatizado en dev
  es poco fiable por hidratación (no es un bug — sin errores de consola).
- **F4: consentimientos** desbloquearán los puntos que hoy exigen consentimiento (karts, motocross).

## F2 — Manillas con QR e impresión (completada, verificada)

- [x] Núcleo de venta refactorizado a `lib/ventas/registrar.ts` (`crearVenta`) — testeable sin HTTP.
- [x] Al vender se genera **una manilla por asistente** (incluidos bebés y cortesías): UUID +
      firma HMAC + consecutivo legible (`#venta-n`) + vencimiento (fin del día operativo).
- [x] Cola de impresión persistente (`impresiones`, estado pendiente/impreso) con payload de tirilla.
- [x] Módulo de impresión abstraído `lib/impresion` (driver ESC/POS 80mm placeholder) + test.
- [x] Pantalla de impresión 80mm con **QR grande**, tipo en letra grande, consecutivo, vigencia,
      caja/cajero y leyenda; botón Imprimir (window.print) + marcar impreso.
- [x] Reimpresión y anulación **solo supervisor**, con motivo y **auditoría** (`log_auditoria`);
      anular marca venta + todas sus manillas como anuladas.
- [x] Verificado con `scripts/verificar-f2.ts`: 4 manillas / 4 asistentes, firmas QR válidas,
      bebé marcado, cola poblada, totales consistentes. Pantalla de impresión probada en navegador
      (QR PNG 312×312 renderizados). Typecheck limpio, 30 tests verdes.

Pendiente / próximo:
- Impresión física real (driver ESC/POS sobre hardware) cuando se defina la impresora (P: modelo).
- `numero_venta`/consecutivo bajo concurrencia: reintento ante choque de único.
- **F3: escaneo y control de acceso** validará estas manillas por firma + estado.

## F1 — Taquilla (funcional, probada end-to-end)

- [x] Lógica de venta pura y probada: `lib/ventas/calculo.ts` (totales + validación); 12 tests.
- [x] Login/logout (JWT en cookie httpOnly) + control de rol.
- [x] Apertura de turno de caja (mínima; el cierre/cuadre va en F5).
- [x] Taquilla: cantidades por tipo, cortesías (atención/invitación) con motivo + autorización,
      pago mixto, "efectivo exacto", totales en vivo, precios recalculados en el servidor.
- [x] Server action transaccional `registrarVenta` (encabezado + detalle + pagos), consecutivo por turno.
- [x] Probado E2E con navegador: login → turno → venta #1 (2 adultos + 1 niño, $180.000) →
      consistencia en BD (encabezado = detalle = pagos). Typecheck y 27 tests verdes.

Pendiente dentro de F1 / próximos:
- Descuentos parciales en la UI (la lógica y tests ya existen; falta el control en pantalla).
- Captura opcional de comprador (nombre/documento) — campos ya en el modelo.
- Anulación/reimpresión de venta (van con manillas en F2, requieren supervisor + auditoría).
- `numero_venta` bajo concurrencia (aggregate+create): agregar reintento ante choque de único.
- **F2 generará las manillas con QR e impresión** a partir del detalle de la venta.

## F0 — Setup (completada)

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
