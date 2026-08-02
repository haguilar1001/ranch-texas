import { prisma } from "@/lib/db";

/** Turno abierto del usuario (incluye la caja). Un usuario tiene a lo sumo un turno abierto. */
export function turnoAbiertoDe(usuarioId: string) {
  return prisma.turnoCaja.findFirst({
    where: { usuario_id: usuarioId, estado: "abierto" },
    include: { caja: true },
  });
}
