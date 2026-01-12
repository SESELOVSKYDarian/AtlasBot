import { NextRequest, NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY no configurada." },
      { status: 500 }
    );
  }

  const body = await req.json();
  const messages = (body?.messages ?? []) as ChatMessage[];

  const systemPrompt =
    "Sos un asistente para un gimnasio. Si el usuario no pregunta por sacar turno, preguntá si quiere reservar. Respuestas cortas, claras y en español.";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: "Fallo al conectar con la IA.", details: errorText },
      { status: 500 }
    );
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content ?? "";

  return NextResponse.json({ reply });
}
