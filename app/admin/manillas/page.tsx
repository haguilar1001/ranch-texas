import { redirect } from "next/navigation";
import Link from "next/link";
import { obtenerSesion, tieneRol } from "@/lib/auth/sesion";
import { buscarManillas } from "@/lib/manillas/buscar";
import BuscadorForm from "./BuscadorForm";

export const dynamic = "force-dynamic";

const BADGE: Record<string, string> = {
  activa: "bg-ranch-verde/15 text-ranch-verde",
  usada: "bg-blue-100 text-blue-700",
  anulada: "bg-red-100 text-red-700",
};

export default async function ManillasPage({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string }> }) {
  const s = await obtenerSesion();
  if (!s) redirect("/login");
  if (!tieneRol(s.rol, "supervisor")) {
    return <main className="p-6"><p className="rounded bg-red-50 px-4 py-3 text-red-700">Solo supervisores y administradores pueden buscar manillas.</p></main>;
  }

  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const estado = sp.estado ?? "todas";
  const filas = await buscarManillas({ q, estado, limit: 100 });

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-6">
      <h1 className="mb-1 text-2xl font-black text-ranch-marron">Buscador de manillas</h1>
      <p className="mb-4 text-sm text-ranch-marron/60">
        Busca por consecutivo o n.° de venta. Para reimprimir o anular, abre la venta (acciones con motivo, auditadas).
      </p>

      <BuscadorForm q={q} estado={estado} />

      <section className="rounded-2xl border-2 border-ranch-marron/20 bg-white p-4">
        <h2 className="mb-3 text-sm font-bold text-ranch-marron">
          {filas.length} resultado(s){filas.length === 100 ? " (mostrando los 100 más recientes)" : ""}
        </h2>
        {filas.length === 0 ? (
          <p className="py-6 text-center text-sm text-ranch-marron/50">Sin manillas para esa búsqueda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ranch-marron/60">
                  <th className="py-1">Consecutivo</th><th>Tipo</th><th>Estado</th><th>Venta</th>
                  <th>Caja · Cajero</th><th>Emitida</th><th>Vence</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filas.map((m) => (
                  <tr key={m.id} className="border-t border-ranch-marron/10">
                    <td className="py-2 font-mono font-semibold text-ranch-marron">
                      {m.consecutivo}
                      {m.reimpresa > 0 && <span className="ml-1 text-[10px] font-normal text-ranch-dorado">×{m.reimpresa + 1}</span>}
                    </td>
                    <td className="text-ranch-marron/70">{m.tipo}</td>
                    <td><span className={`rounded px-2 py-0.5 text-xs font-semibold ${BADGE[m.estado] ?? "bg-ranch-crema text-ranch-marron/60"}`}>{m.estado}</span></td>
                    <td className="text-ranch-marron/70">#{m.numeroVenta}</td>
                    <td className="text-xs text-ranch-marron/60">{m.caja} · {m.cajero}</td>
                    <td className="text-xs text-ranch-marron/50">{m.emitida}</td>
                    <td className="text-xs text-ranch-marron/50">{m.vence}</td>
                    <td className="text-right">
                      <Link href={`/imprimir/venta/${m.ventaId}`} className="text-xs font-semibold text-ranch-dorado hover:underline">abrir venta →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
