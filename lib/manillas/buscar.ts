import { prisma } from "../db";
import { formatearFechaHoraBogota } from "../tiempo";
import type { Prisma, EstadoManilla } from "@prisma/client";

// Buscador de manillas por consecutivo o número de venta, filtrable por estado.
// Solo consulta: las acciones (reimprimir/anular) viven en la página de la venta, auditadas.

export interface FiltroManillas {
  q?: string;
  estado?: string; // activa | usada | anulada | todas
  limit?: number;
}

export interface FilaManilla {
  id: string;
  consecutivo: string;
  tipo: string;
  estado: EstadoManilla;
  ventaId: string;
  numeroVenta: number;
  caja: string;
  cajero: string;
  emitida: string;
  vence: string;
  reimpresa: number;
}

const ESTADOS_VALIDOS = ["activa", "usada", "anulada"];

export async function buscarManillas(f: FiltroManillas): Promise<FilaManilla[]> {
  const q = f.q?.trim();
  const estado = f.estado && ESTADOS_VALIDOS.includes(f.estado) ? (f.estado as EstadoManilla) : undefined;
  const num = q && /^\d+$/.test(q) ? parseInt(q, 10) : undefined;

  const where: Prisma.ManillaWhereInput = {};
  if (estado) where.estado = estado;
  if (q) {
    where.OR = [
      { consecutivo: { contains: q, mode: "insensitive" } },
      ...(num !== undefined ? [{ venta_detalle: { venta: { numero_venta: num } } } as Prisma.ManillaWhereInput] : []),
    ];
  }

  const manillas = await prisma.manilla.findMany({
    where,
    take: f.limit ?? 100,
    orderBy: { creado_en: "desc" },
    include: {
      tipo_visitante: { select: { nombre: true } },
      venta_detalle: {
        include: {
          venta: {
            include: { turno: { include: { caja: { select: { nombre: true } } } }, usuario: { select: { nombre: true } } },
          },
        },
      },
    },
  });

  return manillas.map((m) => {
    const venta = m.venta_detalle.venta;
    return {
      id: m.id,
      consecutivo: m.consecutivo,
      tipo: m.es_bebe ? "Bebé" : m.tipo_visitante.nombre,
      estado: m.estado,
      ventaId: venta.id,
      numeroVenta: venta.numero_venta,
      caja: venta.turno.caja.nombre,
      cajero: venta.usuario.nombre,
      emitida: formatearFechaHoraBogota(m.creado_en),
      vence: m.vencimiento ? formatearFechaHoraBogota(m.vencimiento) : "—",
      reimpresa: m.reimpresa_veces,
    };
  });
}
