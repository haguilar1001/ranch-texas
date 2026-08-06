# decisiones.md — Parque Ranch Texas

Registro de decisiones tomadas y pendientes. Fecha de referencia inicial: 2026-08-02.

## Decisiones tomadas

### Despliegue e infraestructura
- **Nube en Railway.** Repo en GitHub, app Next.js + PostgreSQL administrado en Railway, deploy
  automático desde GitHub, `prisma migrate` en el pipeline. Docker Postgres solo para desarrollo.
  Cuentas de GitHub/Railway ya creadas por el responsable.
- Escaneo y consentimientos como **PWA con cola offline (IndexedDB)** para tolerar microcortes de
  internet (Starlink en instalación). Taquilla/impresión dependen de conexión con colas resilientes.
- **Trade-off aceptado:** con Railway, si se cae internet la taquilla se ve afectada; se mitiga con
  colas y con la PWA para lo más sensible (escaneo/consentimiento).

### Stack
- Next.js App Router + TypeScript + Tailwind; Prisma ORM; auth propia (JWT en cookie httpOnly),
  sesión corta en caja; pruebas con Vitest.

### Reglas de negocio
- **Tarifa todo incluido** (parque + todas las atracciones, sin cobro extra).
- **$60.000 solo adulto y niño.** **Bebé (≤2 años) = $0** y **adulto mayor (+70) = $0**; ambos
  generan manilla igual.
- Tipos `atencion` e `invitacion` no pagan pero exigen **motivo + autorización**.
- Tarifas con **vigencia por fechas**; nunca se sobrescriben (nueva fila con `vigente_desde`).
- **Acceso:** parque de **una sola entrada** con **reingreso el mismo día** (regla `entrada_salida`).
- **Aforo del parque: 3.000** personas. Sin aforo por atracción.
- Consentimiento **por atracción**.
- **Texto legal del consentimiento** ✅ *(2026-08-05):* el responsable entregó el texto OFICIAL
  (DIVERSIONES DEL OCCIDENTE S.A.S. — consentimiento informado, exoneración de responsabilidad,
  habeas data Ley 1581/2012, autorización de imagen y CCTV, contacto inforanchtexas@gmail.com).
  Reemplaza el BORRADOR; queda versionado (v2) en `scripts/consentimiento-texto.ts` + `seed.ts`.
  Nota: los "numerales" que referencia el texto asumen numeración de lista; validar con el abogado
  la numeración/formato final antes de producción.
- **Un turno por día** por caja.
- **~60 ventas/hora** en día pico (dimensionamiento).
- **Sin factura electrónica DIAN** y **sin IVA/impoconsumo** por ahora. Interface de facturación
  queda lista pero inactiva.
- Festivos oficiales de Colombia (con traslado Emiliani) + **temporada alta editable**.
- **Operación NO restringida por calendario:** el parque también abre **entre semana cuando hay
  eventos**. El día operativo se define porque se abre un turno de caja, cualquier día. `dim_fecha`
  solo lleva banderas informativas; no bloquea la operación. (Futuro: bandera/tabla `eventos` para
  analizar días de evento en Power BI.)

### Marca
- Logo: **Ranch Texas Express** (tema western). Paleta:
  - Marrón oscuro `#3B2416`
  - Crema `#F4EAD7`
  - Dorado/mostaza `#C79A3C`
  - Verde hoja `#57A23C`
- Archivo del logo esperado en `public/logo.png` (lo sube el responsable; placeholder mientras tanto).

## Pendientes
- **(P1) Lista final de atracciones.** ✅ *Parcial (2026-08-05):* el responsable envió las **9 atracciones
  que EXIGEN consentimiento**: Mario Karts, Karts Fórmula 1, Karts Buggies, Karts Areneros, Karts Playeros,
  Motocross, Botes, Paseo Caballo, Paseo Pony (ya en `seed.ts`). **Falta** la lista de atracciones/zonas
  que NO exigen consentimiento (piscinas, etc.) para completar el catálogo.
- **(P2) Tabla de requisitos de edad/estatura por atracción.** La envía el responsable.
- **(P3) Medios de pago:** el responsable está verificando la lista propuesta (efectivo, débito,
  crédito, Nequi, Daviplata, transferencia, bono/convenio).
- **(P4) Logo definitivo.** El logo "Ranch Texas Express" enviado NO es el final; el responsable
  enviará el correcto. La paleta de marca actual es **provisional** y se ajusta en un solo lugar
  (`tailwind.config.ts` → colores `ranch`). Archivo esperado en `public/logo.png`.

### Venta histórica (Excel)
- Se cargó la venta histórica desde `D:\Datos\13 - Ventas No Salud\01 - Ranch Texas.xlsx`
  (hoja "Datos", columnas FECHA/PRODUCTO/VALOR/NEGOCIO) a la tabla **`ventas_historicas`**.
- Es data **agregada por fecha y línea de producto** (no transaccional), separada del modelo de
  ventas en vivo. Alimenta los comparativos año vs año en Power BI (F7/F8).
- Rango 2020-01 a 2026-07; **5.302 filas** válidas (se omiten 1.465 sin valor); total
  **$20.906.273.922**. 19 productos (ENTRADAS domina con ~$14.700M).
- Granularidad mixta: 2020–2021 mensual, 2023–2024 diaria. Se guarda por fecha; Power BI agrupa.
- **Solo se carga RANCH TEXAS** (decisión del responsable). Los demás negocios de la carpeta NO se
  cargan. Total cargado: **5.302 filas · $20.906.273.922** (2020-01 a 2026-07).
- Importador genérico e idempotente por `origen` (nombre de archivo); detecta encabezado por nombre de
  columna. Por defecto apunta solo a `01 - Ranch Texas.xlsx`. Soporta carpeta (multi-negocio) si en el
  futuro se decide consolidar varios: `npm run import:historico -- "<carpeta o xlsx>"`.
- Calidad de datos del origen (Ranch Texas): granularidad mixta (2020–2021 mensual, 2023–2024 diaria);
  1.465 filas sin valor omitidas. Revisar antes de usar en reportes oficiales.

## Decisiones técnicas a resolver en su fase
- `roles`: enum fijo (5 roles) vs. tabla configurable de permisos. Arranca como enum.
- Consecutivo de venta/manilla: ¿por caja, por día, global? (afecta reimpresión y facturación futura).
- Hora de corte del "día operativo" para cuadre diario y export CSV (no medianoche UTC).
- Vencimiento de manilla: fin del día operativo; definir hora de corte exacta.
- Almacenamiento de firmas de consentimiento e imágenes de soporte de gastos: volumen de Railway vs.
  almacenamiento externo (S3/UploadThing). Railway tiene filesystem efímero.
- Política ante **doble ingreso/aforo en modo offline**: reconciliación al sincronizar + alerta
  auditada (no se puede "des-ingresar").
- Verificación periódica de restauración de backups de Railway.
