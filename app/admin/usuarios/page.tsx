import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { obtenerSesion, tieneRol } from "@/lib/auth/sesion";
import { formatearFechaHoraBogota } from "@/lib/tiempo";
import UsuariosClient from "./UsuariosClient";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const s = await obtenerSesion();
  if (!s) redirect("/login");
  if (!tieneRol(s.rol, "administrador")) {
    return <main className="p-6"><p className="rounded bg-red-50 px-4 py-3 text-red-700">Solo los administradores pueden gestionar usuarios.</p></main>;
  }

  const usuarios = await prisma.usuario.findMany({
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    select: { id: true, nombre: true, usuario: true, rol: true, activo: true, ultimo_ingreso: true },
  });

  return (
    <UsuariosClient
      miId={s.id}
      usuarios={usuarios.map((u) => ({
        id: u.id, nombre: u.nombre, usuario: u.usuario, rol: u.rol, activo: u.activo,
        ultimo: u.ultimo_ingreso ? formatearFechaHoraBogota(u.ultimo_ingreso) : "—",
      }))}
    />
  );
}
