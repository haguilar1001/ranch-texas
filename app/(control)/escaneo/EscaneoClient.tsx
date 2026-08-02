"use client";

import { useEffect, useRef, useState } from "react";
import { escanear } from "./actions";
import type { ResultadoEscaneo } from "@/lib/acceso/procesar";

interface Punto {
  id: string;
  nombre: string;
  tipo_regla: "un_ingreso" | "reingreso" | "entrada_salida";
  requiere_consentimiento: boolean;
  aforo_maximo: number | null;
}

const REGLA_TXT: Record<Punto["tipo_regla"], string> = {
  un_ingreso: "Un solo ingreso",
  reingreso: "Reingreso libre",
  entrada_salida: "Entrada / salida",
};

type Resultado = ResultadoEscaneo | { error: string };

export default function EscaneoClient({ usuario, puntos }: { usuario: string; puntos: Punto[] }) {
  const [punto, setPunto] = useState<Punto | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [historial, setHistorial] = useState<{ txt: string; ok: boolean }[]>([]);
  const [procesando, setProcesando] = useState(false);
  const [camara, setCamara] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ultimo = useRef<{ payload: string; t: number }>({ payload: "", t: 0 });

  const focus = () => inputRef.current?.focus();

  async function procesar(payload: string) {
    if (!punto || !payload.trim() || procesando) return;
    // Anti-rebote: ignorar el mismo código en menos de 2.5 s (cámara).
    const ahora = Date.now();
    if (payload === ultimo.current.payload && ahora - ultimo.current.t < 2500) return;
    ultimo.current = { payload, t: ahora };

    setProcesando(true);
    const r = await escanear(punto.id, payload.trim());
    setResultado(r);
    if ("permitido" in r) {
      const etq = r.manilla ? `${r.manilla.consecutivo} · ${r.manilla.tipo}` : "—";
      setHistorial((h) => [{ txt: `${r.permitido ? "✓" : "✗"} ${etq}${r.motivo ? " · " + r.motivo : ""}`, ok: r.permitido }, ...h].slice(0, 8));
    }
    setProcesando(false);
    focus();
  }

  // Cámara con BarcodeDetector (mejora progresiva; si no está, se usa el lector manual/USB).
  useEffect(() => {
    if (!camara || !punto) return;
    const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    if (!BD) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    const detector = new BD({ formats: ["qr_code"] });
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const loop = async () => {
          if (videoRef.current && videoRef.current.readyState === 4) {
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes[0]?.rawValue) await procesar(codes[0].rawValue);
            } catch { /* frame sin código */ }
          }
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      } catch { setCamara(false); }
    })();
    return () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camara, punto]);

  useEffect(() => { if (punto) focus(); }, [punto]);

  // --- Selección de punto ---
  if (!punto) {
    return (
      <main className="mx-auto max-w-md p-6">
        <h1 className="mb-1 text-2xl font-black text-ranch-marron">Control de acceso</h1>
        <p className="mb-6 text-sm text-ranch-marron/60">{usuario} · elige el punto</p>
        <div className="space-y-3">
          {puntos.map((p) => (
            <button
              key={p.id}
              onClick={() => { setPunto(p); setResultado(null); setHistorial([]); }}
              className="w-full rounded-xl border-2 border-ranch-marron/20 bg-white p-4 text-left hover:border-ranch-dorado"
            >
              <p className="text-lg font-bold text-ranch-marron">{p.nombre}</p>
              <p className="text-sm text-ranch-marron/60">
                {REGLA_TXT[p.tipo_regla]}
                {p.aforo_maximo ? ` · aforo ${p.aforo_maximo}` : ""}
                {p.requiere_consentimiento ? " · requiere consentimiento" : ""}
              </p>
            </button>
          ))}
        </div>
      </main>
    );
  }

  // --- Pantalla de escaneo ---
  const ok = resultado && "permitido" in resultado && resultado.permitido;
  const denegado = resultado && "permitido" in resultado && !resultado.permitido;
  const error = resultado && "error" in resultado;
  const aforo = resultado && "permitido" in resultado ? resultado : null;

  return (
    <main className="mx-auto max-w-md p-4">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-ranch-marron">{punto.nombre}</h1>
          <p className="text-xs text-ranch-marron/60">{REGLA_TXT[punto.tipo_regla]} · {usuario}</p>
        </div>
        <button onClick={() => { setPunto(null); setCamara(false); }} className="rounded-lg border border-ranch-marron/30 px-3 py-1 text-sm text-ranch-marron">
          Cambiar
        </button>
      </header>

      {punto.aforo_maximo != null && (
        <div className="mb-3 rounded-lg bg-white p-3 text-center">
          <span className="text-sm text-ranch-marron/60">Aforo </span>
          <span className="text-2xl font-black text-ranch-marron">{aforo ? aforo.aforoActual : "—"}</span>
          <span className="text-sm text-ranch-marron/60"> / {punto.aforo_maximo}</span>
        </div>
      )}

      {/* Semáforo */}
      <div
        className={`mb-3 flex min-h-[160px] flex-col items-center justify-center rounded-2xl p-6 text-center ${
          ok ? "bg-green-500 text-white" : denegado ? "bg-red-600 text-white" : "bg-white text-ranch-marron/40"
        }`}
      >
        {!resultado && <p className="text-lg">Escanea una manilla…</p>}
        {ok && aforo && (
          <>
            <p className="text-4xl font-black">PERMITIDO</p>
            <p className="mt-1 text-lg">{aforo.sentido === "salida" ? "SALIDA" : "ENTRADA"}</p>
            {aforo.manilla && <p className="mt-1 text-sm opacity-90">{aforo.manilla.consecutivo} · {aforo.manilla.tipo}</p>}
          </>
        )}
        {denegado && aforo && (
          <>
            <p className="text-4xl font-black">DENEGADO</p>
            <p className="mt-1 text-lg">{aforo.motivo}</p>
            {aforo.manilla && <p className="mt-1 text-sm opacity-90">{aforo.manilla.consecutivo} · {aforo.manilla.tipo}</p>}
          </>
        )}
        {error && <p className="text-lg text-red-600">{(resultado as { error: string }).error}</p>}
      </div>

      {/* Lector manual / USB */}
      <input
        ref={inputRef}
        autoFocus
        placeholder="Escanea o pega el código y Enter"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const v = (e.target as HTMLInputElement).value;
            (e.target as HTMLInputElement).value = "";
            void procesar(v);
          }
        }}
        className="w-full rounded-lg border border-ranch-marron/30 px-3 py-3 text-center"
      />

      <div className="mt-3 flex items-center justify-between">
        <button onClick={() => setCamara((c) => !c)} className="rounded-lg bg-ranch-marron px-4 py-2 text-sm font-semibold text-ranch-crema">
          {camara ? "Apagar cámara" : "📷 Usar cámara"}
        </button>
        {procesando && <span className="text-sm text-ranch-marron/50">Validando…</span>}
      </div>

      {camara && (
        <video ref={videoRef} muted playsInline className="mt-3 w-full rounded-lg bg-black" />
      )}

      {/* Historial */}
      {historial.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm">
          {historial.map((h, i) => (
            <li key={i} className={h.ok ? "text-green-700" : "text-red-700"}>{h.txt}</li>
          ))}
        </ul>
      )}
    </main>
  );
}
