import { useState, useRef, useEffect } from "react";
import { useFamily } from "@/lib/family-context";
import TopAppBar from "@/components/TopAppBar";
import SpriteAvatar from "@/components/SpriteAvatar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SAKURA_GREETING = "Halo! Aku Sakura AI, asisten keuangan keluargamu 🌸💖. Tanya apa aja tentang keuangan — budget, tips hemat, rekomendasi, atau cuma iseng aja!";

const SAKURA_RESPONSES: Record<string, string> = {
  hemat: "Tips hemat ala Sakura 🌸💡:\n\n1. \u2022 Catat setiap pengeluaran — seremeh apapun! Sadar itu langkah pertama.\n2. \u2022 Pakai aturan 50-30-20: 50% kebutuhan, 30% keinginan, 20% tabungan.\n3. \u2022 Masak di rumah — hemat 50-70% dibanding makan di luar!\n4. \u2022 Bandingkan harga sebelum belanja online.\n5. \u2022 Tunda pembelian impulsif 24 jam — seringkali kamu lupa setelahnya!",
  budget: "Budget bulanan yang sehat ala Sakura 💖:\n\n\u2022 Makan & minum: 30-40%\n\u2022 Transport: 10-15%\n\u2022 Tagihan & sewa: 25-35%\n\u2022 Tabungan: minimal 15-20%\n\u2022 Hiburan & lainnya: 10-15%\n\nPastiin tabungan dulu ya, jangan sisa! 😤",
  investasi: "Sakura bilang: investasi itu penting! Tapi mulai dari yang simpel dulu:\n\n1. \u2022 Dana darurat 3-6x pengeluaran bulanan di rekening terpisah.\n2. \u2022 Reksadana pasar uang — aman, likuid, return 4-6%.\n3. \u2022 Emas — hedge inflasi klasik.\n4. \u2022 SBN (Surat Berharga Negara) — dijamin pemerintah.\n\nMulai dari nominal kecil aja, yang penting KONSISTEN! 🌸✨",
  default: "Hmm, Sakura belum ngerti nih... coba tanya soal tips hemat, cara budgeting, atau investasi yuk! Atau curhat aja, Sakura dengerin kok 💖🌸",
};

export default function AIChat() {
  const { family } = useFamily();
  const [messages, setMessages] = useState<Message[]>([
    { id: "0", role: "assistant", content: SAKURA_GREETING },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulate typing
    setTyping(true);
    setTimeout(() => {
      let reply = SAKURA_RESPONSES.default;

      const lower = text.toLowerCase();
      if (lower.includes("hemat") || lower.includes("tips")) reply = SAKURA_RESPONSES.hemat;
      else if (lower.includes("budget") || lower.includes("anggar")) reply = SAKURA_RESPONSES.budget;
      else if (lower.includes("invest") || lower.includes("saham") || lower.includes("emas")) reply = SAKURA_RESPONSES.investasi;
      else if (lower.includes("hai") || lower.includes("halo") || lower.includes("sakura")) reply = "Hai juga! 🌸💖 Ada yang bisa Sakura bantu soal keuangan hari ini?";

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: reply },
      ]);
      setTyping(false);
    }, 1000 + Math.random() * 1500);
  };

  return (
    <div className="min-h-dvh pb-32 bg-background">
      <TopAppBar title="Sakura AI Chat" showBack />

      <main className="px-5 md:px-10 max-w-4xl mx-auto pt-4">
        {/* Chat container */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-[0_4px_20px_rgba(255,209,220,0.15)] overflow-hidden">
          {/* Chat header */}
          <div className="bg-gradient-to-r from-primary-container to-secondary-container p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center text-2xl border-2 border-white">
              🌸
            </div>
            <div>
              <h3 className="font-bold text-sm text-on-primary-container">Sakura AI</h3>
              <p className="text-[10px] text-on-primary-container/70">Asisten keuangan keluarga</p>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[55vh] overflow-y-auto p-4 space-y-4 bg-pattern-dots">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0 text-sm border border-primary-fixed-dim">
                    🌸
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-surface-container text-on-surface rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <SpriteAvatar initial="K" size="sm" color="var(--primary)" />
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0 text-sm border border-primary-fixed-dim">
                  🌸
                </div>
                <div className="bg-surface-container rounded-lg rounded-bl-none px-4 py-3 flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary-container animate-typing-bounce" style={{ animationDelay: "0s" }} />
                  <div className="w-2 h-2 rounded-full bg-primary-container animate-typing-bounce" style={{ animationDelay: "0.2s" }} />
                  <div className="w-2 h-2 rounded-full bg-primary-container animate-typing-bounce" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-outline-variant/20 bg-surface-container-lowest/50 backdrop-blur-xl">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tanya Sakura sesuatu..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                className="flex-1 h-12 px-5 rounded-full bg-surface-container border border-outline-variant text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-container/50 transition-all placeholder:text-on-surface-variant/40"
              />
              <button
                onClick={send}
                disabled={!input.trim()}
                className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
