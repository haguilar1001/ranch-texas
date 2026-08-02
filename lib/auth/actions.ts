"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verificarPassword } from "./password";
import { guardarSesion, limpiarSesion } from "./sesion";

interface EstadoLogin {
  error?: string;
}

export async function login(_prev: EstadoLogin | null, formData: FormData): Promise<EstadoLogin> {
  const usuario = String(formData.get("usuario") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!usuario || !password) return { error: "Ingresa usuario y contraseña." };

  const u = await prisma.usuario.findUnique({ where: { usuario } });
  if (!u || !u.activo || !(await verificarPassword(password, u.hash_password))) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  await prisma.usuario.update({ where: { id: u.id }, data: { ultimo_ingreso: new Date() } });
  await guardarSesion({ id: u.id, usuario: u.usuario, nombre: u.nombre, rol: u.rol });
  redirect("/");
}

export async function logout(): Promise<void> {
  await limpiarSesion();
  redirect("/login");
}
