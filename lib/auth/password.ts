import bcrypt from "bcryptjs";

const RONDAS = 10;

export async function hashPassword(plano: string): Promise<string> {
  return bcrypt.hash(plano, RONDAS);
}

export async function verificarPassword(plano: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plano, hash);
}
