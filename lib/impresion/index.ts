// Módulo de impresión ABSTRAÍDO para no acoplar el resto del sistema a una impresora concreta.
// Hoy: impresión por el navegador (window.print) sobre la vista 80mm. Drivers disponibles: ESC/POS
// (tirilla térmica) y ZPL (Zebra ZD411d + Z-Band Splash), implementando la misma interfaz `Impresora`.

import { textoManilla, type DatosManilla } from "./manilla";
import { construirZpl, ZPL_GEO } from "./zpl";

export type { DatosManilla };
export { textoManilla, construirZpl, ZPL_GEO };

export interface Impresora {
  /** Envía el contenido de una manilla a la impresora. */
  imprimirManilla(datos: DatosManilla): Promise<void>;
  nombre: string;
}

/** Transporte que entrega el ZPL a la impresora física (Zebra Browser Print, socket 9100, etc.). */
export type EnviarZpl = (zpl: string) => Promise<void>;

/**
 * Impresora Zebra por ZPL. Construye el ZPL de la manilla y lo entrega al transporte inyectado,
 * sin acoplar el resto del sistema a cómo se conecta la impresora (navegador o red del parque).
 */
export class ImpresoraZebraZpl implements Impresora {
  readonly nombre = "Zebra ZD411d (ZPL)";
  constructor(private readonly enviar: EnviarZpl) {}
  async imprimirManilla(datos: DatosManilla): Promise<void> {
    await this.enviar(construirZpl(datos));
  }
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
