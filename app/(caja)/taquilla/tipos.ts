import type { TipoLinea } from "@/lib/ventas/calculo";

export interface EntradaLinea {
  tipo_visitante_id: string;
  cantidad: number;
  tipo_linea: TipoLinea;
  motivo_cortesia_id?: string | null;
  autorizado_por?: string | null;
}

export interface EntradaPago {
  medio_pago_id: string;
  monto: number;
}

export interface EntradaVenta {
  lineas: EntradaLinea[];
  pagos: EntradaPago[];
  comprador_nombre?: string;
  comprador_documento?: string;
}

export type ResultadoVenta =
  | { ok: true; numero_venta: number; venta_id: string }
  | { ok: false; error: string };
