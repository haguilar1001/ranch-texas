import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { obtenerSesion, tieneRol } from "@/lib/auth/sesion";
import { rubrosPlano } from "@/lib/gastos/rubros";
import { fechaBogota } from "@/lib/tiempo";
import GastosClient from "./GastosClient";

export const dynamic = "force-dynamic";

export default async function GastosPage() {
  const s = await obtenerSesion();
  if (!s) redirect("/login");
  if (!tieneRol(s.rol, "supervisor")) {
    return <main className="p-6"><p className="rounded bg-red-50 px-4 py-3 text-red-700">Solo supervisores/administradores.</p></main>;
  }

  const [rubros, medios, gastos] = await Promise.all([
    rubrosPlano(),
    prisma.medioPago.findMany({ where: { activo: true }, orderBy: { orden: "asc" } }),
    prisma.gasto.findMany({
      orderBy: { fecha_gasto: "desc" },
      take: 50,
      include: { rubro: true, proveedor: true },
    }),
  ]);

  return (
    <GastosClient
      fechaHoy={fechaBogota()}
      rubros={rubros.map((r) => ({ id: r.id, path: r.path }))}
      medios={medios.map((m) => ({ id: m.id, nombre: m.nombre }))}
      gastos={gastos.map((g) => ({
        id: g.id,
        fecha: g.fecha_gasto.toISOString().slice(0, 10),
        rubro: g.rubro.nombre,
        proveedor: g.proveedor?.nombre ?? "—",
        descripcion: g.descripcion,
        total: g.total,
        estado: g.estado,
      }))}
    />
  );
}
