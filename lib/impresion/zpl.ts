// Driver ZPL para impresora Zebra (ZD411d, térmica directa, 203 dpi) sobre manilla
// Zebra Z-Band Splash de 1" (parque acuático). Genera el ZPL que marca en la manilla:
// nombre del parque, tipo de visitante en grande, QR firmado (uuid.firma), consecutivo y vigencia.
//
// Es una función PURA (string ZPL, sin efectos) igual que `construirEscPos`, para poder probarla.
// El transporte físico (Zebra Browser Print en el navegador del parque, o socket 9100 en LAN)
// se resuelve aparte: este archivo solo produce el lenguaje de la impresora.

import { textoManilla, type DatosManilla } from "./manilla";

export type { DatosManilla };
export { textoManilla };

/**
 * Geometría de la etiqueta a 203 dpi (8 puntos/mm). Ajustable si cambia el modelo de manilla.
 * ANCHO ≈ 1" (banda Z-Band Splash de 25 mm); LARGO = panel impreso a lo largo de la banda.
 */
export const ZPL_GEO = {
  dpi: 203,
  ancho: 200, // puntos (~1")
  largo: 420, // puntos (~2.07")
  qr: { x: 32, y: 116, magnif: 3, correccion: "M" as const }, // ECC M, igual que qrDataUrl
} as const;

/** Quita caracteres de control de ZPL (^ ~ \) de un texto para no romper el formato. */
function limpiar(texto: string): string {
  return (texto ?? "").replace(/[\^~\\]/g, " ").trim();
}

/** Bloque de texto centrado en todo el ancho de la manilla. */
function campoCentrado(x: number, y: number, alto: number, texto: string): string {
  return `^FO0,${y}^A0N,${alto},${alto}^FB${ZPL_GEO.ancho},1,0,C,0^FD${limpiar(texto)}^FS`;
}

/**
 * Construye el ZPL de una manilla para la impresora Zebra.
 * El QR contiene el payload firmado tal cual (`uuid.firma`), que es lo que se escanea en puerta.
 */
export function construirZpl(datos: DatosManilla): string {
  const { ancho, largo, qr } = ZPL_GEO;
  const etiqueta = datos.esCortesia ? "CORTESÍA" : limpiar(datos.tipoVisitante).toUpperCase();
  const payload = limpiar(datos.payloadQr);

  const lineas = [
    "^XA",
    "^CI28", // entrada UTF-8: permite Ñ y tildes (NIÑO, CORTESÍA, Válida)
    `^PW${ancho}`,
    `^LL${largo}`,
    "^LH0,0",
    campoCentrado(0, 12, 24, datos.parque.toUpperCase()),
    campoCentrado(0, 44, 46, etiqueta),
    `^FO${qr.x},${qr.y}^BQN,2,${qr.magnif},${qr.correccion}^FDMA,${payload}^FS`,
    campoCentrado(0, 256, 34, datos.consecutivo),
    campoCentrado(0, 300, 15, "EMITIDA"),
    campoCentrado(0, 318, 22, datos.emitida),
    campoCentrado(0, 348, 15, "VÁLIDA HASTA"),
    campoCentrado(0, 366, 22, datos.valida),
    campoCentrado(0, 398, 16, `${datos.caja} · ${datos.cajero}`),
    "^XZ",
  ];
  return lineas.join("\n");
}
