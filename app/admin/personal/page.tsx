import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { obtenerSesion, tieneRol } from "@/lib/auth/sesion";

export const dynamic = "force-dynamic";

const ESTADO_COLOR: Record<string, string> = {
  activo: "bg-ranch-verde/15 text-ranch-verde",
  inactivo: "bg-ranch-marron/10 text-ranch-marron/60",
  retirado: "bg-red-100 text-red-700",
};

export default async function PersonalPage() {
  const s = await obtenerSesion();
  if (!s) redirect("/login");
  if (!tieneRol(s.rol, "supervisor")) return <main className="p-6">Sin acceso.</main>;

  const [empleados, areas, cargos] = await Promise.all([
    prisma.empleado.findMany({
      where: { activo: true },
      include: { area: { select: { nombre: true } }, cargo: { select: { nombre: true } } },
      orderBy: { nombre: "asc" },
    }),
    prisma.areaTrabajo.count({ where: { activo: true } }),
    prisma.cargo.count({ where: { activo: true } }),
  ]);

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-ranch-marron">Personal</h1>
          <p className="text-sm text-ranch-marron/60">Empleados, áreas y cargos</p>
        </div>
        <span className="rounded-full bg-ranch-dorado/20 px-3 py-1 text-xs font-semibold text-ranch-marron">
          Boceto · datos de ejemplo
        </span>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Kpi label="Empleados" valor={empleados.length} />
        <Kpi label="Áreas" valor={areas} />
        <Kpi label="Cargos" valor={cargos} />
      </div>

      <div className="overflow-x-auto rounded-2xl border-2 border-ranch-marron/15 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-ranch-crema/60 text-xs uppercase text-ranch-marron/60">
            <tr>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Documento</th>
              <th className="px-3 py-2">Cargo</th>
              <th className="px-3 py-2">Área</th>
              <th className="px-3 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {empleados.map((e) => (
              <tr key={e.id} className="border-t border-ranch-marron/10">
                <td className="px-3 py-2 font-semibold text-ranch-marron">{e.nombre}</td>
                <td className="px-3 py-2 text-ranch-marron/70">{e.tipo_documento} {e.documento}</td>
                <td className="px-3 py-2 text-ranch-marron/70">{e.cargo?.nombre ?? "—"}</td>
                <td className="px-3 py-2 text-ranch-marron/70">{e.area?.nombre ?? "—"}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADO_COLOR[e.estado] ?? ""}`}>{e.estado}</span>
                </td>
              </tr>
            ))}
            {empleados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-ranch-marron/50">
                  Aún no hay empleados. Corre <code>npm run seed:boceto</code> para cargar datos de ejemplo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Kpi({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="rounded-2xl border-2 border-ranch-marron/15 bg-white p-4 text-center shadow-sm">
      <p className="text-2xl font-black text-ranch-marron">{valor}</p>
      <p className="text-xs uppercase tracking-wide text-ranch-marron/50">{label}</p>
    </div>
  );
}
