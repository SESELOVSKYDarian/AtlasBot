"use client";

import { useMemo, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function AssistantPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hola, soy el asistente de Atlas. Si el usuario no menciona sacar turno, pregunto si quiere reservar.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function sendMessage() {
    if (!canSend) return;
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: input.trim() },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: nextMessages }),
    });

    if (!res.ok) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "No pude conectar con la IA. Revisá la API key y volvé a intentar.",
        },
      ]);
      setLoading(false);
      return;
    }

    const data = await res.json();
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: data.reply ?? "" },
    ]);
    setLoading(false);
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-200">
          Asistente conectado
        </h3>
        <p className="mt-1 text-xs text-zinc-400">
          Este panel simula el comportamiento del chatbot para validar
          respuestas.
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-xs text-zinc-200">
        {messages.map((msg, idx) => (
          <div
            key={`${msg.role}-${idx}`}
            className={
              msg.role === "user"
                ? "self-end rounded-xl bg-white/10 px-3 py-2 text-zinc-100"
                : "self-start rounded-xl bg-zinc-950 px-3 py-2 text-zinc-200"
            }
          >
            {msg.content}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-[80px] rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          placeholder="Escribí un mensaje del usuario..."
        />
        <button
          type="button"
          onClick={sendMessage}
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-60"
          disabled={!canSend}
        >
          {loading ? "Enviando..." : "Enviar al modelo"}
        </button>
      </div>
    </div>
  );
}
