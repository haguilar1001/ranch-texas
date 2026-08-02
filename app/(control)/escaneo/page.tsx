import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { obtenerSesion, tieneRol } from "@/lib/auth/sesion";
import EscaneoClient from "./EscaneoClient";

export const dynamic = "force-dynamic";

export default async function EscaneoPage() {
  const s = await obtenerSesion();
  if (!s) redirect("/login");
  if (!tieneRol(s.rol, "control_acceso")) {
    return (
      <main className="mx-auto max-w-md p-6">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700">
          Tu rol ({s.rol}) no tiene acceso al control de acceso.
        </p>
      </main>
    );
  }

  const puntos = await prisma.puntoControl.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, tipo_regla: true, requiere_consentimiento: true, aforo_maximo: true },
  });

  return <EscaneoClient usuario={s.nombre} puntos={puntos} />;
}
