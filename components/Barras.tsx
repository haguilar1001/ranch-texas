import { formatearCOP } from "@/lib/dinero/cop";

export interface Barra {
  etiqueta: string;
  valor: number;
}

/** Barras horizontales simples (server component). Un solo color de acento (dorado). */
export default function Barras({ datos, vacio = "Sin datos en el periodo." }: { datos: Barra[]; vacio?: string }) {
  const max = Math.max(1, ...datos.map((d) => d.valor));
  if (datos.length === 0) return <p className="text-sm text-ranch-marron/40">{vacio}</p>;
  return (
    <div className="space-y-1.5">
      {datos.map((d) => (
        <div key={d.etiqueta} className="flex items-center gap-2 text-sm">
          <span className="w-20 shrink-0 truncate text-right text-ranch-marron/60">{d.etiqueta}</span>
          <div className="h-4 flex-1 rounded bg-ranch-marron/5">
            <div className="h-4 rounded bg-ranch-dorado" style={{ width: `${(d.valor / max) * 100}%` }} />
          </div>
          <span className="w-28 shrink-0 text-right text-xs text-ranch-marron/70">{formatearCOP(d.valor)}</span>
        </div>
      ))}
    </div>
  );
}
