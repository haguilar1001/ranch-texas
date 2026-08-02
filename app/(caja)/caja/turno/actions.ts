"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth/sesion";
import { turnoAbiertoDe } from "@/lib/caja/turno";

interface EstadoTurno {
  error?: string;
  ok?: boolean;
}

export async function abrirTurno(_prev: EstadoTurno | null, formData: FormData): Promise<EstadoTurno> {
  const s = await obtenerSesion();
  if (!s) return { error: "Sesión expirada." };

  const caja_id = String(formData.get("caja_id") ?? "");
  const base_inicial = parseInt(String(formData.get("base_inicial") ?? "0").replace(/\D/g, ""), 10) || 0;
  if (!caja_id) return { error: "Selecciona una caja." };

  if (await turnoAbiertoDe(s.id)) return { error: "Ya tienes un turno abierto." };

  await prisma.turnoCaja.create({
    data: { caja_id, usuario_id: s.id, base_inicial, creado_por: s.id },
  });

  revalidatePath("/caja/turno");
  revalidatePath("/taquilla");
  return { ok: true };
}
