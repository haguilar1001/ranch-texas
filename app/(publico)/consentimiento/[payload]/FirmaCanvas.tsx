"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

export interface FirmaCanvasRef {
  toDataURL: () => string;
  estaVacio: () => boolean;
  limpiar: () => void;
}

// Lienzo de firma con el dedo (pointer events). Expone toDataURL/limpiar por ref.
const FirmaCanvas = forwardRef<FirmaCanvasRef>(function FirmaCanvas(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);
  const vacio = useRef(true);

  useImperativeHandle(ref, () => ({
    toDataURL: () => canvasRef.current?.toDataURL("image/png") ?? "",
    estaVacio: () => vacio.current,
    limpiar: () => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, c.width, c.height);
      vacio.current = true;
    },
  }));

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  }

  function inicio(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    dibujando.current = true;
    vacio.current = false;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#2A1810";
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  function mover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dibujando.current) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  function fin() {
    dibujando.current = false;
  }

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={200}
      onPointerDown={inicio}
      onPointerMove={mover}
      onPointerUp={fin}
      onPointerLeave={fin}
      className="w-full touch-none rounded-lg border-2 border-dashed border-ranch-marron/40 bg-white"
      style={{ aspectRatio: "3 / 1" }}
    />
  );
});

export default FirmaCanvas;
