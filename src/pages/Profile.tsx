import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { signOut, useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { LogOut, Mail, ShieldCheck, KeyRound, Moon, Sun, Coins, Download } from "lucide-react";

const BUDGET_KEY = "amanah-budget";

export default function Profile() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [budget, setBudget] = useState("");
  const [savedBudget, setSavedBudget] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(BUDGET_KEY);
    if (stored) setSavedBudget(Number(stored));
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Berhasil keluar");
      navigate("/login", { replace: true });
    } catch {
      toast.error("Gagal keluar");
    }
  };

  const saveBudget = () => {
    const val = parseFloat(budget);
    if (isNaN(val) || val <= 0) {
      toast.error("Masukkan angka yang valid");
      return;
    }
    localStorage.setItem(BUDGET_KEY, String(val));
    setSavedBudget(val);
    setBudget("");
    setBudgetOpen(false);
    toast.success(`Budget Rp ${val.toLocaleString("id-ID")} disimpan`);
  };

  const exportCSV = async () => {
    const { supabase } = await import("@/lib/supabase");
    const { data: t } = await supabase
      .from("transactions")
      .select("*, family_members(name)")
      .eq("user_id", session?.user?.id)
      .order("created_at", { ascending: false });
    if (!t || t.length === 0) {
      toast.error("Belum ada transaksi untuk diexport");
      return;
    }
    const header = "Tanggal,Tipe,Jumlah,Kategori,Catatan,Anggota";
    const rows = t.map((tx: any) => {
      const date = new Date(tx.created_at).toLocaleDateString("id-ID");
      const name = tx.family_members?.name || "";
      return `${date},${tx.type},${tx.amount},${tx.category},"${tx.note || ""}",${name}`;
    });
    const csv = "\uFEFF" + header + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `amanah-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV terdownload!");
  };

  return (
    <div className="min-h-dvh pb-24" style={{ background: "var(--bg)" }}>
      {/* Navy header */}
      <div className="bg-[var(--navy)] text-[#faf9f7] px-5 pt-14 pb-10 rounded-b-[2rem]">
        <h1 className="text-xl font-bold tracking-heading text-center">
          Profil
        </h1>
        <div className="flex justify-center mt-5">
          <div className="size-16 rounded-full bg-white/[0.10] flex items-center justify-center text-2xl font-bold text-[#faf9f7]/80">
            {session?.user?.email?.[0]?.toUpperCase() || "?"}
          </div>
        </div>
        <p className="text-center text-sm text-[var(--navy-light)] mt-2">
          {session?.user?.email || "—"}
        </p>
      </div>

      {/* Info cards */}
      <div className="px-5 mt-6 space-y-2.5">
        <div className="card-layered p-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--surface-hover)" }}>
              <Mail size={18} style={{ color: "var(--text)" }} className="opacity-50" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
                Email
              </p>
              <p className="font-medium text-sm truncate" style={{ color: "var(--text)" }}>
                {session?.user?.email ?? "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="card-layered p-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--surface-hover)" }}>
              <ShieldCheck size={18} style={{ color: "var(--text)" }} className="opacity-50" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
                Provider
              </p>
              <p className="font-medium text-sm capitalize" style={{ color: "var(--text)" }}>
                {session?.user?.app_metadata?.provider ?? "email"}
              </p>
            </div>
          </div>
        </div>

        {/* Theme toggle */}
        <div className="card-layered p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--surface-hover)" }}>
                {mounted && resolvedTheme === "dark" ? (
                  <Moon size={18} style={{ color: "var(--gold)" }} />
                ) : (
                  <Sun size={18} style={{ color: "var(--gold)" }} />
                )}
              </div>
              <div>
                <p className="font-medium text-sm" style={{ color: "var(--text)" }}>
                  Tampilan
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {mounted ? (resolvedTheme === "dark" ? "Gelap" : "Terang") : "..."}
                </p>
              </div>
            </div>
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${
                  resolvedTheme === "dark" ? "bg-[var(--navy)]" : "bg-[var(--border)]"
                }`}
              >
                <span
                  className={`absolute top-0.5 size-6 rounded-full bg-white shadow-sm transition-transform duration-300 flex items-center justify-center ${
                    resolvedTheme === "dark" ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                >
                  {resolvedTheme === "dark" ? (
                    <Moon size={12} className="text-[var(--navy)]" />
                  ) : (
                    <Sun size={12} className="text-[var(--gold)]" />
                  )}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Budget */}
        <div className="card-layered p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--surface-hover)" }}>
                <Coins size={18} style={{ color: "var(--gold)" }} />
              </div>
              <div>
                <p className="font-medium text-sm" style={{ color: "var(--text)" }}>
                  Budget Bulanan
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {savedBudget ? `Rp ${savedBudget.toLocaleString("id-ID")}` : "Belum diset"}
                </p>
              </div>
            </div>
            <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs">
                  {savedBudget ? "Ubah" : "Atur"}
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl p-6 gap-5">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold tracking-heading" style={{ color: "var(--text)" }}>
                    Atur Budget Bulanan
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                      Maksimal pengeluaran per bulan
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-semibold" style={{ color: "var(--text-muted)" }}>
                        Rp
                      </span>
                      <Input
                        type="number"
                        placeholder={savedBudget ? String(savedBudget) : "5.000.000"}
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="h-12 pl-10 rounded-xl text-lg font-semibold"
                        style={{ borderColor: "var(--border)", background: "var(--bg)" }}
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full h-11 rounded-xl bg-[var(--navy)] hover:bg-[var(--navy)]/90 text-[15px] font-semibold tracking-tight"
                    onClick={saveBudget}
                  >
                    Simpan
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Export */}
        <div className="card-layered p-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={exportCSV}>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--surface-hover)" }}>
              <Download size={18} style={{ color: "var(--green)" }} />
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: "var(--text)" }}>
                Export CSV
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Download riwayat transaksi
              </p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="destructive"
          className="w-full mt-4 h-12 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border-0 text-[15px] font-semibold tracking-tight dark:bg-red-950 dark:hover:bg-red-900 dark:text-red-400"
          onClick={handleLogout}
        >
          <LogOut size={17} className="mr-2" />
          Keluar
        </Button>
      </div>
    </div>
  );
}
