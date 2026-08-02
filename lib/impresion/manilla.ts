// Datos y representación de texto de una manilla para impresión.
// El renderizado visual (con QR) se hace en la pantalla de impresión (80mm);
// aquí va la representación de texto que sirve como payload de la cola de impresión
// y como base para un futuro driver ESC/POS de impresora física.

export interface DatosManilla {
  parque: string;
  tipoVisitante: string; // ADULTO / NIÑO / BEBÉ / ADULTO MAYOR / CORTESÍA
  consecutivo: string; // corto y legible (respaldo si el QR se daña)
  payloadQr: string; // uuid.firma
  caja: string;
  cajero: string;
  emitida: string; // fecha/hora legible
  valida: string; // vigencia legible
  esCortesia: boolean;
}

const ANCHO = 32; // caracteres típicos de tirilla 80mm en fuente estándar

function centrar(texto: string, ancho = ANCHO): string {
  const t = texto.length > ancho ? texto.slice(0, ancho) : texto;
  const pad = Math.max(0, Math.floor((ancho - t.length) / 2));
  return " ".repeat(pad) + t;
}

function linea(car = "-"): string {
  return car.repeat(ANCHO);
}

/**
 * Representación en texto de la manilla (monoespaciada, 80mm).
 * Se guarda como payload en la cola de impresión y es la base para ESC/POS.
 */
export function textoManilla(d: DatosManilla): string {
  return [
    centrar(d.parque.toUpperCase()),
    linea(),
    centrar(d.esCortesia ? "CORTESÍA" : d.tipoVisitante.toUpperCase()),
    linea(),
    `Consecutivo: ${d.consecutivo}`,
    `Emitida: ${d.emitida}`,
    `Válida:   ${d.valida}`,
    `Caja: ${d.caja}`,
    `Cajero: ${d.cajero}`,
    linea(),
    "[QR]",
    d.payloadQr,
    linea(),
    centrar("Conserve su manilla"),
    centrar("Términos y condiciones aplican"),
  ].join("\n");
}
