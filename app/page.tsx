export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <div className="rounded-2xl border-4 border-ranch-marron bg-ranch-crema px-10 py-8 shadow-lg text-center">
        <p className="text-sm uppercase tracking-widest text-ranch-dorado">Parque</p>
        <h1 className="text-4xl font-black text-ranch-marron">RANCH TEXAS</h1>
        <p className="mt-2 text-ranch-marron/70">Sistema de operación — Fase 0</p>
      </div>
      <nav className="grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
        {[
          ["Taquilla", "/taquilla"],
          ["Caja", "/caja/turno"],
          ["Escaneo", "/escaneo"],
          ["Admin", "/admin"],
          ["Reportes", "/admin/reportes/ventas"],
        ].map(([label, href]) => (
          <a
            key={href}
            href={href}
            className="rounded-lg bg-ranch-marron px-5 py-3 font-semibold text-ranch-crema transition hover:bg-ranch-marron-oscuro"
          >
            {label}
          </a>
        ))}
      </nav>
      <p className="text-xs text-ranch-marron/50">
        Las pantallas se habilitan por fases (ver progreso.md).
      </p>
    </main>
  );
}
