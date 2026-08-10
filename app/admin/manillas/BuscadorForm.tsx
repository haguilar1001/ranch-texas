"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ESTADOS = [
  { v: "todas", l: "Todos los estados" },
  { v: "activa", l: "Activa" },
  { v: "usada", l: "Usada" },
  { v: "anulada", l: "Anulada" },
];

/** Formulario de búsqueda de manillas: navega con ?q= y ?estado= (server component filtra). */
export default function BuscadorForm({ q, estado }: { q: string; estado: string }) {
  const router = useRouter();
  const [texto, setTexto] = useState(q);
  const [est, setEst] = useState(estado || "todas");

  function buscar() {
    const p = new URLSearchParams();
    if (texto.trim()) p.set("q", texto.trim());
    if (est && est !== "todas") p.set("estado", est);
    router.push(`/admin/manillas${p.toString() ? `?${p}` : ""}`);
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && buscar()}
        placeholder="Consecutivo o n.° de venta (escanea o escribe)"
        autoFocus
        className="min-w-[240px] flex-1 rounded-lg border border-ranch-marron/30 px-3 py-2 text-sm"
      />
      <select value={est} onChange={(e) => setEst(e.target.value)} className="rounded-lg border border-ranch-marron/30 px-3 py-2 text-sm">
        {ESTADOS.map((e) => <option key={e.v} value={e.v}>{e.l}</option>)}
      </select>
      <button onClick={buscar} className="rounded-lg bg-ranch-marron px-5 py-2 text-sm font-semibold text-ranch-crema hover:bg-ranch-marron-oscuro">Buscar</button>
    </div>
  );
}
