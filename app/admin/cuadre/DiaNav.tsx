"use client";

import { useRouter } from "next/navigation";

/** Navegador de día para el cuadre consolidado: ← día anterior, selector de fecha, día siguiente →. */
export default function DiaNav({ fecha }: { fecha: string }) {
  const router = useRouter();

  const ir = (f: string) => router.push(`/admin/cuadre?fecha=${f}`);

  const desplazar = (dias: number) => {
    const base = new Date(`${fecha}T12:00:00Z`);
    base.setUTCDate(base.getUTCDate() + dias);
    ir(base.toISOString().slice(0, 10));
  };

  return (
    <div className="no-print mb-4 flex flex-wrap items-center gap-2">
      <button onClick={() => desplazar(-1)} className="rounded-lg border border-ranch-marron/30 px-3 py-1.5 text-sm font-semibold text-ranch-marron hover:bg-white">← Día anterior</button>
      <input
        type="date"
        value={fecha}
        onChange={(e) => e.target.value && ir(e.target.value)}
        className="rounded-lg border border-ranch-marron/30 px-3 py-1.5 text-sm text-ranch-marron"
      />
      <button onClick={() => desplazar(1)} className="rounded-lg border border-ranch-marron/30 px-3 py-1.5 text-sm font-semibold text-ranch-marron hover:bg-white">Día siguiente →</button>
      <button onClick={() => window.print()} className="ml-auto rounded-lg bg-ranch-marron px-4 py-1.5 text-sm font-semibold text-ranch-crema hover:bg-ranch-marron-oscuro">🖨️ Imprimir</button>
    </div>
  );
}
