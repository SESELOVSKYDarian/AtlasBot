"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });

    if (!res.ok) {
      setErr("Contraseña incorrecta");
      return;
    }

    // set cookie client-side as well (server sets it too)
    Cookies.set("atlas_admin", "1", { expires: 1 });
    router.push("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow p-6">
        <h1 className="text-xl font-semibold">Atlas • Admin</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Entrá con tu contraseña de test
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <input
            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring"
            placeholder="Contraseña"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          {err ? <p className="text-sm text-red-600">{err}</p> : null}
          <button className="w-full rounded-xl bg-black text-white py-2 font-medium">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
