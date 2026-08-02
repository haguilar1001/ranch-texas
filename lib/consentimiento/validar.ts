// Validación del consentimiento (pura, testeable). El texto legal se versiona en BD.

export interface EntradaConsentimiento {
  payload: string; // uuid.firma de la manilla
  atraccion_id: string;
  nombre_firmante: string;
  documento_firmante: string;
  telefono?: string;
  es_menor: boolean;
  nombre_acudiente?: string;
  documento_acudiente?: string;
  parentesco?: string;
  acepta: boolean;
  firma_imagen: string; // dataURL PNG del canvas
}

export interface ResultadoValidacion {
  ok: boolean;
  errores: string[];
}

function vacio(s?: string): boolean {
  return !s || !s.trim();
}

export function validarConsentimiento(e: EntradaConsentimiento): ResultadoValidacion {
  const errores: string[] = [];
  if (vacio(e.atraccion_id)) errores.push("Selecciona la atracción.");
  if (vacio(e.nombre_firmante)) errores.push("Ingresa nombres y apellidos.");
  if (vacio(e.documento_firmante)) errores.push("Ingresa el número de documento.");
  if (!e.acepta) errores.push("Debes aceptar el consentimiento y el tratamiento de datos.");
  if (vacio(e.firma_imagen) || !e.firma_imagen.startsWith("data:image")) errores.push("Falta la firma.");

  if (e.es_menor) {
    if (vacio(e.nombre_acudiente)) errores.push("Ingresa el nombre del acudiente.");
    if (vacio(e.documento_acudiente)) errores.push("Ingresa el documento del acudiente.");
    if (vacio(e.parentesco)) errores.push("Indica el parentesco del acudiente.");
  }

  return { ok: errores.length === 0, errores };
}
