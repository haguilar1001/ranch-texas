"use server";

import { obtenerSesion } from "@/lib/auth/sesion";
import { turnoAbiertoDe } from "@/lib/caja/turno";
import { crearVenta } from "@/lib/ventas/registrar";
import type { EntradaVenta, ResultadoVenta } from "@/lib/ventas/tipos";

export async function registrarVenta(entrada: EntradaVenta): Promise<ResultadoVenta> {
  const s = await obtenerSesion();
  if (!s) return { ok: false, error: "Sesión expirada." };
  if (!["cajero", "supervisor", "administrador"].includes(s.rol)) {
    return { ok: false, error: "Tu rol no puede registrar ventas." };
  }

  const turno = await turnoAbiertoDe(s.id);
  if (!turno) return { ok: false, error: "No tienes un turno abierto." };

  return crearVenta(
    { usuarioId: s.id, usuarioNombre: s.nombre, turnoId: turno.id, cajaNombre: turno.caja.nombre },
    entrada,
  );
}
