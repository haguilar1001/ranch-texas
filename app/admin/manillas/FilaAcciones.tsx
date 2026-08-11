"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { anularManilla } from "./actions";

/** Acciones por fila del buscador: abrir la venta y anular la manilla (supervisor+, con motivo). */
export default function FilaAcciones({
  manillaId, ventaId, estado, puedeAnular,
}: {
  manillaId: string; ventaId: string; estado: string; puedeAnular: boolean;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function anular() {
    setBusy(true); setError(null);
    const r = await anularManilla(manillaId, motivo);
    setBusy(false);
    if (r.ok) { setAbierto(false); setMotivo(""); router.refresh(); }
    else setError(r.error ?? "Error");
  }

  if (abierto) {
    return (
      <div className="flex flex-col items-end gap-1">
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo de la anulación"
          autoFocus
          className="w-44 rounded border border-ranch-marron/30 px-2 py-1 text-xs"
        />
        <span className="flex gap-1">
          <button onClick={anular} disabled={busy} className="rounded bg-red-600 px-2 py-0.5 text-xs font-semibold text-white disabled:opacity-50">Confirmar</button>
          <button onClick={() => { setAbierto(false); setError(null); }} className="text-xs text-ranch-marron/60">✕</button>
        </span>
        {error && <span className="text-[10px] text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <span className="flex items-center justify-end gap-2">
      <Link href={`/imprimir/venta/${ventaId}`} className="text-xs font-semibold text-ranch-dorado hover:underline">abrir venta →</Link>
      {puedeAnular && estado !== "anulada" && (
        <button onClick={() => setAbierto(true)} className="rounded border border-red-200 px-2 py-0.5 text-xs font-semibold text-red-600 hover:bg-red-50">Anular</button>
      )}
    </span>
  );
}
