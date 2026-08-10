# Zebra Browser Print — SDK (no versionado)

El botón "🏷️ Imprimir manilla (Zebra)" de la pantalla de impresión usa el SDK de Zebra Browser Print,
que es **propietario de Zebra** y no se incluye en el repo.

## Instalación en el equipo del cajero (parque)

1. Instalar la app **Zebra Browser Print** (Windows/Mac) desde el portal de Zebra.
2. Conectar la impresora **Zebra ZD411d** (USB o red) y marcarla como **predeterminada** en Browser Print.
3. Cargar el rollo de manilla **Z-Band Splash 1"**.

## SDK en la app

- Descargar `BrowserPrint-3.x.min.js` del portal de Zebra Browser Print.
- Guardarlo aquí como **`public/vendor/BrowserPrint.min.js`** (ese nombre exacto).
- El código lo carga bajo demanda desde `/vendor/BrowserPrint.min.js` (ver `lib/impresion/browserPrint.ts`).

Sin este archivo, el botón muestra un aviso claro ("No se detectó Zebra Browser Print…") y no rompe nada;
la impresión por navegador sigue funcionando como respaldo.
