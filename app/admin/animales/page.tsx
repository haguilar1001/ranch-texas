import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { obtenerSesion, tieneRol } from "@/lib/auth/sesion";
import { formatearCOP } from "@/lib/dinero/cop";

export const dynamic = "force-dynamic";

const ESTADO_COLOR: Record<string, string> = {
  activo: "bg-ranch-verde/15 text-ranch-verde",
  enfermo: "bg-amber-100 text-amber-700",
  cuarentena: "bg-orange-100 text-orange-700",
  fallecido: "bg-red-100 text-red-700",
  trasladado: "bg-ranch-marron/10 text-ranch-marron/60",
};

export default async function AnimalesPage() {
  const s = await obtenerSesion();
  if (!s) redirect("/login");
  if (!tieneRol(s.rol, "supervisor")) return <main className="p-6">Sin acceso.</main>;

  const [animales, categorias, recintos, alimentos, raciones] = await Promise.all([
    prisma.animal.findMany({
      where: { activo: true },
      include: { categoria: { select: { nombre: true } }, recinto: { select: { nombre: true } } },
      orderBy: [{ categoria: { nombre: "asc" } }, { nombre: "asc" }],
    }),
    prisma.categoriaAnimal.count({ where: { activo: true } }),
    prisma.recinto.count({ where: { activo: true } }),
    prisma.alimento.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
    prisma.racion.findMany({
      include: {
        categoria: { select: { nombre: true } },
        animal: { select: { nombre: true } },
        alimento: { select: { nombre: true } },
      },
      orderBy: { id: "asc" },
    }),
  ]);

  const totalCabezas = animales.reduce((s, a) => s + (a.cantidad ?? 0), 0);

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-ranch-marron">Animales</h1>
          <p className="text-sm text-ranch-marron/60">Inventario, recintos y alimentación</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Kpi label="Cabezas" valor={totalCabezas.toLocaleString("es-CO")} />
        <Kpi label="Grupos" valor={String(animales.length)} />
        <Kpi label="Categorías" valor={String(categorias)} />
        <Kpi label="Recintos" valor={String(recintos)} />
        <Kpi label="Alimentos" valor={String(alimentos.length)} />
      </div>

      {/* Inventario */}
      <h2 className="mb-2 font-bold text-ranch-marron">Inventario</h2>
      <div className="mb-6 overflow-x-auto rounded-2xl border-2 border-ranch-marron/15 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-ranch-crema/60 text-xs uppercase text-ranch-marron/60">
            <tr>
              <th className="px-3 py-2">Grupo</th>
              <th className="px-3 py-2 text-right">Cantidad</th>
              <th className="px-3 py-2">Categoría</th>
              <th className="px-3 py-2">Especie</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Observación</th>
            </tr>
          </thead>
          <tbody>
            {animales.map((a) => (
              <tr key={a.id} className="border-t border-ranch-marron/10">
                <td className="px-3 py-2 font-semibold text-ranch-marron">{a.nombre}</td>
                <td className="px-3 py-2 text-right font-bold text-ranch-marron">{(a.cantidad ?? 0).toLocaleString("es-CO")}</td>
                <td className="px-3 py-2 text-ranch-marron/70">{a.categoria.nombre}</td>
                <td className="px-3 py-2 text-ranch-marron/70">{a.especie ?? "—"}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADO_COLOR[a.estado] ?? ""}`}>{a.estado}</span>
                </td>
                <td className="px-3 py-2 text-xs text-ranch-marron/60">{a.observaciones ?? "—"}</td>
              </tr>
            ))}
            {animales.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-ranch-marron/50">
                  Aún no hay animales. Corre <code>npm run import:animales</code> para cargar el inventario real.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alimentos */}
        <section>
          <h2 className="mb-2 font-bold text-ranch-marron">Alimentos</h2>
          <div className="overflow-x-auto rounded-2xl border-2 border-ranch-marron/15 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-ranch-crema/60 text-xs uppercase text-ranch-marron/60">
                <tr>
                  <th className="px-3 py-2">Alimento</th>
                  <th className="px-3 py-2">Unidad</th>
                  <th className="px-3 py-2 text-right">Costo</th>
                  <th className="px-3 py-2 text-right">Existencia</th>
                </tr>
              </thead>
              <tbody>
                {alimentos.map((a) => (
                  <tr key={a.id} className="border-t border-ranch-marron/10">
                    <td className="px-3 py-2 font-semibold text-ranch-marron">{a.nombre}</td>
                    <td className="px-3 py-2 text-ranch-marron/70">{a.unidad_medida}</td>
                    <td className="px-3 py-2 text-right text-ranch-marron/70">{a.costo_unitario != null ? formatearCOP(a.costo_unitario) : "—"}</td>
                    <td className="px-3 py-2 text-right text-ranch-marron/70">{a.existencia ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Raciones / dieta */}
        <section>
          <h2 className="mb-2 font-bold text-ranch-marron">Raciones (consumo de alimento)</h2>
          <div className="overflow-x-auto rounded-2xl border-2 border-ranch-marron/15 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-ranch-crema/60 text-xs uppercase text-ranch-marron/60">
                <tr>
                  <th className="px-3 py-2">Destino</th>
                  <th className="px-3 py-2">Alimento</th>
                  <th className="px-3 py-2 text-right">Cantidad</th>
                  <th className="px-3 py-2">Frecuencia</th>
                </tr>
              </thead>
              <tbody>
                {raciones.map((r) => (
                  <tr key={r.id} className="border-t border-ranch-marron/10">
                    <td className="px-3 py-2 text-ranch-marron/70">{r.animal?.nombre ?? r.categoria?.nombre ?? "—"}</td>
                    <td className="px-3 py-2 font-semibold text-ranch-marron">{r.alimento.nombre}</td>
                    <td className="px-3 py-2 text-right text-ranch-marron/70">{r.cantidad} {r.unidad}</td>
                    <td className="px-3 py-2 text-ranch-marron/70">{r.frecuencia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Kpi({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-2xl border-2 border-ranch-marron/15 bg-white p-4 text-center shadow-sm">
      <p className="text-2xl font-black text-ranch-marron">{valor}</p>
      <p className="text-xs uppercase tracking-wide text-ranch-marron/50">{label}</p>
    </div>
  );
}
