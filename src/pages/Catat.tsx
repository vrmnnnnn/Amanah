import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { authClient } from "@/lib/auth-client";
import { useFamily } from "@/lib/family-context";
import { toast } from "sonner";
import TopAppBar from "@/components/TopAppBar";
import VoiceButton from "@/components/VoiceButton";
import CategoryChip from "@/components/CategoryChip";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const CAT_ICONS: Record<string, string> = {
  gaji: "stars",
  bisnis: "storefront",
  investasi: "finance",
  makan: "restaurant",
  transport: "directions_car",
  belanja: "shopping_bag",
  tagihan: "bolt",
  lainnya: "category",
};

const CAT_LABELS: Record<string, string> = {
  gaji: "Gaji",
  bisnis: "Bisnis",
  investasi: "Investasi",
  makan: "Makan",
  transport: "Transport",
  belanja: "Belanja",
  tagihan: "Tagihan",
  lainnya: "Lainnya",
};

const CATS_BY_TYPE: Record<string, string[]> = {
  masuk: ["gaji", "bisnis", "investasi", "lainnya"],
  keluar: ["makan", "transport", "belanja", "tagihan", "lainnya"],
};

export default function Catat() {
  const { data: session } = authClient.useSession();
  const { family, me, members } = useFamily();
  const [type, setType] = useState<"masuk" | "keluar">("keluar");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [memberId, setMemberId] = useState("");
  const [saving, setSaving] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (me && !memberId) setMemberId(me.id);
  }, [me]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      recognitionRef.current = null;
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      parseVoiceInput(transcript);
    };
    recognition.onerror = (event: any) => {
      setListening(false);
      const msg =
        event.error === "not-allowed"
          ? "Mikrofon tidak diizinkan. Buka izin mic di pengaturan browser."
          : event.error === "no-speech"
          ? "Tidak ada suara terdeteksi."
          : `Gagal mendengarkan (${event.error}). Coba lagi.`;
      toast.error(msg);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    return () => { try { recognition.abort(); } catch {} };
  }, []);

  const toggleMic = () => {
    const rec = recognitionRef.current;
    if (!rec) {
      toast.error("Browser kamu tidak mendukung input suara. Gunakan Chrome atau Edge.");
      return;
    }
    if (listening) { rec.stop(); return; }
    try {
      rec.start();
      setListening(true);
    } catch (err: any) {
      toast.error(`Gagal mulai mendengarkan: ${err.message || "coba lagi"}`);
      setListening(false);
    }
  };

  const parseVoiceInput = (text: string) => {
    const isMasuk = text.includes("masuk");
    const isKeluar = text.includes("keluar");
    if (isMasuk) setType("masuk");
    if (isKeluar) setType("keluar");
    const amountMatch = text.match(/(\d[\d.]*)\s*(ribu|rb|rbu|jt|juta)?/);
    if (amountMatch) {
      let amt = parseInt(amountMatch[1].replace(/\./g, ""));
      if (amountMatch[2]) {
        const unit = amountMatch[2];
        if (unit === "ribu" || unit === "rb" || unit === "rbu") amt *= 1000;
        if (unit === "jt" || unit === "juta") amt *= 1_000_000;
      }
      setAmount(String(amt));
    }
    const allCats = [...CATS_BY_TYPE.masuk, ...CATS_BY_TYPE.keluar];
    for (const c of allCats) {
      if (text.includes(c)) {
        setCategory(c);
        if (CATS_BY_TYPE.masuk.includes(c)) setType("masuk");
        if (CATS_BY_TYPE.keluar.includes(c) && !CATS_BY_TYPE.masuk.includes(c)) setType("keluar");
        break;
      }
    }
    const afterAmount = text
      .replace(amountMatch?.[0] || "", "")
      .replace(/\b(masuk|keluar)\b/g, "")
      .trim();
    if (afterAmount && !allCats.includes(afterAmount)) {
      setNote(afterAmount.charAt(0).toUpperCase() + afterAmount.slice(1));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user || !family || !me) return;
    if (!amount || !category || !memberId) {
      toast.error("Lengkapi jumlah, kategori, dan anggota");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("transactions").insert({
        family_id: family.id,
        user_id: session.user.id,
        member_id: memberId,
        type,
        amount: Number(amount.replace(/\./g, "")),
        category,
        note: note || null,
      });
      if (error) throw error;
      toast.success("Transaksi tersimpan! 💖");
      setAmount("");
      setCategory("");
      setNote("");
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const rawAmount = amount;
  const amountDisplay = rawAmount
    ? Number(rawAmount).toLocaleString("id-ID")
    : "";

  return (
    <div className="min-h-dvh pb-32 bg-background">
      <TopAppBar title="Catat Transaksi" showBack />

      <main className="px-5 md:px-10 max-w-4xl mx-auto pt-4 space-y-6">
        {/* ── Type Toggle ── */}
        <div className="flex justify-center">
          <div className="bg-surface-container rounded-full p-1 flex gap-0.5 shadow-sm">
            <button
              onClick={() => { setType("keluar"); setCategory(""); }}
              className={`flex items-center gap-1.5 px-6 py-3 rounded-full text-sm font-bold transition-all ${
                type === "keluar"
                  ? "bg-error-container text-on-error-container shadow-sm"
                  : "text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-base">arrow_upward</span>
              Keluar
            </button>
            <button
              onClick={() => { setType("masuk"); setCategory(""); }}
              className={`flex items-center gap-1.5 px-6 py-3 rounded-full text-sm font-bold transition-all ${
                type === "masuk"
                  ? "bg-tertiary-container text-on-tertiary-container shadow-sm"
                  : "text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-base">arrow_downward</span>
              Masuk
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── Amount ── */}
          <div className="glass-card p-6 text-center space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Jumlah (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-1 top-1/2 -translate-y-1/2 text-2xl font-extrabold text-on-surface-variant/30">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amountDisplay}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setAmount(raw);
                }}
                required
                className="w-full bg-transparent text-center text-4xl font-extrabold text-on-surface outline-none border-none placeholder:text-on-surface-variant/20 py-2"
              />
            </div>
            {/* AI sentiment preview */}
            {rawAmount && category && (
              <div className="bg-primary-container/20 rounded-full px-4 py-1.5 inline-flex items-center gap-1.5 mx-auto">
                <span className="text-xs">
                  {type === "masuk" ? "🎉" : "💸"}
                </span>
                <span className="text-[11px] font-semibold text-on-primary-container/70">
                  {type === "masuk" ? "Pemasukan" : "Pengeluaran"} · {CAT_LABELS[category]}
                </span>
              </div>
            )}
          </div>

          {/* ── Category Chips ── */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1">
              Kategori
            </label>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 snap-x">
              {CATS_BY_TYPE[type].map((cat) => (
                <CategoryChip
                  key={cat}
                  label={CAT_LABELS[cat]}
                  icon={CAT_ICONS[cat]}
                  selected={category === cat}
                  onClick={() => setCategory(cat)}
                />
              ))}
            </div>
          </div>

          {/* ── Member ── */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1">
              Anggota
            </label>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 snap-x">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMemberId(m.id)}
                  className={`snap-start flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm border transition-all ${
                    memberId === m.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-surface-container border-outline-variant text-on-surface-variant hover:bg-primary-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">person</span>
                  {m.role} {m.user_id === me?.user_id ? "(Kamu)" : ""}
                </button>
              ))}
            </div>
          </div>

          {/* ── Note ── */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1">
              Catatan
            </label>
            <textarea
              placeholder="Opsional — e.g. beli nasi goreng..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-4 h-20 resize-none text-sm placeholder:text-on-surface-variant/40 outline-none focus:border-primary focus:ring-2 focus:ring-primary-container transition-all"
            />
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex gap-3 pt-2">
            {/* Voice toggle */}
            <button
              type="button"
              onClick={toggleMic}
              className={`flex-1 h-14 rounded-full font-bold text-sm flex items-center justify-center gap-2 border-2 transition-all ${
                listening
                  ? "bg-error-container border-error text-on-error-container animate-pulse-ring"
                  : "bg-surface-container border-outline-variant text-on-surface-variant hover:bg-primary-container hover:border-primary-container hover:text-on-primary-container"
              }`}
            >
              <span className={`material-symbols-outlined ${listening ? "icon-filled" : ""}`}>
                {listening ? "stop" : "mic"}
              </span>
              {listening ? "Stop" : "Suara"}
            </button>

            {/* Save */}
            <button
              type="submit"
              disabled={saving}
              className="flex-[2] h-14 rounded-full font-bold text-sm flex items-center justify-center gap-2 bg-primary text-primary-foreground active:scale-95 transition-all shadow-[0_4px_0_var(--on-primary-fixed-variant)] active:shadow-none active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">check</span>
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
