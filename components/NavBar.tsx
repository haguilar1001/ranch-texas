import Link from "next/link";
import { obtenerSesion, tieneRol } from "@/lib/auth/sesion";
import { logout } from "@/lib/auth/actions";
import NavLinks from "./NavLinks";

export default async function NavBar() {
  const s = await obtenerSesion();
  if (!s) return null;

  const links = ([
    ["Inicio", "/", true],
    ["Taquilla", "/taquilla", tieneRol(s.rol, "cajero")],
    ["Caja", "/caja/turno", tieneRol(s.rol, "cajero")],
    ["Cuadre", "/admin/cuadre", tieneRol(s.rol, "supervisor")],
    ["Manillas", "/admin/manillas", tieneRol(s.rol, "supervisor")],
    ["Escaneo", "/escaneo", tieneRol(s.rol, "control_acceso")],
    ["Ventas", "/admin/dashboard", tieneRol(s.rol, "consulta")],
    ["Accesos", "/admin/accesos", tieneRol(s.rol, "consulta")],
    ["Personal", "/admin/personal", tieneRol(s.rol, "supervisor")],
    ["Animales", "/admin/animales", tieneRol(s.rol, "supervisor")],
    ["Equipos", "/admin/equipos", tieneRol(s.rol, "supervisor")],
    ["Gastos", "/admin/gastos", tieneRol(s.rol, "supervisor")],
    ["Tarifas", "/admin/tarifas", tieneRol(s.rol, "administrador")],
    ["Usuarios", "/admin/usuarios", tieneRol(s.rol, "administrador")],
  ] as [string, string, boolean][])
    .filter(([, , ver]) => ver)
    .map(([l, h]) => [l, h] as [string, string]);

  return (
    <header className="sticky top-0 z-20 border-b-2 border-ranch-marron/15 bg-ranch-crema/95 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Ranch Texas" className="h-9 w-auto" />
        </Link>

        <NavLinks links={links} />

        <div className="ml-auto flex items-center gap-3">
          <Link href="/perfil" title="Mi cuenta" className="hidden text-right text-xs leading-tight text-ranch-marron/60 hover:text-ranch-marron sm:block">
            {s.nombre}<br />
            <span className="text-ranch-marron/40">{s.rol}</span>
          </Link>
          <form action={logout}>
            <button className="rounded-lg border border-ranch-marron/30 px-3 py-1.5 text-sm font-semibold text-ranch-marron hover:bg-ranch-marron/10">
              Salir
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
