// Reglas de control de acceso. Función PURA para poder probarla y para validar también offline.

export type TipoReglaAcceso = "un_ingreso" | "reingreso" | "entrada_salida";
export type SentidoAcceso = "entrada" | "salida";

export type MotivoDenegacion =
  | "firma_invalida"
  | "no_existe"
  | "anulada"
  | "vencida"
  | "ya_usada"
  | "falta_consentimiento"
  | "aforo_lleno";

export interface ReglaPunto {
  tipo_regla: TipoReglaAcceso;
  requiere_consentimiento: boolean;
  aforo_maximo: number | null;
}

export interface EstadoManillaAcceso {
  estado: "activa" | "usada" | "anulada" | "vencida";
  vencimiento: Date | null;
}

export interface ContextoAcceso {
  firmaValida: boolean;
  manilla: EstadoManillaAcceso | null;
  tieneConsentimiento: boolean; // consentimiento firmado para la atracción del punto
  ingresosPrevios: number; // accesos permitidos de esta manilla en este punto
  ultimoSentido: SentidoAcceso | null; // último sentido permitido en este punto (para entrada_salida)
  aforoActual: number; // ocupación actual del punto
  ahora: Date;
}

export interface ResultadoAcceso {
  permitido: boolean;
  sentido: SentidoAcceso | null;
  motivo?: MotivoDenegacion;
}

function denegar(motivo: MotivoDenegacion): ResultadoAcceso {
  return { permitido: false, sentido: null, motivo };
}

/**
 * Evalúa si una manilla puede acceder por un punto de control, según su regla y el estado actual.
 * No consulta la BD: recibe el contexto ya resuelto (permite validar offline por firma + snapshot).
 */
export function evaluarAcceso(regla: ReglaPunto, ctx: ContextoAcceso): ResultadoAcceso {
  if (!ctx.firmaValida) return denegar("firma_invalida");
  if (!ctx.manilla) return denegar("no_existe");
  if (ctx.manilla.estado === "anulada") return denegar("anulada");
  if (ctx.manilla.estado === "vencida") return denegar("vencida");
  if (ctx.manilla.vencimiento && ctx.ahora > ctx.manilla.vencimiento) return denegar("vencida");

  // Determinar el sentido según la regla del punto.
  let sentido: SentidoAcceso = "entrada";
  if (regla.tipo_regla === "entrada_salida") {
    sentido = ctx.ultimoSentido === "entrada" ? "salida" : "entrada";
  } else if (regla.tipo_regla === "un_ingreso") {
    if (ctx.ingresosPrevios > 0 || ctx.manilla.estado === "usada") return denegar("ya_usada");
  }
  // reingreso: siempre entrada mientras esté activa.

  // La salida no requiere consentimiento ni aforo; sí una manilla válida (ya verificado arriba).
  if (sentido === "salida") return { permitido: true, sentido: "salida" };

  // Entrada: consentimiento y aforo.
  if (regla.requiere_consentimiento && !ctx.tieneConsentimiento) return denegar("falta_consentimiento");
  if (regla.aforo_maximo !== null && ctx.aforoActual >= regla.aforo_maximo) return denegar("aforo_lleno");

  return { permitido: true, sentido: "entrada" };
}

/** Texto amable del motivo para mostrar en el semáforo rojo. */
export function textoMotivo(m: MotivoDenegacion): string {
  const mapa: Record<MotivoDenegacion, string> = {
    firma_invalida: "Código inválido o falsificado",
    no_existe: "Manilla no encontrada",
    anulada: "Manilla anulada",
    vencida: "Manilla vencida",
    ya_usada: "Manilla ya utilizada",
    falta_consentimiento: "Falta consentimiento firmado",
    aforo_lleno: "Aforo lleno",
  };
  return mapa[m];
}
