import { prisma } from "./db";
import type { Prisma } from "@prisma/client";

// Registro de auditoría para acciones sensibles (anulaciones, reimpresiones, descuentos,
// cambios de tarifa, reapertura de turnos, login...). Ver tabla log_auditoria.

export interface EntradaAuditoria {
  usuario_id?: string | null;
  entidad: string;
  entidad_id: string;
  accion: string;
  datos_antes?: Prisma.InputJsonValue;
  datos_despues?: Prisma.InputJsonValue;
  ip?: string | null;
}

export async function registrarAuditoria(e: EntradaAuditoria): Promise<void> {
  await prisma.logAuditoria.create({
    data: {
      usuario_id: e.usuario_id ?? null,
      entidad: e.entidad,
      entidad_id: e.entidad_id,
      accion: e.accion,
      datos_antes: e.datos_antes,
      datos_despues: e.datos_despues,
      ip: e.ip ?? null,
    },
  });
}
