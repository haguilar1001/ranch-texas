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
    ["Escaneo", "/escaneo", tieneRol(s.rol, "control_acceso")],
    ["Dashboard", "/admin/dashboard", tieneRol(s.rol, "consulta")],
    ["Gastos", "/admin/gastos", tieneRol(s.rol, "supervisor")],
  ] as [string, string, boolean][])
    .filter(([, , ver]) => ver)
    .map(([l, h]) => [l, h] as [string, string]);

  return (
    <header className="sticky top-0 z-20 border-b-2 border-ranch-marron/15 bg-ranch-crema/95 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-ranch-marron font-black text-ranch-crema">RT</span>
          <span className="hidden font-black tracking-tight text-ranch-marron sm:block">RANCH TEXAS</span>
        </Link>

        <NavLinks links={links} />

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-right text-xs leading-tight text-ranch-marron/60 sm:block">
            {s.nombre}<br />
            <span className="text-ranch-marron/40">{s.rol}</span>
          </span>
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
