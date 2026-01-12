import { supabaseServer } from "@/lib/supabase";

export default async function BloqueosPage() {
  const sb = supabaseServer();
  const { data: trainer } = await sb
    .from("trainers")
    .select("*")
    .limit(1)
    .single();

  const { data: blocks } = await sb
    .from("blocks")
    .select("*")
    .eq("trainer_id", trainer.id)
    .order("start_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Bloqueos / Vacaciones</h1>
        <p className="text-sm text-zinc-500">
          Todo lo que cargues acá se considera “no disponible” para turnos.
        </p>
      </div>

      <div className="rounded-2xl bg-white shadow p-5">
        <h2 className="font-semibold">Agregar bloqueo</h2>
        <form
          className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3"
          action="/api/admin/blocks"
          method="post"
        >
          <input
            name="start_at"
            className="rounded-xl border px-3 py-2"
            placeholder="2026-02-10T00:00:00Z"
          />
          <input
            name="end_at"
            className="rounded-xl border px-3 py-2"
            placeholder="2026-02-20T00:00:00Z"
          />
          <input
            name="reason"
            className="rounded-xl border px-3 py-2"
            placeholder="Vacaciones"
          />
          <button className="rounded-xl bg-black text-white py-2 font-medium">
            Guardar
          </button>
        </form>
        <p className="text-xs text-zinc-500 mt-2">
          Tip: para “1 día”, poné start 00:00Z y end 23:59Z (o al día siguiente
          00:00Z).
        </p>
      </div>

      <div className="rounded-2xl bg-white shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-zinc-600">
            <tr>
              <th className="text-left px-4 py-3">Inicio</th>
              <th className="text-left px-4 py-3">Fin</th>
              <th className="text-left px-4 py-3">Motivo</th>
              <th className="text-right px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {(blocks ?? []).map((b: any) => (
              <tr key={b.id} className="border-t">
                <td className="px-4 py-3">
                  {new Date(b.start_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {new Date(b.end_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">{b.reason ?? "-"}</td>
                <td className="px-4 py-3 text-right">
                  <form action="/api/admin/blocks/delete" method="post">
                    <input type="hidden" name="id" value={b.id} />
                    <button className="rounded-xl px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200">
                      Eliminar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(blocks ?? []).length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-zinc-500" colSpan={4}>
                  No hay bloqueos cargados.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
