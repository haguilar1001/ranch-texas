// Cola de escaneos capturados sin conexión (localStorage). Se sincroniza al recuperar red.

export interface EscaneoEnCola {
  id_cliente: string;
  punto_control_id: string;
  payload: string;
  escaneado_en: string; // ISO
}

const KEY = "rt_cola_escaneos";

export function leerCola(): EscaneoEnCola[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function encolar(e: EscaneoEnCola): void {
  const q = leerCola();
  q.push(e);
  localStorage.setItem(KEY, JSON.stringify(q));
}

export function quitarDeCola(ids: string[]): void {
  const set = new Set(ids);
  localStorage.setItem(KEY, JSON.stringify(leerCola().filter((e) => !set.has(e.id_cliente))));
}

export function tamanoCola(): number {
  return leerCola().length;
}

/** Envía la cola al servidor y la vacía si tuvo éxito. */
export async function sincronizarCola(): Promise<{ procesados: number }> {
  const q = leerCola();
  if (q.length === 0) return { procesados: 0 };
  const res = await fetch("/api/accesos/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ escaneos: q }),
  });
  if (!res.ok) throw new Error("No se pudo sincronizar");
  const data = await res.json();
  quitarDeCola(q.map((e) => e.id_cliente));
  return { procesados: data.procesados ?? q.length };
}
