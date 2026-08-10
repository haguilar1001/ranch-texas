import { redirect } from "next/navigation";
import Link from "next/link";
import { obtenerSesion, tieneRol } from "@/lib/auth/sesion";
import { cuadreDiario } from "@/lib/caja/cuadreDiario";
import { formatearCOP } from "@/lib/dinero/cop";
import { fechaBogota } from "@/lib/tiempo";
import DiaNav from "./DiaNav";

export const dynamic = "force-dynamic";

const ES_FECHA = /^\d{4}-\d{2}-\d{2}$/;

export default async function CuadreDiaPage({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  const s = await obtenerSesion();
  if (!s) redirect("/login");
  if (!tieneRol(s.rol, "supervisor")) {
    return <main className="p-6"><p className="rounded bg-red-50 px-4 py-3 text-red-700">Solo supervisores y administradores pueden ver el cuadre consolidado.</p></main>;
  }

  const sp = await searchParams;
  const fecha = sp.fecha && ES_FECHA.test(sp.fecha) ? sp.fecha : fechaBogota();
  const c = await cuadreDiario(fecha);

  const dif = c.diferencia;
  const todoCerrado = c.turnos > 0 && c.turnosAbiertos === 0;

  const Fila = ({ k, v, fuerte }: { k: string; v: string; fuerte?: boolean }) => (
    <div className={`flex justify-between py-1 text-sm ${fuerte ? "font-bold text-ranch-marron" : "text-ranch-marron/80"}`}>
      <span>{k}</span><span>{v}</span>
    </div>
  );

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <style>{`@media print { .no-print { display:none !important } @page { margin: 12mm } }`}</style>

      <h1 className="mb-1 text-2xl font-black text-ranch-marron">Cuadre diario consolidado</h1>
      <p className="mb-3 text-sm text-ranch-marron/60">Todos los turnos y cajas abiertos el {fecha} (día operativo, hora Bogotá).</p>

      <DiaNav fecha={fecha} />

      {c.turnos === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-ranch-marron/30 bg-white p-8 text-center text-ranch-marron/60">
          No hay turnos abiertos ese día.
        </div>
      ) : (
        <>
          {c.turnosAbiertos > 0 && (
            <p className="no-print mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              ⚠️ Hay {c.turnosAbiertos} turno(s) sin cerrar. El efectivo contado y la diferencia solo suman los turnos cerrados.
            </p>
          )}

          {/* KPIs */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { t: "Total ventas", v: formatearCOP(c.totalVentas) },
              { t: "Asistentes", v: String(c.asistentes) },
              { t: "N.° ventas", v: String(c.numVentas) },
              { t: "Turnos", v: `${c.turnosCerrados}/${c.turnos} cerrados` },
            ].map((k) => (
              <div key={k.t} className="rounded-xl border-2 border-ranch-marron/15 bg-white p-3">
                <p className="text-xs text-ranch-marron/50">{k.t}</p>
                <p className="text-lg font-black text-ranch-marron">{k.v}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-xl border-2 border-ranch-marron/20 bg-white p-4">
              <h2 className="mb-1 border-b border-ranch-marron/15 pb-1 text-sm font-bold text-ranch-marron">Ventas por medio de pago</h2>
              {c.ventasPorMedio.length === 0 ? <p className="py-1 text-sm text-ranch-marron/50">—</p> :
                c.ventasPorMedio.map((m) => <Fila key={m.codigo} k={m.medio} v={formatearCOP(m.total)} />)}
              <Fila k="Total ventas" v={formatearCOP(c.totalVentas)} fuerte />
            </section>

            <section className="rounded-xl border-2 border-ranch-marron/20 bg-white p-4">
              <h2 className="mb-1 border-b border-ranch-marron/15 pb-1 text-sm font-bold text-ranch-marron">Ventas por tipo</h2>
              {c.ventasPorTipo.length === 0 ? <p className="py-1 text-sm text-ranch-marron/50">—</p> :
                c.ventasPorTipo.map((t) => <Fila key={t.tipo} k={`${t.tipo} (${t.cantidad})`} v={formatearCOP(t.total)} />)}
            </section>
          </div>

          <section className="mt-4 rounded-xl border-2 border-ranch-marron/20 bg-white p-4">
            <h2 className="mb-1 border-b border-ranch-marron/15 pb-1 text-sm font-bold text-ranch-marron">Efectivo consolidado</h2>
            <Fila k="Base inicial (todas las cajas)" v={formatearCOP(c.baseInicial)} />
            <Fila k="+ Ventas en efectivo" v={formatearCOP(c.ventasEfectivo)} />
            <Fila k="+ Otros ingresos" v={formatearCOP(c.otrosIngresos)} />
            <Fila k="− Egresos" v={formatearCOP(c.egresos)} />
            <Fila k="Efectivo esperado" v={formatearCOP(c.esperadoEfectivo)} fuerte />
            <Fila k="Efectivo contado (turnos cerrados)" v={formatearCOP(c.efectivoContado)} fuerte />
            {todoCerrado ? (
              <div className={`flex justify-between border-t border-ranch-marron/15 py-1 text-base font-black ${dif === 0 ? "text-ranch-verde" : "text-red-600"}`}>
                <span>{dif === 0 ? "Cuadra" : dif > 0 ? "Sobrante" : "Faltante"}</span>
                <span>{formatearCOP(Math.abs(dif))}</span>
              </div>
            ) : (
              <p className="mt-1 text-xs text-ranch-marron/50">La diferencia consolidada se calcula cuando todos los turnos del día están cerrados.</p>
            )}
            {(c.cortesias > 0 || c.anuladas > 0) && (
              <div className="mt-2 border-t border-ranch-marron/15 pt-2">
                {c.cortesias > 0 && <Fila k="Cortesías/descuentos (no cobrado)" v={formatearCOP(c.cortesias)} />}
                {c.anuladas > 0 && <Fila k="Ventas anuladas" v={String(c.anuladas)} />}
              </div>
            )}
          </section>

          {/* Detalle por turno */}
          <section className="mt-4 rounded-xl border-2 border-ranch-marron/20 bg-white p-4">
            <h2 className="mb-2 text-sm font-bold text-ranch-marron">Detalle por turno ({c.turnos})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ranch-marron/60">
                    <th className="py-1">Caja</th><th>Cajero</th><th>Estado</th>
                    <th className="text-right">Ventas</th><th className="text-right">Esperado</th>
                    <th className="text-right">Contado</th><th className="text-right">Dif.</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {c.detalle.map((d) => (
                    <tr key={d.turnoId} className="border-t border-ranch-marron/10">
                      <td className="py-2">{d.caja}</td>
                      <td className="text-ranch-marron/70">{d.usuario}</td>
                      <td>
                        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${d.estado === "cerrado" ? "bg-ranch-verde/15 text-ranch-verde" : "bg-amber-100 text-amber-800"}`}>
                          {d.estado}
                        </span>
                      </td>
                      <td className="text-right">{formatearCOP(d.totalVentas)}</td>
                      <td className="text-right text-ranch-marron/70">{formatearCOP(d.esperado)}</td>
                      <td className="text-right text-ranch-marron/70">{d.contado === null ? "—" : formatearCOP(d.contado)}</td>
                      <td className={`text-right font-semibold ${d.diferencia === null ? "text-ranch-marron/40" : d.diferencia === 0 ? "text-ranch-verde" : "text-red-600"}`}>
                        {d.diferencia === null ? "—" : formatearCOP(d.diferencia)}
                      </td>
                      <td className="text-right">
                        <Link href={`/caja/cuadre/${d.turnoId}`} className="no-print text-xs text-ranch-dorado hover:underline">ver</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
