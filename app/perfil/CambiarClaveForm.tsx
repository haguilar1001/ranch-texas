"use client";

import { useActionState } from "react";
import { cambiarPassword } from "@/lib/auth/actions";

export default function CambiarClaveForm() {
  const [state, action, pending] = useActionState(cambiarPassword, null);

  return (
    <form action={action} className="mt-4 space-y-3 rounded-2xl border-2 border-ranch-marron/20 bg-white p-5">
      <h2 className="font-bold text-ranch-marron">Cambiar contraseña</h2>
      <div>
        <label className="block text-sm text-ranch-marron/70">Contraseña actual</label>
        <input name="actual" type="password" autoComplete="current-password" className="mt-1 w-full rounded-lg border border-ranch-marron/30 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm text-ranch-marron/70">Nueva contraseña</label>
        <input name="nueva" type="password" autoComplete="new-password" className="mt-1 w-full rounded-lg border border-ranch-marron/30 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm text-ranch-marron/70">Confirmar nueva contraseña</label>
        <input name="confirmar" type="password" autoComplete="new-password" className="mt-1 w-full rounded-lg border border-ranch-marron/30 px-3 py-2" />
      </div>

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Contraseña actualizada ✓</p>}

      <button type="submit" disabled={pending} className="w-full rounded-lg bg-ranch-marron px-4 py-3 font-semibold text-ranch-crema hover:bg-ranch-marron-oscuro disabled:opacity-60">
        {pending ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}
