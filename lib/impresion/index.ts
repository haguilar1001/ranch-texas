// Módulo de impresión ABSTRAÍDO para no acoplar el resto del sistema a una impresora concreta.
// Hoy: impresión por el navegador (window.print) sobre la vista 80mm. A futuro: driver ESC/POS
// (tirilla térmica) o ZPL (Zebra) implementando la misma interfaz `Impresora`, sin tocar el resto.

import { textoManilla, type DatosManilla } from "./manilla";

export type { DatosManilla };
export { textoManilla };

export interface Impresora {
  /** Envía el contenido de una manilla a la impresora. */
  imprimirManilla(datos: DatosManilla): Promise<void>;
  nombre: string;
}

/**
 * Driver ESC/POS mínimo (tirilla térmica 80mm) — placeholder para hardware real.
 * Genera los bytes básicos (init, texto, corte). No se usa en el flujo por navegador todavía.
 */
export function construirEscPos(datos: DatosManilla): Uint8Array {
  const ESC = 0x1b;
  const GS = 0x1d;
  const init = [ESC, 0x40]; // inicializar
  const texto = Array.from(textoManilla(datos) + "\n\n\n", (c) => c.charCodeAt(0) & 0xff);
  const corte = [GS, 0x56, 0x00]; // corte total
  return Uint8Array.from([...init, ...texto, ...corte]);
}
