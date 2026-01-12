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

type Appointment = {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  source: string;
  clients?: { name?: string | null; phone?: string | null } | null;
};

type Block = {
  id: string;
  start_at: string;
  end_at: string;
  reason?: string | null;
};

function formatDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildMonthGrid(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  const daysInMonth = last.getDate();
  const startDay = (first.getDay() + 6) % 7;
  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, idx) => {
    const dayOffset = idx - startDay + 1;
    if (dayOffset < 1 || dayOffset > daysInMonth) {
      return null;
    }
    return new Date(year, monthIndex, dayOffset);
  });
}

export default async function AdminHome({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const resolvedSearchParams = searchParams
    ? await searchParams
    : undefined;
  const googleCalendarEmbedUrl =
    process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_EMBED_URL ?? "";
  const supabaseReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let rules: any[] = [];
  let blocks: Block[] = [];
  let appts: Appointment[] = [];

  if (supabaseReady) {
    const sb = supabaseServer();
    const { data: trainer } = await sb
      .from("trainers")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (!trainer) {
      return (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white shadow p-6">
            <h1 className="text-2xl font-semibold">Panel de administración</h1>
            <p className="text-sm text-zinc-500 mt-2">
              Todavía no hay un entrenador configurado. Creá un registro en la
              tabla “trainers” para habilitar el panel completo.
            </p>
          </div>

          <div className="rounded-3xl bg-white shadow p-6">
            <h2 className="font-semibold">Checklist antes de WhatsApp</h2>
            <ul className="mt-3 text-sm text-zinc-600 list-disc pl-5 space-y-1">
              <li>Cargar horarios (ej: Lun–Vie 09-13 y 16-20)</li>
              <li>Cargar bloqueos/vacaciones</li>
              <li>Verificar que la tabla “trainers” tenga 1 fila</li>
            </ul>
          </div>
        </div>
      );
    }

    const trainerId = trainer.id;
    const [rulesRes, blocksRes, apptsRes] = await Promise.all([
      sb
        .from("availability_rules")
        .select("*")
        .eq("trainer_id", trainerId)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true }),
      sb
        .from("blocks")
        .select("*")
        .eq("trainer_id", trainerId)
        .order("start_at", { ascending: false }),
      sb
        .from("appointments")
        .select("*, clients(phone,name)")
        .eq("trainer_id", trainerId)
        .order("start_at", { ascending: true })
        .limit(200),
    ]);

    rules = rulesRes.data ?? [];
    blocks = (blocksRes.data ?? []) as Block[];
    appts = (apptsRes.data ?? []) as Appointment[];
  }

  const today = new Date();
  const monthGrid = buildMonthGrid(today.getFullYear(), today.getMonth());
  const monthLabel = today.toLocaleString("es-AR", {
    month: "long",
    year: "numeric",
  });

  const apptsByDay = appts.reduce<Record<string, Appointment[]>>((acc, a) => {
    const key = formatDayKey(new Date(a.start_at));
    acc[key] = acc[key] ? [...acc[key], a] : [a];
    return acc;
  }, {});

  const blocksByDay = (blocks as Block[]).reduce<Record<string, Block[]>>(
    (acc, b) => {
      const key = formatDayKey(new Date(b.start_at));
      acc[key] = acc[key] ? [...acc[key], b] : [b];
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-8">
      {resolvedSearchParams?.error ? (
        <div className="rounded-3xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {resolvedSearchParams.error}
        </div>
      ) : null}
      {!supabaseReady ? (
        <div className="rounded-3xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          Configurá NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para
          cargar datos reales. Mostrando vista previa sin información.
        </div>
      ) : null}
      <section className="rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-6 shadow">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Panel Atlas</h1>
            <p className="text-sm text-zinc-300">
              Todo tu calendario y disponibilidad en un solo lugar.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatBadge label="Horarios" value={String(rules.length)} />
            <StatBadge label="Bloqueos" value={String(blocks.length)} />
            <StatBadge label="Turnos" value={String(appts.length)} />
          </div>
        </div>
      </section>

      <section
        className="rounded-3xl bg-zinc-900/80 shadow p-6 ring-1 ring-white/10"
        id="turnos"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Calendario</h2>
            <p className="text-sm text-zinc-300">
              Vista mensual con turnos y bloqueos.
            </p>
          </div>
          <div className="text-sm font-medium capitalize text-zinc-300">
            {monthLabel}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2 text-xs text-zinc-400">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
            <div key={d} className="text-center font-medium uppercase">
              {d}
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
          <div className="grid grid-cols-7 gap-2">
            {monthGrid.map((day, idx) => {
              if (!day) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="h-28 rounded-2xl border border-dashed border-white/10 bg-zinc-800/40"
                  />
                );
              }
              const key = formatDayKey(day);
              const dayAppts = apptsByDay[key] ?? [];
              const dayBlocks = blocksByDay[key] ?? [];
              return (
                <div
                  key={key}
                  className="h-28 rounded-2xl border border-white/10 bg-zinc-900 p-2 text-xs shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-100">
                      {day.getDate()}
                    </span>
                    {dayBlocks.length > 0 ? (
                      <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] text-red-200">
                        Bloqueo
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 space-y-1">
                    {dayAppts.slice(0, 2).map((a) => (
                      <div
                        key={a.id}
                        className="rounded-lg bg-white/10 px-2 py-1 text-[10px] text-zinc-100"
                      >
                        {new Date(a.start_at).toLocaleTimeString("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · {a.clients?.name ?? a.clients?.phone ?? "Cliente"}
                      </div>
                    ))}
                    {dayAppts.length > 2 ? (
                      <div className="text-[10px] text-zinc-400">
                        +{dayAppts.length - 2} más
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-3">
            <div className="flex items-center justify-between text-sm text-zinc-300">
              <span className="font-medium">Google Calendar</span>
              <span className="text-xs text-zinc-500">Sincronizado</span>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-white/5 bg-black/40">
              {googleCalendarEmbedUrl ? (
                <iframe
                  title="Google Calendar"
                  src={googleCalendarEmbedUrl}
                  className="h-80 w-full"
                  loading="lazy"
                />
              ) : (
                <div className="p-4 text-sm text-zinc-400">
                  Configurá NEXT_PUBLIC_GOOGLE_CALENDAR_EMBED_URL con el enlace
                  de embed de tu calendario para verlo acá.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section
          className="rounded-3xl bg-zinc-900/80 shadow p-6 ring-1 ring-white/10"
          id="horarios"
        >
          <div>
            <h2 className="text-xl font-semibold">Horarios</h2>
            <p className="text-sm text-zinc-300">
              Define rangos por día (ej: Lun 09-13 y 16-20)
            </p>
          </div>
          <form
            className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4"
            action="/api/admin/rules"
            method="post"
          >
            <select
              name="day_of_week"
              className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-100"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <option key={d} value={d}>
                  {dayNames[d]}
                </option>
              ))}
            </select>
            <input
              name="start_time"
              className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-100"
              placeholder="09:00"
            />
            <input
              name="end_time"
              className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-100"
              placeholder="13:00"
            />
            <button className="rounded-xl bg-white text-black py-2 font-medium">
              Guardar
            </button>
          </form>
          <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-3 text-sm">
            {rules.length === 0 ? (
              <p className="text-zinc-400">Todavía no hay horarios cargados.</p>
            ) : (
              <ul className="space-y-2">
                {rules.map((r: any) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between rounded-xl bg-zinc-950 px-3 py-2 shadow-sm ring-1 ring-white/10"
                  >
                    <span>
                      {dayNames[r.day_of_week]} ·{" "}
                      {String(r.start_time).slice(0, 5)}-
                      {String(r.end_time).slice(0, 5)}
                    </span>
                    <form action="/api/admin/rules/delete" method="post">
                      <input type="hidden" name="id" value={r.id} />
                      <button className="rounded-xl px-3 py-1.5 bg-white/10 hover:bg-white/20">
                        Eliminar
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section
          className="rounded-3xl bg-zinc-900/80 shadow p-6 ring-1 ring-white/10"
          id="bloqueos"
        >
          <div>
            <h2 className="text-xl font-semibold">Bloqueos / Vacaciones</h2>
            <p className="text-sm text-zinc-300">
              Todo lo que cargues acá se considera “no disponible” para turnos.
            </p>
          </div>
          <form
            className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4"
            action="/api/admin/blocks"
            method="post"
          >
            <input
              name="start_at"
              className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-100"
              placeholder="2026-02-10T00:00:00Z"
            />
            <input
              name="end_at"
              className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-100"
              placeholder="2026-02-20T00:00:00Z"
            />
            <input
              name="reason"
              className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-zinc-100"
              placeholder="Vacaciones"
            />
            <button className="rounded-xl bg-white text-black py-2 font-medium">
              Guardar
            </button>
          </form>
          <p className="mt-2 text-xs text-zinc-400">
            Tip: para “1 día”, poné start 00:00Z y end 23:59Z (o al día
            siguiente 00:00Z).
          </p>
          <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-3 text-sm">
            {blocks.length === 0 ? (
              <p className="text-zinc-400">No hay bloqueos cargados.</p>
            ) : (
              <ul className="space-y-2">
                {blocks.map((b: Block) => (
                  <li
                    key={b.id}
                    className="flex flex-col gap-2 rounded-xl bg-zinc-950 px-3 py-2 shadow-sm ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="font-medium text-zinc-100">
                        {new Date(b.start_at).toLocaleDateString("es-AR")} →{" "}
                        {new Date(b.end_at).toLocaleDateString("es-AR")}
                      </div>
                      <div className="text-xs text-zinc-400">
                        {b.reason ?? "Sin motivo"}
                      </div>
                    </div>
                    <form action="/api/admin/blocks/delete" method="post">
                      <input type="hidden" name="id" value={b.id} />
                      <button className="rounded-xl px-3 py-1.5 bg-white/10 hover:bg-white/20">
                        Eliminar
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-3xl bg-zinc-900/80 shadow p-6 ring-1 ring-white/10">
        <div>
          <h2 className="text-xl font-semibold">Turnos</h2>
          <p className="text-sm text-zinc-300">Lista de reservas registradas</p>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-zinc-300">
              <tr>
                <th className="text-left px-4 py-3">Inicio</th>
                <th className="text-left px-4 py-3">Fin</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Origen</th>
              </tr>
            </thead>
            <tbody>
              {appts.map((a) => (
                <tr key={a.id} className="border-t border-white/10">
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
              {appts.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-zinc-400" colSpan={5}>
                    No hay turnos todavía.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white">
      {label}: {value}
    </div>
  );
}
