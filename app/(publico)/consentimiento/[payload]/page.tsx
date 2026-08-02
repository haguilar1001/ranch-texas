import { prisma } from "@/lib/db";
import { verificarPayload } from "@/lib/qr/firma";
import { textoVigente } from "@/lib/consentimiento/texto";
import ConsentimientoForm from "./ConsentimientoForm";

export const dynamic = "force-dynamic";

function Aviso({ texto }: { texto: string }) {
  return (
    <main className="mx-auto max-w-lg p-6 text-center">
      <div className="rounded-xl border-4 border-red-300 bg-white p-6">
        <p className="text-lg font-semibold text-red-700">{texto}</p>
      </div>
    </main>
  );
}

export default async function ConsentimientoPage({ params }: { params: Promise<{ payload: string }> }) {
  const { payload: raw } = await params;
  const payload = decodeURIComponent(raw);

  const verif = verificarPayload(payload);
  if (!verif.valido) return <Aviso texto="Código de manilla inválido." />;

  const manilla = await prisma.manilla.findUnique({
    where: { codigo_uuid: verif.uuid },
    include: { venta_detalle: { include: { tipo_visitante: true } } },
  });
  if (!manilla) return <Aviso texto="Manilla no encontrada." />;
  if (manilla.estado === "anulada") return <Aviso texto="Esta manilla está anulada." />;

  const atracciones = await prisma.atraccion.findMany({
    where: { activa: true, requiere_consentimiento: true },
    orderBy: { nombre: "asc" },
  });
  if (atracciones.length === 0) return <Aviso texto="No hay atracciones que requieran consentimiento." />;

  const firmadas = new Set(
    (await prisma.consentimiento.findMany({ where: { manilla_id: manilla.id }, select: { atraccion_id: true } }))
      .map((c) => c.atraccion_id),
  );

  const datos = await Promise.all(
    atracciones.map(async (a) => {
      const t = await textoVigente(a.id);
      return {
        id: a.id,
        nombre: a.nombre,
        yaFirmado: firmadas.has(a.id),
        titulo: t?.titulo ?? "Consentimiento",
        cuerpo: t?.cuerpo ?? "",
        version: t?.version ?? 1,
      };
    }),
  );

  const tipo = manilla.es_bebe ? "BEBÉ" : manilla.venta_detalle.tipo_visitante.nombre;

  return <ConsentimientoForm payload={payload} consecutivo={manilla.consecutivo} tipo={tipo} atracciones={datos} />;
}
