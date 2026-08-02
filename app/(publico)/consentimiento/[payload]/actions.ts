"use server";

import { headers } from "next/headers";
import { firmar, type ResultadoFirma } from "@/lib/consentimiento/registrar";
import type { EntradaConsentimiento } from "@/lib/consentimiento/validar";

export async function firmarConsentimiento(entrada: EntradaConsentimiento): Promise<ResultadoFirma> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
  const userAgent = h.get("user-agent");
  return firmar(entrada, { ip, userAgent });
}
