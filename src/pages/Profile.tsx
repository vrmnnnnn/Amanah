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
} from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import { useFamily } from "@/lib/family-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import TopAppBar from "@/components/TopAppBar";
import GlassCard from "@/components/GlassCard";

const BUDGET_KEY = "amanah-budget";

export default function Profile() {
  const { data: session } = authClient.useSession();
  const { family, me, members } = useFamily();
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [budget, setBudget] = useState("");
  const [savedBudget, setSavedBudget] = useState<number | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);

  // Edit profile state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(BUDGET_KEY);
    if (stored) setSavedBudget(Number(stored));
  }, []);

  useEffect(() => {
    if (editOpen) {
      const name = me?.role || session?.user?.user_metadata?.name || "";
      setEditName(name);
    }
  }, [editOpen, me, session]);

  const handleSaveName = async () => {
    if (!editName.trim()) {
      toast.error("Nama tidak boleh kosong");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: editName.trim() },
      });
      if (error) throw error;
      toast.success("Nama berhasil diperbarui");
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Gagal menyimpan nama");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authClient.signOut();
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
    if (!family) return;
    const { data: t } = await supabase
      .from("transactions")
      .select("*, member_id(id, role)")
      .eq("family_id", family.id)
      .order("created_at", { ascending: false });

    if (!t || t.length === 0) {
      toast.error("Belum ada transaksi untuk diexport");
      return;
    }

    const header = "Tanggal,Tipe,Jumlah,Kategori,Catatan,Anggota";
    const rows = t.map((tx: any) => {
      const date = new Date(tx.created_at).toLocaleDateString("id-ID");
      const role = tx.member_id?.role || "";
      return `${date},${tx.type},${tx.amount},${tx.category},"${tx.note || ""}",${role}`;
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

  const displayName = me?.role || session?.user?.user_metadata?.name || session?.user?.email?.split("@")[0] || "Kamu";
  const userEmail = session?.user?.email ?? "—";
  const provider = (session?.user?.app_metadata?.provider as string) || "email";

  return (
    <div className="min-h-dvh pb-32 bg-background">
      <TopAppBar title="Profil" showBack />

      <main className="px-5 md:px-10 max-w-xl mx-auto pt-4 space-y-4">
        {/* Profile Header */}
        <GlassCard className="p-6">
          <div className="flex flex-col items-center text-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-primary-container flex items-center justify-center text-3xl font-bold bg-gradient-to-br from-primary-container to-secondary-container text-on-primary-container overflow-hidden">
                <img
                  alt=""
                  className="w-full h-full object-cover"
                  src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${userEmail}&backgroundColor=ffd1dc`}
                />
              </div>
              <button
                onClick={() => setEditOpen(true)}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs border-2 border-white shadow-sm hover:scale-110 transition-transform"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            </div>

            {/* Name & Role */}
            <div>
              <h2 className="text-lg font-bold text-on-surface">{displayName}</h2>
              <p className="text-sm text-on-surface-variant mt-0.5">
                {me?.role || "Anggota"}
              </p>
            </div>

            {/* Family badge */}
            {family && (
              <button
                onClick={() => navigate("/anggota")}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-container text-on-tertiary-container text-xs font-semibold hover:scale-105 transition-transform"
              >
                <span className="material-symbols-outlined text-sm">group</span>
                {family.name} · {members.length} anggota
              </button>
            )}
          </div>
        </GlassCard>

        {/* Information Cards */}
        <div className="space-y-2">
          {/* Email */}
          <GlassCard className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tertiary-container/60 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-tertiary-container">mail</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant/60">
                Email
              </p>
              <p className="font-medium text-sm text-on-surface truncate">{userEmail}</p>
            </div>
          </GlassCard>

          {/* Auth Provider */}
          <GlassCard className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tertiary-container/60 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-tertiary-container">shield</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant/60">
                Login via
              </p>
              <p className="font-medium text-sm text-on-surface capitalize">{provider}</p>
            </div>
          </GlassCard>
        </div>

        {/* Settings */}
        <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider px-1 pt-2">
          Pengaturan
        </h3>

        <div className="space-y-2">
          {/* Edit Profile */}
          <GlassCard
            className="p-4 flex items-center gap-3 cursor-pointer hover:scale-[1.02] transition-all"
            onClick={() => setEditOpen(true)}
          >
            <div className="w-10 h-10 rounded-xl bg-primary-container/60 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary">person_edit</span>
            </div>
            <div>
              <p className="font-medium text-sm text-on-surface">Edit Profil</p>
              <p className="text-xs text-on-surface-variant">Ubah nama tampilan</p>
            </div>
            <span className="ml-auto material-symbols-outlined text-on-surface-variant/40">chevron_right</span>
          </GlassCard>

          {/* Kelola Anggota */}
          <GlassCard
            className="p-4 flex items-center gap-3 cursor-pointer hover:scale-[1.02] transition-all"
            onClick={() => navigate("/anggota")}
          >
            <div className="w-10 h-10 rounded-xl bg-tertiary-container/60 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-tertiary-container">group</span>
            </div>
            <div>
              <p className="font-medium text-sm text-on-surface">Kelola Anggota</p>
              <p className="text-xs text-on-surface-variant">
                {family ? `${members.length} anggota di ${family.name}` : "Atur anggota keluarga"}
              </p>
            </div>
            <span className="ml-auto material-symbols-outlined text-on-surface-variant/40">chevron_right</span>
          </GlassCard>

          {/* Theme */}
          <GlassCard className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container/60 flex items-center justify-center shrink-0">
                {mounted && resolvedTheme === "dark" ? (
                  <span className="material-symbols-outlined text-primary">dark_mode</span>
                ) : (
                  <span className="material-symbols-outlined text-amber-500">light_mode</span>
                )}
              </div>
              <div>
                <p className="font-medium text-sm text-on-surface">Tampilan</p>
                <p className="text-xs text-on-surface-variant">
                  {mounted ? (resolvedTheme === "dark" ? "Gelap" : "Terang") : "..."}
                </p>
              </div>
            </div>
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="relative w-12 h-7 rounded-full transition-all duration-300 bg-surface-container-highest border border-outline-variant"
              >
                <span
                  className="absolute top-0.5 size-6 rounded-full bg-primary shadow-sm transition-transform duration-300 flex items-center justify-center"
                  style={{
                    transform: resolvedTheme === "dark" ? "translateX(22px)" : "translateX(0.5px)",
                  }}
                >
                  {resolvedTheme === "dark" ? (
                    <span className="material-symbols-outlined text-sm text-primary-foreground">dark_mode</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm text-primary-foreground">light_mode</span>
                  )}
                </span>
              </button>
            )}
          </GlassCard>

          {/* Budget */}
          <GlassCard className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-tertiary-container/60 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-amber-600">savings</span>
              </div>
              <div>
                <p className="font-medium text-sm text-on-surface">Budget Bulanan</p>
                <p className="text-xs text-on-surface-variant">
                  {savedBudget ? `Rp ${savedBudget.toLocaleString("id-ID")}` : "Belum diset"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setBudgetOpen(true)}
              className="h-9 px-4 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:scale-105 transition-all"
            >
              {savedBudget ? "Ubah" : "Atur"}
            </button>
          </GlassCard>

          {/* Export */}
          <GlassCard
            className="p-4 flex items-center gap-3 cursor-pointer hover:scale-[1.02] transition-all"
            onClick={exportCSV}
          >
            <div className="w-10 h-10 rounded-xl bg-secondary-container/60 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-secondary">download</span>
            </div>
            <div>
              <p className="font-medium text-sm text-on-surface">Export CSV</p>
              <p className="text-xs text-on-surface-variant">Download riwayat transaksi</p>
            </div>
            <span className="ml-auto material-symbols-outlined text-on-surface-variant/40">chevron_right</span>
          </GlassCard>
        </div>

        {/* Danger Zone */}
        <h3 className="text-sm font-bold text-destructive uppercase tracking-wider px-1 pt-2">
          Akun
        </h3>

        <button
          onClick={() => setLogoutOpen(true)}
          className="w-full p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive font-semibold text-sm flex items-center justify-center gap-2 hover:bg-destructive/20 transition-colors"
        >
          <span className="material-symbols-outlined">logout</span>
          Keluar dari Akun
        </button>

        <p className="text-center text-xs text-on-surface-variant/40 pb-4">
          Amanah · Kindred Bloom
        </p>
      </main>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl p-6 gap-5 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-on-surface">
              Edit Profil
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-on-surface">
                Nama Tampilan
              </Label>
              <Input
                type="text"
                placeholder="Nama kamu"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-12 rounded-xl bg-surface-container border-outline-variant"
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                autoFocus
              />
            </div>
            <div className="text-xs text-on-surface-variant bg-surface-container rounded-xl p-3">
              <span className="material-symbols-outlined text-sm align-middle mr-1.5">info</span>
              Email <strong className="text-on-surface">{userEmail}</strong> tidak dapat diubah.
            </div>
            <Button
              className="w-full h-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              onClick={handleSaveName}
              disabled={saving}
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Budget Dialog */}
      <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
        <DialogContent className="rounded-2xl p-6 gap-5 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-on-surface">
              Atur Budget Bulanan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-on-surface">
                Maksimal pengeluaran per bulan
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-on-surface-variant/60">
                  Rp
                </span>
                <Input
                  type="number"
                  placeholder={savedBudget ? String(savedBudget) : "5.000.000"}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="h-12 pl-10 rounded-xl text-lg font-semibold bg-surface-container border-outline-variant"
                  onKeyDown={(e) => e.key === "Enter" && saveBudget()}
                />
              </div>
            </div>
            <Button
              className="w-full h-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              onClick={saveBudget}
            >
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="rounded-2xl p-6 gap-5 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-on-surface">
              Keluar dari Akun?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-on-surface-variant">
            Kamu akan keluar dari akun ini dan perlu login kembali.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-full border-outline-variant"
              onClick={() => setLogoutOpen(false)}
            >
              Batal
            </Button>
            <Button
              className="flex-1 h-11 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
              onClick={handleLogout}
            >
              Keluar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
