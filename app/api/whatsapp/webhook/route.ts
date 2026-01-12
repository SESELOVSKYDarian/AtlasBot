import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Extraer texto y teléfono (estructura típica de Cloud API)
  const change = body?.entry?.[0]?.changes?.[0]?.value;
  const msg = change?.messages?.[0];
  const from = msg?.from; // telefono (wa id)
  const text = msg?.text?.body;

  if (!from || !text) return NextResponse.json({ ok: true });

  // MVP: asumimos 1 entrenadora (primer trainer)
  const sb = supabaseServer();
  const { data: trainer } = await sb.from("trainers").select("*").limit(1).single();

  if (!trainer) {
    return NextResponse.json({ ok: true });
  }

  // Router simple: si pide turno -> ofrecer opciones, si no -> mensaje genérico
  const lower = text.toLowerCase();
  if (lower.includes("turno") || lower.includes("cita") || lower.includes("reserv")) {
    // 1) buscar/crear conversación
    await sb.from("conversations").upsert({
      trainer_id: trainer.id,
      phone: from,
      state: "choosing_slot",
      context: {}
    });

    // 2) calcular 3 slots (por ahora placeholder)
    const reply = `Genial 😊\nOpciones:\n1) Mañana 10:00\n2) Mañana 11:00\n3) Pasado 09:00\n\nRespondé 1, 2 o 3`;

    await sendWhatsAppText(from, reply);
    return NextResponse.json({ ok: true });
  }

  // Respuesta default (luego lo conectamos a RAG)
  await sendWhatsAppText(from, "Hola 😊 ¿Querés pedir un turno o consultar info?");
  return NextResponse.json({ ok: true });
}

async function sendWhatsAppText(to: string, body: string) {
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID!;
  const token = process.env.META_ACCESS_TOKEN!;
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });

  // No rompas el webhook por errores de envío
  if (!res.ok) {
    // podrías loguear en DB
  }
}
