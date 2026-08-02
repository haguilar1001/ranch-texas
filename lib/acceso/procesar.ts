import { prisma } from "../db";
import { verificarPayload } from "../qr/firma";
import { inicioDelDiaOperativo } from "../tiempo";
import { evaluarAcceso, textoMotivo, type ContextoAcceso, type ReglaPunto } from "./validar";

export interface ResultadoEscaneo {
  permitido: boolean;
  motivo?: string; // texto amable si se deniega
  sentido: "entrada" | "salida" | null;
  puntoNombre: string;
  manilla: { consecutivo: string; tipo: string } | null;
  aforoActual: number;
  aforoMaximo: number | null;
  acceso_id: string;
}

export interface ResultadoEscaneoError {
  error: string;
}

/**
 * Procesa un escaneo: verifica firma, aplica las reglas del punto, registra el acceso
 * y devuelve el resultado para el semáforo. Núcleo testeable sin HTTP.
 */
export async function procesarEscaneo(
  usuarioId: string | null,
  puntoControlId: string,
  payload: string,
  dispositivo?: string | null,
): Promise<ResultadoEscaneo | ResultadoEscaneoError> {
  const punto = await prisma.puntoControl.findUnique({ where: { id: puntoControlId } });
  if (!punto || !punto.activo) return { error: "Punto de control inválido." };

  const regla: ReglaPunto = {
    tipo_regla: punto.tipo_regla,
    requiere_consentimiento: punto.requiere_consentimiento,
    aforo_maximo: punto.aforo_maximo,
  };

  const ahora = new Date();
  const verif = verificarPayload(payload);

  // Buscar la manilla si la firma es válida.
  const manilla = verif.valido
    ? await prisma.manilla.findUnique({
        where: { codigo_uuid: verif.uuid },
        include: { venta_detalle: { include: { tipo_visitante: true } } },
      })
    : null;

  // Consentimiento para la atracción del punto.
  let tieneConsentimiento = false;
  if (regla.requiere_consentimiento && punto.atraccion_id && manilla) {
    tieneConsentimiento =
      (await prisma.consentimiento.count({ where: { manilla_id: manilla.id, atraccion_id: punto.atraccion_id } })) > 0;
  }

  // Historial de esta manilla en este punto.
  const [ingresosPrevios, ultimo] = manilla
    ? await Promise.all([
        prisma.acceso.count({ where: { manilla_id: manilla.id, punto_control_id: puntoControlId, resultado: "permitido" } }),
        prisma.acceso.findFirst({
          where: { manilla_id: manilla.id, punto_control_id: puntoControlId, resultado: "permitido", sentido: { not: null } },
          orderBy: { escaneado_en: "desc" },
          select: { sentido: true },
        }),
      ])
    : [0, null];

  // Aforo del día operativo en este punto.
  const inicio = inicioDelDiaOperativo(ahora);
  const [entradas, salidas] = await Promise.all([
    prisma.acceso.count({ where: { punto_control_id: puntoControlId, resultado: "permitido", sentido: "entrada", escaneado_en: { gte: inicio } } }),
    prisma.acceso.count({ where: { punto_control_id: puntoControlId, resultado: "permitido", sentido: "salida", escaneado_en: { gte: inicio } } }),
  ]);
  const aforoActual = Math.max(0, entradas - salidas);

  const ctx: ContextoAcceso = {
    firmaValida: verif.valido,
    manilla: manilla ? { estado: manilla.estado, vencimiento: manilla.vencimiento } : null,
    tieneConsentimiento,
    ingresosPrevios,
    ultimoSentido: (ultimo?.sentido as "entrada" | "salida" | null) ?? null,
    aforoActual,
    ahora,
  };

  const res = evaluarAcceso(regla, ctx);

  // Registrar el acceso (permitido o denegado).
  const acceso = await prisma.acceso.create({
    data: {
      manilla_id: manilla?.id ?? null,
      punto_control_id: puntoControlId,
      resultado: res.permitido ? "permitido" : "denegado",
      sentido: res.sentido,
      motivo_denegacion: res.motivo ?? null,
      escaneado_por: usuarioId,
      dispositivo: dispositivo ?? null,
      escaneado_en: ahora,
      sincronizado: true,
    },
  });

  // Un solo ingreso: marcar la manilla como usada al entrar.
  if (res.permitido && res.sentido === "entrada" && regla.tipo_regla === "un_ingreso" && manilla) {
    await prisma.manilla.update({ where: { id: manilla.id }, data: { estado: "usada", usada_en: ahora } });
  }

  // Aforo tras este escaneo (para mostrar en vivo).
  const aforoDespues = res.permitido
    ? res.sentido === "entrada"
      ? aforoActual + 1
      : Math.max(0, aforoActual - 1)
    : aforoActual;

  const tipo = manilla ? (manilla.es_bebe ? "BEBÉ" : manilla.venta_detalle.tipo_visitante.nombre) : "";

  return {
    permitido: res.permitido,
    motivo: res.motivo ? textoMotivo(res.motivo) : undefined,
    sentido: res.sentido,
    puntoNombre: punto.nombre,
    manilla: manilla ? { consecutivo: manilla.consecutivo, tipo } : null,
    aforoActual: aforoDespues,
    aforoMaximo: punto.aforo_maximo,
    acceso_id: acceso.id,
  };
}
