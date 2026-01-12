import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const start_at = String(form.get("start_at") || "");
  const end_at = String(form.get("end_at") || "");
  const reason = String(form.get("reason") || "");

  const sb = supabaseServer();
  const { data: trainer } = await sb.from("trainers").select("*").limit(1).single();

  await sb.from("blocks").insert({ trainer_id: trainer.id, start_at, end_at, reason });
  return NextResponse.redirect(new URL("/admin/bloqueos", req.url));
}
