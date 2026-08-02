import { prisma } from "../db";

export interface RubroPlano {
  id: string;
  nombre: string;
  nivel: string;
  path: string; // "Grupo / Rubro / Subrubro"
  grupo: string; // grupo raíz
  grupoId: string;
}

/** Lista plana de rubros activos con su ruta completa y su grupo raíz (para selects y roll-up). */
export async function rubrosPlano(): Promise<RubroPlano[]> {
  const todos = await prisma.rubroGasto.findMany({ where: { activo: true }, orderBy: [{ orden: "asc" }] });
  const byId = new Map(todos.map((r) => [r.id, r]));

  const raiz = (id: string): { nombre: string; id: string } => {
    const r = byId.get(id)!;
    return r.padre_id ? raiz(r.padre_id) : { nombre: r.nombre, id: r.id };
  };
  const pathDe = (id: string): string => {
    const r = byId.get(id)!;
    return r.padre_id ? `${pathDe(r.padre_id)} / ${r.nombre}` : r.nombre;
  };

  return todos
    .map((r) => {
      const g = raiz(r.id);
      return { id: r.id, nombre: r.nombre, nivel: r.nivel, path: pathDe(r.id), grupo: g.nombre, grupoId: g.id };
    })
    .sort((a, b) => a.path.localeCompare(b.path, "es"));
}
