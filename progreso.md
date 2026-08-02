# progreso.md — Parque Ranch Texas

Estado por fase. Se entrega una fase a la vez; no se avanza sin visto bueno del responsable.

| Fase | Contenido | Estado |
|------|-----------|--------|
| F0 | Setup, esquema BD, migraciones, seeds, auth y roles, GitHub + Railway | ✅ Completada (desplegado en Railway) |
| F1 | Taquilla: venta, cálculo, medios de pago, cortesías con motivo | ✅ Completada |
| F2 | Manillas con QR firmado + impresión | ✅ Completada |
| F3 | Escaneo y control de acceso con reglas por punto | ✅ Completada |
| F4 | Consentimientos digitales con firma | ✅ Completada |
| F5 | Caja: apertura, movimientos, cierre y cuadre diario | ✅ Completada |
| F6 | Gastos y rubros con soportes | ✅ Completada |
| F7 | Reportes de ventas mes/año y comparativos | ✅ Completada |
| F8 | Vistas `analitica`, usuario read-only y export para Power BI | ⬜ Pendiente |
| F9 | Modo offline, respaldos, despliegue y manual de usuario | ⬜ Pendiente |

## F7 — Reportes de ventas (completada, verificada)

- [x] Utilidad de variación pura y probada `lib/reportes/util.ts` (3 tests).
- [x] **Comparativo año vs. año por mes** (`/admin/reportes/comparativo`) desde la venta histórica:
      totales, variación %, tabla mensual con barras, filtro por producto, export a Excel/CSV.
- [x] Reporte de ventas en vivo (`/admin/reportes/ventas`): entradas, ingreso, ticket promedio,
      % cortesías, valor no cobrado, por tipo, por medio, por día de semana y por hora; export CSV.
- [x] Verificado con `scripts/verificar-f7.ts`: 2023 $5.096.947.030 y 2024 $4.474.715.300 (−12,2%),
      suma de meses = total, filtro por producto. Ambos reportes probados por render con datos reales.
- [x] 51 tests, typecheck limpio.

Pendiente / próximo:
- Filtros adicionales (caja/cajero) en el reporte en vivo — la base está lista.
- Cuadre **diario consolidado** (varios turnos) — pendiente de F5.
- **F8: capa analítica** (`analitica`) con vistas estrella + usuario read-only para Power BI.

## F6 — Gastos (completada, verificada)

- [x] Cálculo de gasto puro y probado `lib/gastos/calculo.ts` (total = base + IVA − retenciones).
- [x] Registro de gastos por **rubro jerárquico** (grupo/rubro/subrubro con ruta en el select),
      proveedor (upsert por nombre), NIT, IVA, retefuente/reteICA/otras, medio de pago, estado.
- [x] Marcar pagado / anular (supervisor, con auditoría).
- [x] Reporte `/admin/reportes/gastos`: **presupuesto vs. ejecutado** por grupo y **P&G simplificado**
      (ingresos por ventas del mes − gastos = resultado). Índice `/admin`.
- [x] Verificado con `scripts/verificar-f6.ts` (total con IVA, roll-up por grupo) y por render
      (rubro jerárquico; P&G $180.000 − $0). 48 tests, typecheck limpio.

Pendiente / próximo:
- **Soporte** hoy es una URL de referencia a la factura; el **upload de archivo** necesita
  almacenamiento de objetos (Railway FS es efímero) — decisión ya anotada en decisiones.md.
- **Gastos recurrentes** (plantilla mensual) y **carga de presupuesto desde Excel** — pendientes.
- **F7: Reportes de ventas** (día/mes/año, comparativo año vs año con la venta histórica).

## F5 — Caja y cuadre (completada, verificada)

- [x] Cálculo de cierre puro y probado `lib/caja/cierre.ts` (3 tests) + resumen `lib/caja/resumen.ts`.
- [x] Movimientos de caja (ingreso/egreso) con concepto, aparte de las ventas.
- [x] **Cierre con conteo por denominación** (billetes/monedas COP): efectivo esperado vs. contado,
      **diferencia** (sobrante/faltante) con observación obligatoria si no cuadra.
- [x] Fórmula: `esperado = base + ventas_efectivo + otros_ingresos − egresos`.
- [x] **Cuadre del turno** imprimible (PDF) y **export a Excel/CSV**: ventas por medio y por tipo,
      cortesías (no cobrado), anuladas, efectivo.
- [x] Cierre bloquea el turno; **reapertura solo administrador** con motivo y auditoría.
- [x] Verificado con `scripts/verificar-f5.ts` (esperado 225.000, cuadra/sobrante/faltante) y por
      render en navegador (esperado $380.000 en vivo). 46 tests, typecheck limpio.

Pendiente / próximo:
- **Cuadre diario consolidado** (todos los turnos del día) — va con los reportes de F7.
- Export a `.xlsx` nativo (hoy CSV, que Excel abre) usando la librería ya instalada, si se requiere.
- **F6: Gastos** por rubro jerárquico con soporte.

## F4 — Consentimientos digitales (completada, verificada)

- [x] Validación pura y probada `lib/consentimiento/validar.ts` (5 tests) + núcleo `registrar.ts`.
- [x] Formulario público `/consentimiento/[payload]` (sin auth): desde el QR de la manilla, datos del
      firmante, **menor → datos y firma del acudiente**, **lienzo de firma con el dedo**, aceptación
      expresa (Ley 1581 de 2012), texto legal **versionado** por atracción.
- [x] Un consentimiento firmado **desbloquea el acceso** a esa atracción (F3 lo reconoce al instante).
- [x] Se guarda: versión del texto, fecha/hora, IP, dispositivo, atracción y manilla; `es_menor`.
- [x] Comprobante imprimible/PDF `/consentimiento/comprobante/[id]`.
- [x] **QR de consentimiento impreso en cada manilla** (el visitante lo escanea con su celular).
- [x] Verificado con `scripts/verificar-f4.ts`: deniega sin firma → firma → **desbloquea acceso**;
      menor con acudiente; idempotente. Formulario probado por render (SSR). 43 tests, typecheck limpio.

Pendiente / próximo:
- Texto legal es **BORRADOR** — debe revisarlo el área legal antes de producción (está versionado en BD).
- Textos específicos por atracción (hoy usan el general); cargar por atracción cuando estén.
- **F5: Caja** (apertura ya existe; falta movimientos, cierre con conteo por denominación y cuadre).

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
