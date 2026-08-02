"use client";

import { useMemo, useRef, useState } from "react";
import { firmarConsentimiento } from "./actions";
import FirmaCanvas, { type FirmaCanvasRef } from "./FirmaCanvas";
import type { EntradaConsentimiento } from "@/lib/consentimiento/validar";

interface AtraccionTexto {
  id: string;
  nombre: string;
  yaFirmado: boolean;
  titulo: string;
  cuerpo: string;
  version: number;
}

export default function ConsentimientoForm({
  payload, consecutivo, tipo, atracciones,
}: {
  payload: string; consecutivo: string; tipo: string; atracciones: AtraccionTexto[];
}) {
  const [firmadas, setFirmadas] = useState<Set<string>>(new Set(atracciones.filter((a) => a.yaFirmado).map((a) => a.id)));
  const primeraLibre = atracciones.find((a) => !firmadas.has(a.id));
  const [atraccionId, setAtraccionId] = useState(primeraLibre?.id ?? atracciones[0]?.id ?? "");
  const [nombre, setNombre] = useState("");
  const [documento, setDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [esMenor, setEsMenor] = useState(false);
  const [nombreAc, setNombreAc] = useState("");
  const [docAc, setDocAc] = useState("");
  const [parentesco, setParentesco] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string; id?: string } | null>(null);
  const firmaRef = useRef<FirmaCanvasRef>(null);

  const atr = useMemo(() => atracciones.find((a) => a.id === atraccionId), [atracciones, atraccionId]);
  const yaFirmada = atr ? firmadas.has(atr.id) : false;

  async function enviar() {
    setMsg(null);
    const firma = firmaRef.current;
    if (!firma || firma.estaVacio()) { setMsg({ ok: false, texto: "Falta la firma." }); return; }

    const entrada: EntradaConsentimiento = {
      payload, atraccion_id: atraccionId,
      nombre_firmante: nombre, documento_firmante: documento, telefono,
      es_menor: esMenor, nombre_acudiente: nombreAc, documento_acudiente: docAc, parentesco,
      acepta, firma_imagen: firma.toDataURL(),
    };
    setEnviando(true);
    const r = await firmarConsentimiento(entrada);
    setEnviando(false);
    if (r.ok) {
      setFirmadas((s) => new Set(s).add(atraccionId));
      setMsg({ ok: true, texto: r.yaExistia ? "Este consentimiento ya estaba firmado." : "¡Consentimiento firmado! Ya puedes ingresar a la atracción.", id: r.consentimiento_id });
      firma.limpiar();
    } else {
      setMsg({ ok: false, texto: r.error });
    }
  }

  return (
    <main className="mx-auto max-w-lg p-4">
      <div className="mb-4 rounded-xl border-4 border-ranch-marron bg-white p-4 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Ranch Texas" className="mx-auto mb-2 h-16 w-auto" />
        <h1 className="text-xl font-black text-ranch-marron">Consentimiento informado</h1>
        <p className="mt-1 text-sm text-ranch-marron/60">Manilla {consecutivo} · {tipo}</p>
      </div>

      <label className="block text-sm font-semibold text-ranch-marron">Atracción</label>
      <select value={atraccionId} onChange={(e) => setAtraccionId(e.target.value)} className="mb-3 mt-1 w-full rounded-lg border border-ranch-marron/30 px-3 py-2">
        {atracciones.map((a) => (
          <option key={a.id} value={a.id}>{a.nombre}{firmadas.has(a.id) ? " ✓ firmado" : ""}</option>
        ))}
      </select>

      {atr && (
        <div className="mb-4 max-h-48 overflow-y-auto rounded-lg bg-ranch-crema/50 p-3 text-sm text-ranch-marron/80">
          <p className="mb-1 font-semibold">{atr.titulo} (v{atr.version})</p>
          <p className="whitespace-pre-line">{atr.cuerpo}</p>
        </div>
      )}

      {yaFirmada ? (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Ya firmaste el consentimiento de esta atracción.</p>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombres y apellidos" className="rounded-lg border border-ranch-marron/30 px-3 py-2" />
            <input value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="Número de documento" className="rounded-lg border border-ranch-marron/30 px-3 py-2" />
          </div>
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono (opcional)" className="w-full rounded-lg border border-ranch-marron/30 px-3 py-2" />

          <label className="flex items-center gap-2 text-sm text-ranch-marron">
            <input type="checkbox" checked={esMenor} onChange={(e) => setEsMenor(e.target.checked)} />
            El visitante es menor de edad (firma el acudiente)
          </label>

          {esMenor && (
            <div className="space-y-2 rounded-lg bg-ranch-crema/40 p-3">
              <p className="text-sm font-semibold text-ranch-marron">Datos del acudiente</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input value={nombreAc} onChange={(e) => setNombreAc(e.target.value)} placeholder="Nombre del acudiente" className="rounded-lg border border-ranch-marron/30 px-3 py-2" />
                <input value={docAc} onChange={(e) => setDocAc(e.target.value)} placeholder="Documento del acudiente" className="rounded-lg border border-ranch-marron/30 px-3 py-2" />
              </div>
              <input value={parentesco} onChange={(e) => setParentesco(e.target.value)} placeholder="Parentesco (madre, padre…)" className="w-full rounded-lg border border-ranch-marron/30 px-3 py-2" />
            </div>
          )}

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-semibold text-ranch-marron">Firma {esMenor ? "del acudiente" : ""}</label>
              <button type="button" onClick={() => firmaRef.current?.limpiar()} className="text-xs text-ranch-marron/60 underline">Limpiar</button>
            </div>
            <FirmaCanvas ref={firmaRef} />
          </div>

          <label className="flex items-start gap-2 text-sm text-ranch-marron">
            <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="mt-1" />
            <span>Acepto el consentimiento y autorizo el tratamiento de mis datos personales conforme a la Ley 1581 de 2012.</span>
          </label>

          {msg && <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg.texto}</p>}

          <button onClick={enviar} disabled={enviando} className="w-full rounded-xl bg-ranch-marron px-4 py-4 text-lg font-bold text-ranch-crema hover:bg-ranch-marron-oscuro disabled:opacity-50">
            {enviando ? "Firmando…" : "Firmar consentimiento"}
          </button>
        </div>
      )}

      {msg?.ok && msg.id && (
        <a href={`/consentimiento/comprobante/${msg.id}`} className="mt-3 block rounded-lg bg-ranch-dorado px-4 py-3 text-center font-semibold text-white">
          Ver comprobante (PDF)
        </a>
      )}
    </main>
  );
}
