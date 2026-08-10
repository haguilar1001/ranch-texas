import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { leerToken } from "@/lib/auth/session";

// Defensa en profundidad: además de la verificación por página, el middleware bloquea las
// rutas protegidas sin sesión válida. Las rutas públicas (/, /login, /consentimiento) no pasan por aquí.
export async function middleware(req: NextRequest) {
  const token = req.cookies.get("rt_sesion")?.value;
  const sesion = token ? await leerToken(token) : null;
  if (!sesion) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/taquilla/:path*", "/caja/:path*", "/escaneo/:path*", "/admin/:path*", "/perfil/:path*"],
};
