import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const day_of_week = Number(form.get("day_of_week"));
  const start_time = String(form.get("start_time") || "");
  const end_time = String(form.get("end_time") || "");

  const sb = supabaseServer();
  const { data: trainer } = await sb.from("trainers").select("*").limit(1).single();

  await sb.from("availability_rules").insert({
    trainer_id: trainer.id,
    day_of_week,
    start_time,
    end_time,
  });

  return NextResponse.redirect(new URL("/admin/horarios", req.url));
}
