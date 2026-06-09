import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const startListening = async () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Browser tidak mendukung voice input");
      return;
    }

    // Cek permission mikrofon
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        toast.error("Izin mikrofon ditolak. Buka Settings > Site Settings > Microphone");
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
      console.error("Speech error:", event.error, event.message);
      if (event.error === "not-allowed") {
        toast.error("Izin mikrofon ditolak. Cek pengaturan browser.");
      } else if (event.error === "no-speech") {
        toast.error("Tidak ada suara terdeteksi. Coba lagi.");
      } else if (event.error === "audio-capture") {
        toast.error("Mikrofon tidak tersedia.");
      } else if (event.error === "network") {
        toast.error("Butuh koneksi internet untuk voice input.");
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
      toast.success("Tersimpan! 💰");
      setAmount("");
      setCategory("");
      setNote("");
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-emerald-50 to-white pb-20">
      <div className="px-4 pt-8">
        <h1 className="text-2xl font-bold text-emerald-700 text-center">
          ✍️ Catat Transaksi
        </h1>

        <Card className="mt-4 border-0 shadow-sm">
          <CardContent className="p-4">
            {/* Type toggle */}
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant={type === "keluar" ? "destructive" : "outline"}
                className="flex-1"
                onClick={() => setType("keluar")}
              >
                🔴 Keluar
              </Button>
              <Button
                type="button"
                variant={type === "masuk" ? "default" : "outline"}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setType("masuk")}
              >
                🟢 Masuk
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Jumlah (Rp)</Label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="makan">🍔 Makan</SelectItem>
                    <SelectItem value="transport">🚗 Transport</SelectItem>
                    <SelectItem value="belanja">🛒 Belanja</SelectItem>
                    <SelectItem value="tagihan">📄 Tagihan</SelectItem>
                    <SelectItem value="gaji">💼 Gaji</SelectItem>
                    <SelectItem value="lainnya">📦 Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Catatan</Label>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Beli sayur di pasar..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant={listening ? "destructive" : "outline"}
                    size="icon"
                    className="shrink-0"
                    onClick={() => (listening ? stopListening() : startListening())}
                  >
                    🎙️
                  </Button>
                </div>
                {listening && (
                  <p className="text-xs text-red-500 animate-pulse">
                    🔴 Mendengarkan...
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                Simpan
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
