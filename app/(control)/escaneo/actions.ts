"use server";

import { obtenerSesion, tieneRol } from "@/lib/auth/sesion";
import { procesarEscaneo, type ResultadoEscaneo, type ResultadoEscaneoError } from "@/lib/acceso/procesar";

export async function escanear(
  puntoId: string,
  payload: string,
): Promise<ResultadoEscaneo | ResultadoEscaneoError> {
  const s = await obtenerSesion();
  if (!s) return { error: "Sesión expirada." };
  if (!tieneRol(s.rol, "control_acceso")) return { error: "Tu rol no puede registrar accesos." };
  if (!payload?.trim()) return { error: "Sin código." };
  return procesarEscaneo(s.id, puntoId, payload.trim(), "web");
}
