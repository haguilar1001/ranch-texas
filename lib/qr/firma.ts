import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";

// Firma del QR de la manilla.
// El QR NO contiene un consecutivo trivial: contiene `uuid.firma`, donde la firma es
// HMAC-SHA256(uuid, QR_HMAC_SECRET) en base64url. Esto permite validar autenticidad
// OFFLINE (sin BD); el estado (activa/usada/anulada/vencida) se valida contra la BD cuando hay red.

function secreto(): string {
  const s = process.env.QR_HMAC_SECRET;
  if (!s) {
    throw new Error("QR_HMAC_SECRET no está definido en el entorno.");
  }
  return s;
}

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Calcula la firma HMAC-SHA256 (base64url) de un uuid. */
export function firmarUuid(uuid: string, clave: string = secreto()): string {
  return base64url(createHmac("sha256", clave).update(uuid).digest());
}

/** Construye el contenido del QR: `uuid.firma`. */
export function construirPayload(uuid: string, clave?: string): string {
  return `${uuid}.${firmarUuid(uuid, clave ?? secreto())}`;
}

/** Genera una manilla nueva: uuid aleatorio + payload firmado. */
export function generarManilla(clave?: string): { uuid: string; payload: string } {
  const uuid = randomUUID();
  return { uuid, payload: construirPayload(uuid, clave) };
}

export type ResultadoVerificacion =
  | { valido: true; uuid: string }
  | { valido: false; uuid: string | null; motivo: string };

/**
 * Verifica el payload del QR por firma (offline). No consulta la BD.
 * Devuelve el uuid si la firma es válida.
 */
export function verificarPayload(payload: string, clave: string = secreto()): ResultadoVerificacion {
  if (typeof payload !== "string" || !payload.includes(".")) {
    return { valido: false, uuid: null, motivo: "formato_invalido" };
  }
  const idx = payload.lastIndexOf(".");
  const uuid = payload.slice(0, idx);
  const firma = payload.slice(idx + 1);
  if (!uuid || !firma) {
    return { valido: false, uuid: null, motivo: "formato_invalido" };
  }

  const esperada = firmarUuid(uuid, clave);
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { valido: false, uuid, motivo: "firma_invalida" };
  }
  return { valido: true, uuid };
}
