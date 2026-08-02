import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Parque Ranch Texas",
  description: "Sistema de taquilla, control de acceso y operación — Parque Ranch Texas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <body>{children}</body>
    </html>
  );
}
