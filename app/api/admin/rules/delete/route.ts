import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const id = String(form.get("id") || "");
  const sb = supabaseServer();
  await sb.from("availability_rules").delete().eq("id", id);
  return NextResponse.redirect(new URL("/admin/horarios", req.url));
}
