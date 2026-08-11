"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerSesion, tieneRol } from "@/lib/auth/sesion";
import { registrarAuditoria } from "@/lib/audit";

export interface ResultadoAccion {
  ok: boolean;
  error?: string;
}

/**
 * Anula UNA manilla individual: baja lógica (estado anulada + motivo/usuario/fecha).
 * Revoca el acceso de esa manilla (evaluarAcceso deniega "anulada"), pero NO modifica la venta
 * ni el dinero: los totales de la venta deben seguir recalculables desde el detalle. Para una
 * devolución se anula la venta completa. Solo supervisor/administrador, con motivo, auditado.
 */
export async function anularManilla(manillaId: string, motivo: string): Promise<ResultadoAccion> {
  const s = await obtenerSesion();
  if (!s) return { ok: false, error: "Sesión expirada." };
  if (!tieneRol(s.rol, "supervisor")) return { ok: false, error: "Solo un supervisor puede anular manillas." };

  const m = (motivo ?? "").trim();
  if (!m) return { ok: false, error: "Indica el motivo de la anulación." };

  const manilla = await prisma.manilla.findUnique({
    where: { id: manillaId },
    select: { id: true, estado: true, consecutivo: true },
  });
  if (!manilla) return { ok: false, error: "Manilla no encontrada." };
  if (manilla.estado === "anulada") return { ok: false, error: "La manilla ya está anulada." };

  await prisma.manilla.update({
    where: { id: manillaId },
    data: { estado: "anulada", anulada_en: new Date(), anulada_por: s.id, motivo_anulacion: m, actualizado_por: s.id },
  });

  await registrarAuditoria({
    usuario_id: s.id,
    entidad: "manilla",
    entidad_id: manillaId,
    accion: "anular_manilla",
    datos_antes: { estado: manilla.estado },
    datos_despues: { estado: "anulada", consecutivo: manilla.consecutivo, motivo: m },
  });

  revalidatePath("/admin/manillas");
  return { ok: true };
}
