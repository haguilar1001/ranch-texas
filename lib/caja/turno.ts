import { prisma } from "@/lib/db";

/** Turno activo del usuario (abierto o reabierto). Un usuario tiene a lo sumo uno activo. */
export function turnoAbiertoDe(usuarioId: string) {
  return prisma.turnoCaja.findFirst({
    where: { usuario_id: usuarioId, estado: { in: ["abierto", "reabierto"] } },
    include: { caja: true },
  });
}
