import { SignJWT, jwtVerify } from "jose";

// Sesión corta en caja: JWT firmado guardado en cookie httpOnly.
// La verificación de credenciales y el set/clear de la cookie se implementan en F0/F1
// (server actions de login/logout). Aquí van las primitivas de firma/lectura del token.

const DURACION = "8h"; // jornada operativa; la sesión de caja se cierra al terminar

export interface SesionUsuario {
  id: string;
  usuario: string;
  nombre: string;
  rol: string;
}

function clave(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET no está definido en el entorno.");
  return new TextEncoder().encode(s);
}

export async function crearToken(sesion: SesionUsuario): Promise<string> {
  return new SignJWT({ ...sesion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(DURACION)
    .sign(clave());
}

export async function leerToken(token: string): Promise<SesionUsuario | null> {
  try {
    const { payload } = await jwtVerify(token, clave());
    return {
      id: String(payload.id),
      usuario: String(payload.usuario),
      nombre: String(payload.nombre),
      rol: String(payload.rol),
    };
  } catch {
    return null;
  }
}
