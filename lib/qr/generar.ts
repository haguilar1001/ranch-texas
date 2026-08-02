import QRCode from "qrcode";

// Generación de la imagen del QR a partir del payload firmado (ver firma.ts).

/** Devuelve el QR como Data URL PNG (para vista previa en pantalla). */
export async function qrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 8,
  });
}

/** Devuelve el QR como string SVG (útil para impresión vectorial). */
export async function qrSvg(payload: string): Promise<string> {
  return QRCode.toString(payload, { type: "svg", errorCorrectionLevel: "M", margin: 1 });
}
