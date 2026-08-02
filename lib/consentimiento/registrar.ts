import { prisma } from "../db";
import { verificarPayload } from "../qr/firma";
import { validarConsentimiento, type EntradaConsentimiento } from "./validar";
import { textoVigente } from "./texto";

export type ResultadoFirma =
  | { ok: true; consentimiento_id: string; yaExistia: boolean }
  | { ok: false; error: string };

export interface MetaFirma {
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Núcleo de firma de consentimiento (sin HTTP): verifica la manilla, valida los datos,
 * resuelve el texto vigente y guarda el consentimiento vinculado a la manilla + atracción.
 */
export async function firmar(entrada: EntradaConsentimiento, meta: MetaFirma = {}): Promise<ResultadoFirma> {
  const verif = verificarPayload(entrada.payload);
  if (!verif.valido) return { ok: false, error: "Código de manilla inválido." };

  const manilla = await prisma.manilla.findUnique({ where: { codigo_uuid: verif.uuid } });
  if (!manilla) return { ok: false, error: "Manilla no encontrada." };
  if (manilla.estado === "anulada") return { ok: false, error: "La manilla está anulada." };

  const val = validarConsentimiento(entrada);
  if (!val.ok) return { ok: false, error: val.errores.join(" ") };

  const atraccion = await prisma.atraccion.findUnique({ where: { id: entrada.atraccion_id } });
  if (!atraccion || !atraccion.activa) return { ok: false, error: "Atracción inválida." };

  const existente = await prisma.consentimiento.findFirst({ where: { manilla_id: manilla.id, atraccion_id: atraccion.id } });
  if (existente) return { ok: true, consentimiento_id: existente.id, yaExistia: true };

  const texto = await textoVigente(atraccion.id);
  if (!texto) return { ok: false, error: "No hay texto de consentimiento configurado." };

  const c = await prisma.consentimiento.create({
    data: {
      manilla_id: manilla.id,
      atraccion_id: atraccion.id,
      texto_consentimiento_id: texto.id,
      es_menor: entrada.es_menor,
      nombre_firmante: entrada.nombre_firmante.trim(),
      documento_firmante: entrada.documento_firmante.trim(),
      nombre_acudiente: entrada.es_menor ? entrada.nombre_acudiente?.trim() || null : null,
      documento_acudiente: entrada.es_menor ? entrada.documento_acudiente?.trim() || null : null,
      parentesco: entrada.es_menor ? entrada.parentesco?.trim() || null : null,
      firma_imagen: entrada.firma_imagen,
      ip: meta.ip ?? null,
      dispositivo: entrada.telefono?.trim() || null,
      user_agent: meta.userAgent ?? null,
      creado_por: "publico",
    },
  });

  return { ok: true, consentimiento_id: c.id, yaExistia: false };
}
