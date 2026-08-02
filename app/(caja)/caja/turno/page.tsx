import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth/sesion";
import { turnoAbiertoDe } from "@/lib/caja/turno";
import { formatearCOP } from "@/lib/dinero/cop";
import TurnoForm from "./TurnoForm";

export const dynamic = "force-dynamic";

export default async function TurnoPage() {
  const s = await obtenerSesion();
  if (!s) redirect("/login");

  const turno = await turnoAbiertoDe(s.id);
  const cajas = await prisma.caja.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } });

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-1 text-2xl font-black text-ranch-marron">Turno de caja</h1>
      <p className="mb-6 text-sm text-ranch-marron/60">Cajero: {s.nombre}</p>

      {turno ? (
        <div className="rounded-2xl border-4 border-ranch-verde bg-white p-6">
          <p className="text-sm text-ranch-marron/60">Turno abierto</p>
          <p className="text-xl font-bold text-ranch-marron">{turno.caja.nombre}</p>
          <p className="mt-2 text-sm">
            Base inicial: <strong>{formatearCOP(turno.base_inicial)}</strong>
          </p>
          <p className="text-sm">Abierto: {turno.abierto_en.toLocaleString("es-CO")}</p>
          <Link
            href="/taquilla"
            className="mt-4 block rounded-lg bg-ranch-marron px-4 py-3 text-center font-semibold text-ranch-crema hover:bg-ranch-marron-oscuro"
          >
            Ir a Taquilla →
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border-4 border-ranch-marron bg-white p-6">
          <p className="mb-4 text-sm text-ranch-marron/70">
            No tienes un turno abierto. Abre uno para poder vender.
          </p>
          <TurnoForm cajas={cajas} />
        </div>
      )}
    </main>
  );
}
