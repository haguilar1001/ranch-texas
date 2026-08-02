# Manual de usuario — Parque Ranch Texas

Guía rápida para operar el sistema. La app funciona en el PC de caja y en celulares/tablets.

## Ingreso

1. Abre la URL del sistema. Ingresa con tu **usuario** y **contraseña**.
2. Roles: **cajero** (vende y cierra su caja), **supervisor** (además anula/reimprime/reabre),
   **control_acceso** (escanea), **administrador** (todo), **consulta** (solo reportes).

## Taquilla (cajero)

1. Primero **abre tu turno de caja** (menú *Turno de caja*): elige tu caja y la **base inicial**.
2. Ve a **Taquilla**. Suma cantidades por tipo (adulto/niño $60.000; bebé y adulto mayor $0).
3. Para una **cortesía** (invitación/atención): *Cortesías → Agregar*, elige motivo y quién autoriza.
4. Registra el **pago** (puede ser mixto: efectivo + tarjeta + Nequi…). Usa *Efectivo exacto* si es solo efectivo.
5. **Registrar venta** → se generan las manillas. Pulsa **Imprimir manillas**.

### Manillas
- Cada asistente recibe una manilla con su **QR** y un **consecutivo** legible.
- Lleva también un **segundo QR de consentimiento** (para karts/motocross).
- **Reimprimir/Anular**: solo supervisor, desde la pantalla de manillas, con motivo (queda auditado).

## Consentimientos (visitante)

- El visitante **escanea con su celular** el QR de consentimiento de la manilla.
- Llena sus datos, **firma con el dedo**; si es **menor de edad**, firma el acudiente.
- Al firmar, se **desbloquea el acceso** a esa atracción.

## Control de acceso (control_acceso)

1. Abre **Escaneo**, elige el **punto** (entrada, karts, etc.) una vez.
2. Escanea el QR de la manilla (cámara o lector). El **semáforo**:
   - **Verde**: permitido (muestra entrada/salida y aforo).
   - **Rojo**: denegado, con el motivo (anulada, vencida, ya usada, falta consentimiento, aforo lleno).
3. **Sin conexión:** los escaneos quedan **en cola** y se **sincronizan solos** al volver la red
   (o con el botón *Sincronizar*). Instala la app desde el navegador para usarla como pantalla completa.

## Caja — cierre y cuadre (cajero)

1. En *Turno de caja*: registra **movimientos** (ingresos/egresos distintos a ventas).
2. Al terminar: **cuenta el efectivo por denominación**. El sistema compara con lo esperado y muestra
   la **diferencia** (sobrante/faltante); si no cuadra, escribe una observación.
3. **Cerrar turno** → ver **cuadre** (imprimible en PDF o exportable a Excel).
4. **Reabrir** un turno cerrado: solo administrador, con motivo.

## Gastos (supervisor/admin)

- *Admin → Gastos*: registra por **rubro** (grupo/rubro/subrubro), proveedor, IVA/retenciones, estado.
- *Admin → Reporte de gastos*: **presupuesto vs. ejecutado** y **P&G** del mes.

## Reportes

- **Ventas** (día/mes): entradas, ingreso, ticket promedio, por tipo/medio/día/hora.
- **Comparativo año vs. año** por mes (usa la venta histórica). Exportables a Excel.

## Power BI

Ver [powerbi.md](powerbi.md): conexión de solo lectura al esquema `analitica`.

## Problemas comunes

- **"No tienes un turno abierto"**: abre tu turno en *Turno de caja*.
- **Acceso denegado por consentimiento**: el visitante debe firmar (QR de consentimiento de la manilla).
- **Sin internet**: el escaneo sigue en cola; la taquilla requiere conexión (Starlink).
