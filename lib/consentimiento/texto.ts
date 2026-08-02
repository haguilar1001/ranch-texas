import { prisma } from "../db";

/** Texto de consentimiento vigente para una atracción (específico si existe, si no el general). */
export async function textoVigente(atraccionId: string) {
  const especifico = await prisma.textoConsentimiento.findFirst({
    where: { activo: true, atraccion_id: atraccionId },
    orderBy: { version: "desc" },
  });
  if (especifico) return especifico;
  return prisma.textoConsentimiento.findFirst({
    where: { activo: true, atraccion_id: null },
    orderBy: { version: "desc" },
  });
}
