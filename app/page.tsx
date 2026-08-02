import Link from "next/link";
import { prisma } from "@/lib/db";
import { obtenerSesion, tieneRol } from "@/lib/auth/sesion";
import { indicadoresVentas } from "@/lib/reportes/ventas";
import { comparativoAnual } from "@/lib/reportes/comparativo";
import { variacionPct, formatearVariacion } from "@/lib/reportes/util";
import { inicioDelDiaOperativo, fechaBogota } from "@/lib/tiempo";
import { formatearCOP } from "@/lib/dinero/cop";
import NavBar from "@/components/NavBar";

export const dynamic = "force-dynamic";

function Kpi({ label, valor, sub }: { label: string; valor: string; sub?: string }) {
  return (
    <div className="rounded-2xl border-2 border-ranch-marron/15 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-ranch-marron/50">{label}</p>
      <p className="mt-1 text-2xl font-black text-ranch-marron">{valor}</p>
      {sub && <p className="text-xs text-ranch-marron/50">{sub}</p>}
    </div>
  );
}

function MenuItem({ icon, label, desc, href }: { icon: string; label: string; desc: string; href: string }) {
  return (
    <Link href={href} className="group flex items-start gap-3 rounded-2xl border-2 border-ranch-marron/15 bg-white p-4 shadow-sm transition hover:border-ranch-dorado hover:shadow-md">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ranch-marron/10 text-2xl group-hover:bg-ranch-dorado/20">{icon}</span>
      <span>
        <span className="block font-bold text-ranch-marron">{label}</span>
        <span className="block text-sm text-ranch-marron/60">{desc}</span>
      </span>
    </Link>
  );
}

export default async function Home() {
  const s = await obtenerSesion();

  if (!s) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border-4 border-ranch-marron bg-white p-10 text-center shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Ranch Texas" className="mx-auto mb-4 h-28 w-auto" />
          <p className="mb-6 text-ranch-marron/60">Sistema de operación</p>
          <Link href="/login" className="block rounded-xl bg-ranch-marron px-6 py-3 font-semibold text-ranch-crema hover:bg-ranch-marron-oscuro">
            Ingresar
          </Link>
        </div>
      </main>
    );
  }

  // Indicadores del día operativo
  const inicioHoy = inicioDelDiaOperativo();
  const finHoy = new Date(inicioHoy.getTime() + 86_400_000);
  const anio = parseInt(fechaBogota().slice(0, 4), 10);

  const [ind, ep, comp] = await Promise.all([
    indicadoresVentas(inicioHoy, finHoy),
    prisma.puntoControl.findFirst({ where: { nombre: "Entrada Principal" } }),
    comparativoAnual(anio),
  ]);

  let aforo = 0;
  if (ep) {
    const [e, sa] = await Promise.all([
      prisma.acceso.count({ where: { punto_control_id: ep.id, resultado: "permitido", sentido: "entrada", escaneado_en: { gte: inicioHoy } } }),
      prisma.acceso.count({ where: { punto_control_id: ep.id, resultado: "permitido", sentido: "salida", escaneado_en: { gte: inicioHoy } } }),
    ]);
    aforo = Math.max(0, e - sa);
  }
  const varAnual = variacionPct(comp.totalActual, comp.totalAnterior);

  const operacion = ([
    ["🎟️", "Taquilla", "Vender manillas", "/taquilla", tieneRol(s.rol, "cajero")],
    ["💵", "Caja y cuadre", "Turno, movimientos, cierre", "/caja/turno", tieneRol(s.rol, "cajero")],
    ["🚪", "Escaneo", "Control de acceso", "/escaneo", tieneRol(s.rol, "control_acceso")],
  ] as [string, string, string, string, boolean][]).filter((x) => x[4]);

  const analisis = ([
    ["📊", "Dashboard de ventas", "Indicadores y tendencias", "/admin/dashboard", tieneRol(s.rol, "consulta")],
    ["📈", "Comparativo año vs año", "Venta histórica", "/admin/reportes/comparativo", tieneRol(s.rol, "consulta")],
    ["🧾", "Gastos y P&G", "Rubros, presupuesto, resultado", "/admin/gastos", tieneRol(s.rol, "supervisor")],
    ["⚙️", "Administración", "Reportes y maestros", "/admin", tieneRol(s.rol, "consulta")],
  ] as [string, string, string, string, boolean][]).filter((x) => x[4]);

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-6xl p-4 sm:p-6">
        {/* Hero */}
        <div className="mb-6 rounded-3xl border-4 border-ranch-marron bg-gradient-to-br from-ranch-crema to-white p-6">
          <p className="text-xs uppercase tracking-widest text-ranch-dorado">Parque Ranch Texas</p>
          <h1 className="text-3xl font-black text-ranch-marron">Hola, {s.nombre.split(" ")[0]} 👋</h1>
          <p className="text-ranch-marron/60">Resumen del día — {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>

        {/* KPIs de hoy */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Ingreso hoy" valor={formatearCOP(ind.ingreso)} />
          <Kpi label="Entradas hoy" valor={String(ind.asistentes)} sub={`${ind.numVentas} ventas`} />
          <Kpi label="Ticket promedio" valor={formatearCOP(ind.ticketPromedio)} />
          <Kpi label="Aforo actual" valor={String(aforo)} sub={ep?.aforo_maximo ? `de ${ep.aforo_maximo}` : undefined} />
        </div>

        {/* Comparativo anual mini */}
        <Link href="/admin/reportes/comparativo" className="mb-6 flex items-center justify-between rounded-2xl border-2 border-ranch-dorado bg-white p-4 shadow-sm hover:shadow-md">
          <div>
            <p className="text-xs uppercase tracking-wide text-ranch-marron/50">Venta {anio} vs {anio - 1}</p>
            <p className="text-2xl font-black text-ranch-marron">{formatearCOP(comp.totalActual)}</p>
          </div>
          <div className={`text-right ${varAnual != null && varAnual >= 0 ? "text-ranch-verde" : "text-red-600"}`}>
            <p className="text-2xl font-black">{formatearVariacion(varAnual)}</p>
            <p className="text-xs text-ranch-marron/50">vs {formatearCOP(comp.totalAnterior)}</p>
          </div>
        </Link>

        {/* Menú */}
        {operacion.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ranch-marron/50">Operación</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {operacion.map((x) => <MenuItem key={x[3]} icon={x[0]} label={x[1]} desc={x[2]} href={x[3]} />)}
            </div>
          </section>
        )}
        {analisis.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ranch-marron/50">Análisis y administración</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {analisis.map((x) => <MenuItem key={x[3]} icon={x[0]} label={x[1]} desc={x[2]} href={x[3]} />)}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
