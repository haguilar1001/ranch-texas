import { obtenerSesion, tieneRol } from "@/lib/auth/sesion";
import { procesarEscaneo } from "@/lib/acceso/procesar";

// Sincroniza la cola de escaneos capturados sin conexión. Idempotente por id_cliente.
export async function POST(req: Request) {
  const s = await obtenerSesion();
  if (!s || !tieneRol(s.rol, "control_acceso")) return new Response("No autorizado", { status: 401 });

  let body: { escaneos?: Array<{ id_cliente: string; punto_control_id: string; payload: string; escaneado_en?: string }> };
  try {
    body = await req.json();
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }
  const escaneos = body.escaneos ?? [];

  const resultados = [];
  for (const e of escaneos) {
    const r = await procesarEscaneo(s.id, e.punto_control_id, e.payload, "offline", {
      idCliente: e.id_cliente,
      escaneadoEn: e.escaneado_en ? new Date(e.escaneado_en) : undefined,
      sincronizado: true,
    });
    const ok = "permitido" in r ? r.permitido : false;
    const motivo = "permitido" in r ? r.motivo : ("error" in r ? r.error : undefined);
    resultados.push({ id_cliente: e.id_cliente, permitido: ok, motivo });
  }

  return Response.json({ procesados: resultados.length, resultados });
}
