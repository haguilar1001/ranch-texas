import Link from "next/link";
import { obtenerSesion } from "@/lib/auth/sesion";
import { logout } from "@/lib/auth/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const s = await obtenerSesion();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <div className="rounded-2xl border-4 border-ranch-marron bg-ranch-crema px-10 py-8 shadow-lg text-center">
        <p className="text-sm uppercase tracking-widest text-ranch-dorado">Parque</p>
        <h1 className="text-4xl font-black text-ranch-marron">RANCH TEXAS</h1>
        <p className="mt-2 text-ranch-marron/70">Sistema de operación</p>
      </div>

      {s ? (
        <>
          <p className="text-sm text-ranch-marron/70">
            Sesión: <strong>{s.nombre}</strong> ({s.rol})
          </p>
          <nav className="grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
            {[
              ["Taquilla", "/taquilla"],
              ["Turno de caja", "/caja/turno"],
              ["Escaneo", "/escaneo"],
              ["Admin", "/admin"],
              ["Reportes", "/admin/reportes/ventas"],
            ].map(([label, href]) => (
              <a key={href} href={href} className="rounded-lg bg-ranch-marron px-5 py-3 font-semibold text-ranch-crema transition hover:bg-ranch-marron-oscuro">
                {label}
              </a>
            ))}
          </nav>
          <form action={logout}>
            <button className="text-sm text-ranch-marron/50 underline">Cerrar sesión</button>
          </form>
        </>
      ) : (
        <Link href="/login" className="rounded-lg bg-ranch-marron px-6 py-3 font-semibold text-ranch-crema hover:bg-ranch-marron-oscuro">
          Ingresar
        </Link>
      )}
      <p className="text-xs text-ranch-marron/50">Las pantallas se habilitan por fases (ver progreso.md).</p>
    </main>
  );
}
