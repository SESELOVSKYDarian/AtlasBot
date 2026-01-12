import { supabaseServer } from "@/lib/supabase";

const dayNames = [
  "",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export default async function HorariosPage() {
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
          <h1 className="text-2xl font-semibold">Horarios</h1>
          <p className="text-sm text-zinc-500">
            Define rangos por día (ej: Lun 09-13 y 16-20)
          </p>
        </div>

        <div className="rounded-2xl bg-white shadow p-5">
          <p className="text-sm text-zinc-600">
            No hay entrenador configurado todavía. Creá un registro en la tabla
            “trainers” para habilitar la carga de horarios.
          </p>
        </div>
      </div>
    );
  }

  const trainerId = trainer.id;

  const { data: rules } = await sb
    .from("availability_rules")
    .select("*")
    .eq("trainer_id", trainerId)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Horarios</h1>
          <p className="text-sm text-zinc-500">
            Define rangos por día (ej: Lun 09-13 y 16-20)
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow p-5">
        <h2 className="font-semibold">Agregar horario</h2>
        <form
          className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3"
          action="/api/admin/rules"
          method="post"
        >
          <select name="day_of_week" className="rounded-xl border px-3 py-2">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <option key={d} value={d}>
                {dayNames[d]}
              </option>
            ))}
          </select>
          <input
            name="start_time"
            className="rounded-xl border px-3 py-2"
            placeholder="09:00"
          />
          <input
            name="end_time"
            className="rounded-xl border px-3 py-2"
            placeholder="13:00"
          />
          <button className="rounded-xl bg-black text-white py-2 font-medium">
            Guardar
          </button>
        </form>
      </div>

      <div className="rounded-2xl bg-white shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-zinc-600">
            <tr>
              <th className="text-left px-4 py-3">Día</th>
              <th className="text-left px-4 py-3">Desde</th>
              <th className="text-left px-4 py-3">Hasta</th>
              <th className="text-right px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {(rules ?? []).map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">{dayNames[r.day_of_week]}</td>
                <td className="px-4 py-3">
                  {String(r.start_time).slice(0, 5)}
                </td>
                <td className="px-4 py-3">{String(r.end_time).slice(0, 5)}</td>
                <td className="px-4 py-3 text-right">
                  <form action="/api/admin/rules/delete" method="post">
                    <input type="hidden" name="id" value={r.id} />
                    <button className="rounded-xl px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200">
                      Eliminar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(rules ?? []).length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-zinc-500" colSpan={4}>
                  Todavía no hay horarios cargados.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
