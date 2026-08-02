import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatearFechaHoraBogota } from "@/lib/tiempo";
import BotonImprimir from "./BotonImprimir";

export const dynamic = "force-dynamic";

export default async function ComprobantePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.consentimiento.findUnique({
    where: { id },
    include: {
      atraccion: true,
      texto: true,
      manilla: { include: { venta_detalle: { include: { tipo_visitante: true } } } },
    },
  });
  if (!c) notFound();

  const Fila = ({ k, v }: { k: string; v: string }) => (
    <div className="flex justify-between border-b border-ranch-marron/10 py-1 text-sm">
      <span className="text-ranch-marron/60">{k}</span>
      <span className="font-medium text-ranch-marron">{v}</span>
    </div>
  );

  return (
    <main className="mx-auto max-w-lg p-4">
      <style>{`@media print { .no-print { display:none !important } @page { margin: 12mm } }`}</style>

      <div className="mb-3 flex items-center justify-between">
        <BotonImprimir />
        <span className="text-xs text-ranch-marron/50">Comprobante {c.id.slice(0, 8)}</span>
      </div>

      <div className="rounded-xl border-2 border-ranch-marron/30 bg-white p-5">
        <div className="mb-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Ranch Texas" className="mx-auto mb-2 h-14 w-auto" />
          <h1 className="text-lg font-black text-ranch-marron">{c.texto.titulo}</h1>
          <p className="text-sm text-ranch-marron/60">Versión {c.texto.version} · Atracción: {c.atraccion.nombre}</p>
        </div>

        <Fila k="Firmante" v={c.nombre_firmante} />
        <Fila k="Documento" v={c.documento_firmante} />
        {c.es_menor && (
          <>
            <Fila k="Menor de edad" v="Sí" />
            <Fila k="Acudiente" v={c.nombre_acudiente ?? "—"} />
            <Fila k="Doc. acudiente" v={c.documento_acudiente ?? "—"} />
            <Fila k="Parentesco" v={c.parentesco ?? "—"} />
          </>
        )}
        <Fila k="Manilla" v={`${c.manilla.consecutivo} · ${c.manilla.es_bebe ? "BEBÉ" : c.manilla.venta_detalle.tipo_visitante.nombre}`} />
        <Fila k="Fecha y hora" v={formatearFechaHoraBogota(c.firmado_en)} />
        {c.ip && <Fila k="IP" v={c.ip} />}

        <div className="mt-4">
          <p className="mb-1 text-sm font-semibold text-ranch-marron">Texto firmado</p>
          <p className="max-h-40 overflow-y-auto whitespace-pre-line rounded bg-ranch-crema/40 p-2 text-xs text-ranch-marron/80">{c.texto.cuerpo}</p>
        </div>

        <div className="mt-4">
          <p className="mb-1 text-sm font-semibold text-ranch-marron">Firma</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.firma_imagen} alt="Firma" className="h-28 w-full rounded border border-ranch-marron/20 bg-white object-contain" />
        </div>
      </div>
    </main>
  );
}
