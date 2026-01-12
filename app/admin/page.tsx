import { supabaseServer } from "@/lib/supabase";

export default async function AdminHome() {
  const sb = supabaseServer();
  const { data: trainer } = await sb
    .from("trainers")
    .select("*")
    .limit(1)
    .maybeSingle();

  const trainerId = trainer?.id;
  const [
    { count: countTurnos },
    { count: countBlocks },
    { count: countRules },
  ] = await Promise.all([
    sb
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("trainer_id", trainerId ?? ""),
    sb
      .from("blocks")
      .select("*", { count: "exact", head: true })
      .eq("trainer_id", trainerId ?? ""),
    sb
      .from("availability_rules")
      .select("*", { count: "exact", head: true })
      .eq("trainer_id", trainerId ?? ""),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Inicio</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card title="Turnos" value={String(countTurnos ?? 0)} />
        <Card title="Bloqueos" value={String(countBlocks ?? 0)} />
        <Card title="Horarios" value={String(countRules ?? 0)} />
      </div>

      <div className="rounded-2xl bg-white shadow p-5">
        <h2 className="font-semibold">Checklist antes de WhatsApp</h2>
        <ul className="mt-2 text-sm text-zinc-600 list-disc pl-5 space-y-1">
          <li>Cargar horarios en “Horarios” (ej: Lun–Vie 09-13 y 16-20)</li>
          <li>Cargar bloqueos/vacaciones en “Bloqueos”</li>
          <li>Verificar que la tabla “trainers” tenga 1 fila</li>
        </ul>
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white shadow p-5">
      <div className="text-sm text-zinc-500">{title}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
    </div>
  );
}
