"use client";

export default function BotonImprimir() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print rounded-lg bg-ranch-marron px-5 py-2 font-semibold text-ranch-crema hover:bg-ranch-marron-oscuro"
    >
      🖨️ Imprimir / Guardar PDF
    </button>
  );
}
