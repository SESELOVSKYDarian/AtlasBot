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
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6 text-zinc-100">
      <div className="w-full max-w-sm rounded-2xl bg-zinc-900 shadow p-6 ring-1 ring-white/10">
        <h1 className="text-xl font-semibold">Atlas • Admin</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Entrá con tu contraseña de test
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <input
            className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:ring focus:ring-white/20"
            placeholder="Contraseña"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          {err ? <p className="text-sm text-red-400">{err}</p> : null}
          <button className="w-full rounded-xl bg-white text-black py-2 font-medium">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
