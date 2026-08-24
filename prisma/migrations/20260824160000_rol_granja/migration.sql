-- Rol operativo de granja: puede alimentar y trasladar animales, y nada más.
-- No entra en la jerarquía de reportes (no ve ventas, caja ni gastos).
ALTER TYPE "Rol" ADD VALUE IF NOT EXISTS 'granja';
