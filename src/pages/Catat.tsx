import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { authClient } from "@/lib/auth-client";
import { useFamily, getMemberDisplayName } from "@/lib/family-context";
import { useCategories } from "@/lib/categories";
import { useAccounts } from "@/lib/accounts";
import { toast } from "sonner";
import TopAppBar from "@/components/TopAppBar";
import CategoryChip from "@/components/CategoryChip";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function Catat() {
  const { data: session } = authClient.useSession();
  const { family, me, members } = useFamily();
  const { getByType, getIcon, getLabel, all: allCategories } = useCategories(family?.id);
  const { accounts } = useAccounts(family?.id);
  const [type, setType] = useState<"masuk" | "keluar">("keluar");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [memberId, setMemberId] = useState("");
  const [accountId, setAccountId] = useState<number | null>(null);
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
    for (const c of allCategories) {
      if (text.includes(c.key)) {
        setCategory(c.key);
        if (c.type === "masuk") setType("masuk");
        else if (c.type === "keluar") setType("keluar");
        break;
      }
    }
    const afterAmount = text
      .replace(amountMatch?.[0] || "", "")
      .replace(/\b(masuk|keluar)\b/g, "")
      .trim();
    if (afterAmount && !allCategories.find((c) => c.key === afterAmount)) {
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
        account_id: accountId,
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

  const currentCats = getByType(type);

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
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1">
              Jumlah
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-on-surface-variant/40">
                Rp
              </span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-16 pl-10 pr-4 rounded-2xl bg-surface-container-lowest border border-outline-variant text-3xl font-extrabold text-on-surface tracking-tight outline-none focus:border-primary focus:ring-2 focus:ring-primary-container transition-all placeholder:text-on-surface-variant/20"
              />
            </div>
          </div>

          {/* AI sentiment preview */}
          {amount && category && (
            <div className="bg-primary-container/20 rounded-full px-4 py-1.5 inline-flex items-center gap-1.5 mx-auto">
              <span className="text-xs">
                {type === "masuk" ? "🎉" : "💸"}
              </span>
              <span className="text-[11px] font-semibold text-on-primary-container/70">
                {type === "masuk" ? "Pemasukan" : "Pengeluaran"} · {getLabel(category)}
              </span>
            </div>
          )}

          {/* ── Category Chips ── */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1">
              Kategori
            </label>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 snap-x">
              {currentCats.map((cat) => (
                <CategoryChip
                  key={cat.key}
                  label={cat.label}
                  icon={cat.icon}
                  selected={category === cat.key}
                  onClick={() => setCategory(cat.key)}
                />
              ))}
            </div>
          </div>

          {/* ── Account ── */}
          {accounts.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1">
                Akun
              </label>
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 snap-x">
                <button
                  type="button"
                  onClick={() => setAccountId(null)}
                  className={`snap-start flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm border transition-all ${
                    accountId === null
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-surface-container border-outline-variant text-on-surface-variant hover:bg-primary-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">all_inclusive</span>
                  Semua
                </button>
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setAccountId(acc.id)}
                    className={`snap-start flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm border transition-all ${
                      accountId === acc.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-surface-container border-outline-variant text-on-surface-variant hover:bg-primary-container"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {acc.type === "tunai" ? "payments" : acc.type === "bank" ? "account_balance" : "phone_android"}
                    </span>
                    {acc.name}
                  </button>
                ))}
              </div>
            </div>
          )}

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
                  {getMemberDisplayName(m)} {m.user_id === me?.user_id ? "(Kamu)" : ""}
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
