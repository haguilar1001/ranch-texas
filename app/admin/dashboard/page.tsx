import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerSesion, tieneRol } from "@/lib/auth/sesion";
import { indicadoresVentas } from "@/lib/reportes/ventas";
import { comparativoAnual } from "@/lib/reportes/comparativo";
import { variacionPct, formatearVariacion } from "@/lib/reportes/util";
import { fechaBogota } from "@/lib/tiempo";
import { formatearCOP } from "@/lib/dinero/cop";

export const dynamic = "force-dynamic";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MESES_ABR = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function Kpi({ label, valor, sub }: { label: string; valor: string; sub?: string }) {
  return (
    <div className="rounded-2xl border-2 border-ranch-marron/15 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-ranch-marron/50">{label}</p>
      <p className="mt-1 text-2xl font-black text-ranch-marron">{valor}</p>
      {sub && <p className="text-xs text-ranch-marron/50">{sub}</p>}
    </div>
  );
}

function Barras({ datos }: { datos: { etiqueta: string; valor: number }[] }) {
  const max = Math.max(1, ...datos.map((d) => d.valor));
  return (
    <div className="space-y-1.5">
      {datos.map((d) => (
        <div key={d.etiqueta} className="flex items-center gap-2 text-sm">
          <span className="w-20 shrink-0 text-right text-ranch-marron/60">{d.etiqueta}</span>
          <div className="h-4 flex-1 rounded bg-ranch-marron/5">
            <div className="h-4 rounded bg-ranch-dorado" style={{ width: `${(d.valor / max) * 100}%` }} />
          </div>
          <span className="w-28 shrink-0 text-right text-xs text-ranch-marron/70">{formatearCOP(d.valor)}</span>
        </div>
      ))}
      {datos.length === 0 && <p className="text-sm text-ranch-marron/40">Sin datos en el periodo.</p>}
    </div>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ anio?: string; mes?: string }> }) {
  const s = await obtenerSesion();
  if (!s) redirect("/login");
  if (!tieneRol(s.rol, "consulta")) return <main className="p-6">Sin acceso.</main>;

  const hoy = fechaBogota();
  const sp = await searchParams;
  const anio = parseInt(sp.anio ?? hoy.slice(0, 4), 10);
  const mes = parseInt(sp.mes ?? hoy.slice(5, 7), 10);
  const inicio = new Date(`${anio}-${String(mes).padStart(2, "0")}-01T00:00:00-05:00`);
  const nAnio = mes === 12 ? anio + 1 : anio, nMes = mes === 12 ? 1 : mes + 1;
  const fin = new Date(`${nAnio}-${String(nMes).padStart(2, "0")}-01T00:00:00-05:00`);

  const [ind, comp] = await Promise.all([indicadoresVentas(inicio, fin), comparativoAnual(anio)]);
  const varAnual = variacionPct(comp.totalActual, comp.totalAnterior);

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-black text-ranch-marron">Dashboard de ventas</h1>
        <form className="flex gap-2 text-sm">
          <select name="mes" defaultValue={mes} className="rounded-lg border px-2 py-1">{MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select>
          <select name="anio" defaultValue={anio} className="rounded-lg border px-2 py-1">{[2024, 2025, 2026].map((a) => <option key={a} value={a}>{a}</option>)}</select>
          <button className="rounded-lg bg-ranch-marron px-3 py-1 font-semibold text-ranch-crema">Ver</button>
        </form>
      </div>

      <p className="mb-2 text-sm text-ranch-marron/60">Mes: {MESES[mes - 1]} {anio}</p>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Ingreso del mes" valor={formatearCOP(ind.ingreso)} />
        <Kpi label="Entradas" valor={String(ind.asistentes)} sub={`${ind.numVentas} ventas`} />
        <Kpi label="Ticket promedio" valor={formatearCOP(ind.ticketPromedio)} />
        <Kpi label="% cortesías" valor={`${ind.pctCortesias.toFixed(1)}%`} sub={formatearCOP(ind.valorNoCobrado)} />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border-2 border-ranch-marron/15 bg-white p-4">
          <h2 className="mb-3 font-bold text-ranch-marron">Ventas por día de la semana</h2>
          <Barras datos={ind.porDiaSemana.map((d) => ({ etiqueta: d.dia, valor: d.total }))} />
        </section>
        <section className="rounded-2xl border-2 border-ranch-marron/15 bg-white p-4">
          <h2 className="mb-3 font-bold text-ranch-marron">Ventas por hora</h2>
          <Barras datos={ind.porHora.map((h) => ({ etiqueta: `${String(h.hora).padStart(2, "0")}:00`, valor: h.total }))} />
        </section>
        <section className="rounded-2xl border-2 border-ranch-marron/15 bg-white p-4">
          <h2 className="mb-3 font-bold text-ranch-marron">Por tipo de visitante</h2>
          <Barras datos={ind.porTipo.map((t) => ({ etiqueta: t.tipo, valor: t.total }))} />
        </section>
        <section className="rounded-2xl border-2 border-ranch-marron/15 bg-white p-4">
          <h2 className="mb-3 font-bold text-ranch-marron">Por medio de pago</h2>
          <Barras datos={ind.porMedio.map((m) => ({ etiqueta: m.medio, valor: m.total }))} />
        </section>
      </div>

      {/* Comparativo anual */}
      <section className="rounded-2xl border-4 border-ranch-marron bg-white p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-bold text-ranch-marron">Comparativo {anio} vs {anio - 1}</h2>
          <div className={`text-right ${varAnual != null && varAnual >= 0 ? "text-ranch-verde" : "text-red-600"}`}>
            <span className="text-xl font-black">{formatearVariacion(varAnual)}</span>
            <span className="ml-2 text-sm text-ranch-marron/60">{formatearCOP(comp.totalActual)} vs {formatearCOP(comp.totalAnterior)}</span>
          </div>
        </div>
        <div className="space-y-1">
          {(() => {
            const max = Math.max(1, ...comp.meses.map((m) => Math.max(m.actual, m.anterior)));
            return comp.meses.map((m) => (
              <div key={m.mes} className="flex items-center gap-2 text-xs">
                <span className="w-8 shrink-0 text-ranch-marron/60">{MESES_ABR[m.mes - 1]}</span>
                <div className="flex-1 space-y-0.5">
                  <div className="h-2.5 rounded bg-ranch-marron/25" style={{ width: `${(m.anterior / max) * 100}%` }} />
                  <div className="h-2.5 rounded bg-ranch-dorado" style={{ width: `${(m.actual / max) * 100}%` }} />
                </div>
              </div>
            ));
          })()}
        </div>
        <p className="mt-2 text-xs text-ranch-marron/50">Barra clara = {anio - 1} · barra dorada = {anio} · <Link href="/admin/reportes/comparativo" className="underline">ver detalle</Link></p>
      </section>
    </main>
  );
}
