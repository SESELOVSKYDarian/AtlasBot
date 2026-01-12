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

  const change = body?.entry?.[0]?.changes?.[0]?.value;
  const msg = change?.messages?.[0];
  const from = msg?.from; // wa id
  const text = msg?.text?.body?.trim();

  // Siempre responder 200 a Meta (para que no reintente)
  if (!from || !text) return NextResponse.json({ ok: true });

  const sb = supabaseServer();

  // MVP: 1 entrenadora -> tomamos la primera fila
  const { data: trainer, error: trainerErr } = await sb
    .from("trainers")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (trainerErr || !trainer) {
    await sendWhatsAppText(from, "Panel no configurado aún (trainer).");
    return NextResponse.json({ ok: true });
  }

  // Obtener/crear conversación
  const { data: conv } = await sb
    .from("conversations")
    .select("*")
    .eq("trainer_id", trainer.id)
    .eq("phone", from)
    .maybeSingle();

  const state = conv?.state ?? "idle";
  const ctx = (conv?.context ?? {}) as any;

  // 1) Si está eligiendo slot y responde 1/2/3 -> reservar
  if (state === "choosing_slot" && ["1", "2", "3"].includes(text)) {
    const idx = Number(text) - 1;
    const slot = ctx?.options?.[idx]; // { start_at, end_at, label }
    if (!slot?.start_at || !slot?.end_at) {
      await sendWhatsAppText(from, "No encontré esa opción. Escribí “turno” para ver horarios.");
      return NextResponse.json({ ok: true });
    }

    // upsert cliente
    const { data: client } = await sb
      .from("clients")
      .upsert({ trainer_id: trainer.id, phone: from }, { onConflict: "trainer_id,phone" })
      .select("*")
      .single();

    // crear turno
    await sb.from("appointments").insert({
      trainer_id: trainer.id,
      client_id: client?.id ?? null,
      start_at: slot.start_at,
      end_at: slot.end_at,
      status: "confirmed",
      source: "whatsapp",
    });

    // reset conversación
    await sb.from("conversations").upsert(
      {
        trainer_id: trainer.id,
        phone: from,
        state: "idle",
        context: {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: "trainer_id,phone" }
    );

    await sendWhatsAppText(from, `✅ Turno confirmado: ${slot.label}\n\nSi querés otro, escribí “turno”.`);
    return NextResponse.json({ ok: true });
  }

  // 2) Si pide turno -> calcular 3 opciones reales
  const lower = text.toLowerCase();
  const wantsTurn = lower.includes("turno") || lower.includes("cita") || lower.includes("reserv");

  if (wantsTurn) {
    const options = await getAvailableSlots(sb, trainer.id, {
      daysAhead: 14,
      durationMin: 60,
      stepMin: 60,
      maxOptions: 3,
    });

    if (options.length === 0) {
      await sendWhatsAppText(from, "😕 No encontré horarios disponibles en los próximos días.");
      return NextResponse.json({ ok: true });
    }

    // guardar opciones en conversación
    await sb.from("conversations").upsert(
      {
        trainer_id: trainer.id,
        phone: from,
        state: "choosing_slot",
        context: { options },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "trainer_id,phone" }
    );

    const lines = options.map((o: any, i: number) => `${i + 1}) ${o.label}`).join("\n");
    await sendWhatsAppText(from, `Genial 😊\nElegí una opción:\n\n${lines}\n\nRespondé 1, 2 o 3`);
    return NextResponse.json({ ok: true });
  }

  // 3) fallback
  await sendWhatsAppText(from, "Hola 😊 Escribí “turno” para ver horarios disponibles.");
  return NextResponse.json({ ok: true });
}

// =====================
// Disponibilidad real
// =====================
async function getAvailableSlots(
  sb: ReturnType<typeof supabaseServer>,
  trainerId: string,
  cfg: { daysAhead: number; durationMin: number; stepMin: number; maxOptions: number }
) {
  const now = new Date();
  const start = new Date(now);
  start.setSeconds(0, 0);

  const end = new Date(now);
  end.setDate(end.getDate() + cfg.daysAhead);

  // reglas de horario
  const { data: rules = [] } = await sb
    .from("availability_rules")
    .select("*")
    .eq("trainer_id", trainerId);

  // bloqueos
  const { data: blocks = [] } = await sb
    .from("blocks")
    .select("*")
    .eq("trainer_id", trainerId)
    .gte("end_at", start.toISOString())
    .lte("start_at", end.toISOString());

  // turnos ya ocupados
  const { data: appts = [] } = await sb
    .from("appointments")
    .select("*")
    .eq("trainer_id", trainerId)
    .neq("status", "cancelled")
    .gte("end_at", start.toISOString())
    .lte("start_at", end.toISOString());

  const busyIntervals = [
    ...blocks.map((b: any) => ({ s: new Date(b.start_at), e: new Date(b.end_at) })),
    ...appts.map((a: any) => ({ s: new Date(a.start_at), e: new Date(a.end_at) })),
  ];

  const options: any[] = [];

  for (let d = 0; d <= cfg.daysAhead; d++) {
    const day = new Date(start);
    day.setDate(day.getDate() + d);

    // day_of_week: 1=Lun..7=Dom
    const js = day.getDay(); // 0=Dom..6=Sab
    const dow = js === 0 ? 7 : js;

    const dayRules = rules.filter((r: any) => r.day_of_week === dow);
    if (dayRules.length === 0) continue;

    for (const r of dayRules) {
      const [sh, sm] = String(r.start_time).split(":").map(Number);
      const [eh, em] = String(r.end_time).split(":").map(Number);

      const windowStart = new Date(day);
      windowStart.setHours(sh, sm, 0, 0);

      const windowEnd = new Date(day);
      windowEnd.setHours(eh, em, 0, 0);

      for (
        let t = new Date(windowStart);
        t.getTime() + cfg.durationMin * 60000 <= windowEnd.getTime();
        t = new Date(t.getTime() + cfg.stepMin * 60000)
      ) {
        if (t < start) continue;

        const tEnd = new Date(t.getTime() + cfg.durationMin * 60000);

        const overlaps = busyIntervals.some(({ s, e }) => t < e && tEnd > s);
        if (overlaps) continue;

        const label = formatLabel(t);
        options.push({ start_at: t.toISOString(), end_at: tEnd.toISOString(), label });

        if (options.length >= cfg.maxOptions) return options;
      }
    }
  }
  return options;
}

function formatLabel(dt: Date) {
  // Formato simple (podés cambiarlo después)
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const d = days[dt.getDay()];
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const mi = String(dt.getMinutes()).padStart(2, "0");
  return `${d} ${dd}/${mm} ${hh}:${mi}`;
}

// =====================
// Enviar WhatsApp
// =====================
async function sendWhatsAppText(to: string, body: string) {
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID!;
  const token = process.env.META_ACCESS_TOKEN!;
  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

  await fetch(url, {
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
}
