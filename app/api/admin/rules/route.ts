import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    const url = new URL("/admin", req.url);
    url.hash = "horarios";
    url.searchParams.set(
      "error",
      "Faltan variables de entorno de Supabase para guardar horarios."
    );
    return NextResponse.redirect(url);
  }

  const form = await req.formData();
  const day_of_week = Number(form.get("day_of_week"));
  const start_time = String(form.get("start_time") || "");
  const end_time = String(form.get("end_time") || "");

  if (!day_of_week || !start_time || !end_time) {
    const url = new URL("/admin", req.url);
    url.hash = "horarios";
    url.searchParams.set("error", "Completa todos los campos del horario.");
    return NextResponse.redirect(url);
  }

  const sb = supabaseServer();
  const { data: trainer } = await sb
    .from("trainers")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (!trainer) {
    const url = new URL("/admin", req.url);
    url.hash = "horarios";
    url.searchParams.set(
      "error",
      "No hay entrenador configurado para guardar horarios."
    );
    return NextResponse.redirect(url);
  }

  const { error } = await sb.from("availability_rules").insert({
    trainer_id: trainer.id,
    day_of_week,
    start_time,
    end_time,
  });

  const url = new URL("/admin", req.url);
  url.hash = "horarios";
  if (error) {
    url.searchParams.set("error", "No se pudo guardar el horario.");
  }
  return NextResponse.redirect(url);
}
