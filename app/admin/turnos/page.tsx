import { supabaseServer } from "@/lib/supabase";

export default async function TurnosPage() {
  const sb = supabaseServer();
  const { data: trainer } = await sb
    .from("trainers")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (!trainer) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Turnos</h1>
          <p className="text-sm text-zinc-500">
            Lista de reservas registradas
          </p>
        </div>

        <div className="rounded-2xl bg-white shadow p-5">
          <p className="text-sm text-zinc-600">
            No hay entrenador configurado todavía. Creá un registro en la tabla
            “trainers” para empezar a registrar turnos.
          </p>
        </div>
      </div>
    );
  }

  const { data: appts } = await sb
    .from("appointments")
    .select("*, clients(phone,name)")
    .eq("trainer_id", trainer.id)
    .order("start_at", { ascending: true })
    .limit(200);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Turnos</h1>
        <p className="text-sm text-zinc-500">Lista de reservas registradas</p>
      </div>

      <div className="rounded-2xl bg-white shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-zinc-600">
            <tr>
              <th className="text-left px-4 py-3">Inicio</th>
              <th className="text-left px-4 py-3">Fin</th>
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-left px-4 py-3">Origen</th>
            </tr>
          </thead>
          <tbody>
            {(appts ?? []).map((a: any) => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-3">
                  {new Date(a.start_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {new Date(a.end_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {a.clients?.name ?? a.clients?.phone ?? "-"}
                </td>
                <td className="px-4 py-3">{a.status}</td>
                <td className="px-4 py-3">{a.source}</td>
              </tr>
            ))}
            {(appts ?? []).length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-zinc-500" colSpan={5}>
                  No hay turnos todavía.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
