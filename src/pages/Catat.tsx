import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { authClient } from "@/lib/auth-client";
import { useFamily } from "@/lib/family-context";
import { toast } from "sonner";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Mic,
  MicOff,
  Save,
} from "lucide-react";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

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

  // Set default member to self
  useEffect(() => {
    if (me && !memberId) setMemberId(me.id);
  }, [me]);

  // Voice input
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      parseVoiceInput(transcript);
    };

    recognition.onerror = () => {
      setListening(false);
      toast.error("Gagal mendengarkan. Coba lagi.");
    };

    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
  }, []);

  const parseVoiceInput = (text: string) => {
    // Patterns: "keluar 50000 makan", "masuk 100000 gaji"
    const isMasuk = text.includes("masuk");
    const isKeluar = text.includes("keluar");

    if (isMasuk) setType("masuk");
    if (isKeluar) setType("keluar");

    // Extract amount
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

    // Extract category
    const cats = ["makan", "transport", "belanja", "tagihan", "gaji", "lainnya"];
    for (const c of cats) {
      if (text.includes(c)) {
        // Handle "belanja" before "beli" etc.
        if (c === "belanja" && text.includes("belanja")) { setCategory(c); break; }
        if (c !== "belanja" && text.includes(c)) { setCategory(c); break; }
      }
    }

    // Extract note — everything after amount
    const afterAmount = text.replace(amountMatch?.[0] || "", "").replace(/\b(masuk|keluar)\b/g, "").trim();
    if (afterAmount && !cats.includes(afterAmount)) {
      setNote(afterAmount.charAt(0).toUpperCase() + afterAmount.slice(1));
    }
  };

  const toggleMic = () => {
    if (listening) {
      recognitionRef.current?.stop();
    } else {
      setListening(true);
      recognitionRef.current?.start();
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

      toast.success("Transaksi tersimpan!");
      // Reset form
      setAmount("");
      setCategory("");
      setNote("");
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const catsByType =
    type === "masuk"
      ? [
          { value: "gaji", label: "Gaji" },
          { value: "bisnis", label: "Bisnis" },
          { value: "investasi", label: "Investasi" },
          { value: "lainnya", label: "Lainnya" },
        ]
      : [
          { value: "makan", label: "Makan" },
          { value: "transport", label: "Transport" },
          { value: "belanja", label: "Belanja" },
          { value: "tagihan", label: "Tagihan" },
          { value: "lainnya", label: "Lainnya" },
        ];

  return (
    <div className="min-h-dvh pb-24" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="bg-[var(--navy)] text-[#faf9f7] px-5 pt-14 pb-10 rounded-b-[2rem]">
        <h1 className="text-center text-lg font-semibold tracking-tight opacity-80">
          Catat Transaksi
        </h1>
      </div>

      <div className="px-4 -mt-3">
        {/* Type toggle */}
        <div className="flex justify-center mb-5">
          <div className="flex rounded-2xl p-1 gap-0.5 shadow-sm" style={{ background: "var(--surface-hover)" }}>
            <button
              onClick={() => { setType("keluar"); setCategory(""); }}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                type === "keluar" ? "bg-white dark:bg-[var(--surface)] shadow-sm text-red-500" : ""
              }`}
              style={{ color: type === "keluar" ? "#ef4444" : "var(--text-muted)" }}
            >
              <ArrowUpFromLine size={15} />
              Keluar
            </button>
            <button
              onClick={() => { setType("masuk"); setCategory(""); }}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                type === "masuk" ? "bg-white dark:bg-[var(--surface)] shadow-sm text-[var(--green)]" : ""
              }`}
              style={{ color: type === "masuk" ? "var(--green)" : "var(--text-muted)" }}
            >
              <ArrowDownToLine size={15} />
              Masuk
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
              Jumlah (Rp)
            </Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={amount}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                setAmount(raw ? Number(raw).toLocaleString("id-ID") : "");
              }}
              required
              className="h-12 rounded-xl text-lg font-bold"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
              Kategori
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger
                className="h-12 rounded-xl text-[15px]"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {catsByType.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="text-[15px] py-2.5">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Member (from family) */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
              Anggota
            </Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger
                className="h-12 rounded-xl text-[15px]"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                <SelectValue placeholder="Pilih anggota" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-[15px] py-2.5">
                    {m.role} {m.user_id === me?.user_id ? "(Kamu)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
              Catatan
            </Label>
            <Textarea
              placeholder="Opsional"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-xl resize-none h-20"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={toggleMic}
              className={`flex-1 h-12 rounded-xl gap-2 text-[15px] font-semibold ${
                listening ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-500" : ""
              }`}
              style={{
                borderColor: listening ? "transparent" : "var(--border)",
                background: listening ? undefined : "var(--surface)",
              }}
            >
              {listening ? <MicOff size={18} /> : <Mic size={18} />}
              {listening ? "Stop" : "Suara"}
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 h-12 rounded-xl gap-2 text-[15px] font-semibold bg-[var(--navy)] hover:bg-[var(--navy)]/90"
            >
              <Save size={18} />
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
