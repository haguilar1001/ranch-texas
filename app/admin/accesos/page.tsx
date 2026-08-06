import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { obtenerSesion, tieneRol } from "@/lib/auth/sesion";
import { inicioDelDiaOperativo } from "@/lib/tiempo";

export const dynamic = "force-dynamic";

export default async function AccesosPage() {
  const s = await obtenerSesion();
  if (!s) redirect("/login");
  if (!tieneRol(s.rol, "consulta")) return <main className="p-6">Sin acceso.</main>;

  const inicioHoy = inicioDelDiaOperativo();

  const [atracciones, entrada, grupos] = await Promise.all([
    prisma.atraccion.findMany({
      where: { activa: true },
      include: { puntos_control: { select: { id: true } } },
      orderBy: { nombre: "asc" },
    }),
    prisma.puntoControl.findFirst({ where: { nombre: "Entrada Principal" }, select: { id: true, aforo_maximo: true } }),
    // Entradas permitidas de hoy, agrupadas por punto de control (lector de acceso)
    prisma.acceso.groupBy({
      by: ["punto_control_id"],
      where: { resultado: "permitido", sentido: "entrada", escaneado_en: { gte: inicioHoy } },
      _count: { _all: true },
    }),
  ]);

  const conteo = new Map(grupos.map((g) => [g.punto_control_id, g._count._all]));

  // Aforo del parque hoy = entradas − salidas en la Entrada Principal
  let aforoParque = 0;
  let entradasParque = 0;
  if (entrada) {
    const [e, sa] = await Promise.all([
      prisma.acceso.count({ where: { punto_control_id: entrada.id, resultado: "permitido", sentido: "entrada", escaneado_en: { gte: inicioHoy } } }),
      prisma.acceso.count({ where: { punto_control_id: entrada.id, resultado: "permitido", sentido: "salida", escaneado_en: { gte: inicioHoy } } }),
    ]);
    entradasParque = e;
    aforoParque = Math.max(0, e - sa);
  }

  const conConsentimiento = atracciones.filter((a) => a.requiere_consentimiento).length;

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-ranch-marron">Accesos y atracciones</h1>
          <p className="text-sm text-ranch-marron/60">Condiciones, consentimiento y conteo del día por el lector de acceso</p>
        </div>
        <span className="rounded-full bg-ranch-dorado/20 px-3 py-1 text-xs font-semibold text-ranch-marron">
          Conteo en vivo del día operativo
        </span>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Entradas parque hoy" valor={String(entradasParque)} />
        <Kpi label="Aforo actual" valor={String(aforoParque)} sub={entrada?.aforo_maximo ? `de ${entrada.aforo_maximo}` : undefined} />
        <Kpi label="Atracciones" valor={String(atracciones.length)} />
        <Kpi label="Con consentimiento" valor={String(conConsentimiento)} />
      </div>

      <h2 className="mb-2 font-bold text-ranch-marron">Atracciones</h2>
      <div className="overflow-x-auto rounded-2xl border-2 border-ranch-marron/15 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-ranch-crema/60 text-xs uppercase text-ranch-marron/60">
            <tr>
              <th className="px-3 py-2">Atracción</th>
              <th className="px-3 py-2 text-center">Edad mín.</th>
              <th className="px-3 py-2 text-center">Estatura mín.</th>
              <th className="px-3 py-2 text-center">Consentimiento</th>
              <th className="px-3 py-2 text-right">Entradas hoy</th>
            </tr>
          </thead>
          <tbody>
            {atracciones.map((a) => {
              const entradasHoy = a.puntos_control.reduce((acc, p) => acc + (conteo.get(p.id) ?? 0), 0);
              return (
                <tr key={a.id} className="border-t border-ranch-marron/10">
                  <td className="px-3 py-2 font-semibold text-ranch-marron">{a.nombre}</td>
                  <td className="px-3 py-2 text-center text-ranch-marron/70">{a.edad_minima != null ? `${a.edad_minima} años` : "—"}</td>
                  <td className="px-3 py-2 text-center text-ranch-marron/70">{a.estatura_minima != null ? `${a.estatura_minima} cm` : "—"}</td>
                  <td className="px-3 py-2 text-center">
                    {a.requiere_consentimiento ? (
                      <span className="rounded-full bg-ranch-dorado/20 px-2 py-0.5 text-xs font-semibold text-ranch-marron">Requiere firma</span>
                    ) : (
                      <span className="text-xs text-ranch-marron/40">No</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-black text-ranch-marron">{entradasHoy}</td>
                </tr>
              );
            })}
            {atracciones.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-ranch-marron/50">
                  Aún no hay atracciones. Corre <code>npm run seed</code> para cargar la lista.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-ranch-marron/50">
        El <strong>conteo de entradas por día</strong> se alimenta de los escaneos del lector de acceso (módulo{" "}
        <Link href="/escaneo" className="underline">Escaneo</Link>). Las condiciones (edad, estatura) y el requisito de
        consentimiento se afinan por atracción con los datos reales.
      </p>
    </main>
  );
}

function Kpi({ label, valor, sub }: { label: string; valor: string; sub?: string }) {
  return (
    <div className="rounded-2xl border-2 border-ranch-marron/15 bg-white p-4 text-center shadow-sm">
      <p className="text-2xl font-black text-ranch-marron">{valor}</p>
      <p className="text-xs uppercase tracking-wide text-ranch-marron/50">{label}</p>
      {sub && <p className="text-[10px] text-ranch-marron/40">{sub}</p>}
    </div>
  );
}
