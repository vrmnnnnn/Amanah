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
  const [type, setType] = useState<"masuk" | "keluar">("keluar");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [memberId, setMemberId] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!session?.user) return;
    supabase
      .from("family_members")
      .select("*")
      .eq("user_id", session.user.id)
      .then(({ data }) => {
        if (data) setMembers(data);
      });
  }, [session]);

  const startListening = async () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Browser tidak mendukung voice input");
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        toast.error("Izin mikrofon ditolak. Buka pengaturan browser.");
      } else if (err.name === "NotFoundError") {
        toast.error("Mikrofon tidak ditemukan di perangkat ini");
      } else {
        toast.error("Gagal akses mikrofon: " + (err.message || "unknown"));
      }
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNote((prev) => (prev ? prev + " " + transcript : transcript));
      toast.success("Teks direkam!");
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Izin mikrofon ditolak.");
      } else if (event.error === "no-speech") {
        toast.error("Tidak ada suara terdeteksi.");
      } else {
        toast.error("Gagal merekam: " + (event.error || "unknown"));
      }
      setListening(false);
    };

    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !session?.user) return;

    const { error } = await supabase.from("transactions").insert({
      user_id: session.user.id,
      member_id: memberId || undefined,
      type,
      amount: parseFloat(amount),
      category: category || "lainnya",
      note,
    });

    if (error) {
      toast.error("Gagal menyimpan: " + error.message);
    } else {
      toast.success("Transaksi tersimpan!");
      setAmount("");
      setCategory("");
      setNote("");
    }
  };

  return (
    <div className="min-h-dvh pb-24" style={{ background: "var(--bg)" }}>
      <div className="px-5 pt-10">
        {/* Header */}
        <h1 className="text-2xl font-bold text-center tracking-heading" style={{ color: "var(--text)" }}>
          Catat Transaksi
        </h1>
        <p className="text-[13px] text-center mt-1" style={{ color: "var(--text-muted)" }}>
          {type === "keluar" ? "Pengeluaran" : "Pemasukan"}
        </p>

        {/* Form card */}
        <div className="card-layered mt-5 p-5">
          {/* Type toggle */}
          <div className="flex rounded-xl p-1 gap-1 mb-5" style={{ background: "var(--surface-hover)" }}>
            <button
              type="button"
              onClick={() => setType("keluar")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-sm font-semibold transition-all duration-200 ${
                type === "keluar"
                  ? "bg-white text-red-500 shadow-sm dark:bg-[var(--surface)]"
                  : ""
              }`}
              style={type !== "keluar" ? { color: "var(--text-muted)" } : {}}
            >
              <ArrowUpFromLine size={16} />
              Keluar
            </button>
            <button
              type="button"
              onClick={() => setType("masuk")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-sm font-semibold transition-all duration-200 ${
                type === "masuk"
                  ? "bg-white text-[var(--green)] shadow-sm dark:bg-[var(--surface)]"
                  : ""
              }`}
              style={type !== "masuk" ? { color: "var(--text-muted)" } : {}}
            >
              <ArrowDownToLine size={16} />
              Masuk
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                Jumlah
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-semibold" style={{ color: "var(--text-muted)" }}>
                  Rp
                </span>
                <Input
                  type="number"
                  placeholder="50.000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="h-12 pl-10 rounded-xl text-lg font-semibold focus:border-[var(--gold)] focus:ring-[var(--gold)]/20"
                  style={{ borderColor: "var(--border)", background: "var(--bg)" }}
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                Kategori
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12 rounded-xl" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="makan">Makan</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="belanja">Belanja</SelectItem>
                  <SelectItem value="tagihan">Tagihan</SelectItem>
                  <SelectItem value="gaji">Gaji</SelectItem>
                  <SelectItem value="lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Anggota */}
            {members.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                  Anggota
                </Label>
                <Select value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger className="h-12 rounded-xl" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                    <SelectValue placeholder="Semua anggota" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua anggota</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Note + Voice */}
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                Catatan
              </Label>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Beli sayur di pasar..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="flex-1 rounded-xl resize-none"
                  style={{ borderColor: "var(--border)", background: "var(--bg)" }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant={listening ? "destructive" : "outline"}
                  className={`shrink-0 size-12 rounded-xl transition-all duration-200 ${
                    listening
                      ? "bg-red-500 hover:bg-red-600 border-0 text-white animate-pulse-ring"
                      : ""
                  }`}
                  style={!listening ? { borderColor: "var(--border)" } : {}}
                  onClick={() =>
                    listening ? stopListening() : startListening()
                  }
                >
                  {listening ? (
                    <MicOff size={20} />
                  ) : (
                    <Mic size={20} style={{ color: "var(--text-muted)" }} />
                  )}
                </Button>
              </div>
              {listening && (
                <p className="text-xs text-red-500 animate-pulse flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-red-500" />
                  Mendengarkan...
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-[var(--navy)] hover:bg-[var(--navy)]/90 text-[15px] font-semibold tracking-tight mt-2"
            >
              <Save size={17} className="mr-2" />
              Simpan
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
