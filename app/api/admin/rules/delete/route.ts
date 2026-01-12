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
      "Faltan variables de entorno de Supabase para eliminar horarios."
    );
    return NextResponse.redirect(url);
  }

  const form = await req.formData();
  const id = String(form.get("id") || "");

  if (!id) {
    const url = new URL("/admin", req.url);
    url.hash = "horarios";
    url.searchParams.set("error", "No se encontró el horario a eliminar.");
    return NextResponse.redirect(url);
  }

  const sb = supabaseServer();
  const { error } = await sb.from("availability_rules").delete().eq("id", id);

  const url = new URL("/admin", req.url);
  url.hash = "horarios";
  if (error) {
    url.searchParams.set("error", "No se pudo eliminar el horario.");
  }
  return NextResponse.redirect(url);
}
