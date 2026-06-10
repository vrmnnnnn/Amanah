import { useEffect, useRef, useState } from "react";
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
import { useCategories } from "@/lib/categories";
import { useAccounts } from "@/lib/accounts";
import type { Category } from "@/lib/categories";
import type { Account } from "@/lib/accounts";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import TopAppBar from "@/components/TopAppBar";
import GlassCard from "@/components/GlassCard";

const BUDGET_KEY = "amanah-budget";

export default function Profile() {
  const { data: session } = authClient.useSession();
  const { family, me, members, refresh } = useFamily();
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [budget, setBudget] = useState("");
  const [savedBudget, setSavedBudget] = useState<number | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [accOpen, setAccOpen] = useState(false);

  // Edit profile state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  // Avatar upload state
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories
  const { all: allCats, custom, addCategory, removeCategory } = useCategories(family?.id);
  const { accounts, addAccount, deleteAccount } = useAccounts(family?.id);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("category");
  const [newCatType, setNewCatType] = useState<"masuk" | "keluar">("keluar");
  const [newAccName, setNewAccName] = useState("");
  const [newAccType, setNewAccType] = useState<Account["type"]>("tunai");

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(BUDGET_KEY);
    if (stored) setSavedBudget(Number(stored));
  }, []);

  useEffect(() => {
    if (editOpen) {
      // Prioritaskan user_metadata.name, fallback ke role keluarga
      const name = session?.user?.user_metadata?.name || me?.role || "";
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
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || "Gagal menyimpan nama");
    } finally {
      setSaving(false);
    }
  };

  /** Resize image client-side to target max KB */
  const resizeImage = (file: File, maxKB: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Start with 400x400 max dimensions
        let w = img.width;
        let h = img.height;
        const MAX_DIM = 400;
        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) { h = Math.round(h * MAX_DIM / w); w = MAX_DIM; }
          else { w = Math.round(w * MAX_DIM / h); h = MAX_DIM; }
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);

        // Try decreasing quality until < maxKB
        const tryQuality = (q: number) => {
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error("Gagal resize gambar"));
            if (blob.size <= maxKB * 1024 || q <= 0.2) return resolve(blob);
            tryQuality(q - 0.1);
          }, "image/jpeg", q);
        };
        tryQuality(0.85);
      };
      img.onerror = () => reject(new Error("Gagal membaca gambar"));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG, PNG, WebP)");
      return;
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 2MB");
      return;
    }

    setUploading(true);
    try {
      // Resize to <300KB
      const resized = await resizeImage(file, 300);
      const userId = session.user.id;
      const path = `${userId}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, resized, { upsert: true, contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      const avatarUrl = urlData.publicUrl;

      // Save to user metadata
      await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl },
      });

      await refresh();
      toast.success("Foto profil berhasil diperbarui");
    } catch (err: any) {
      toast.error(err?.message || "Gagal upload foto");
    } finally {
      setUploading(false);
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

  const handleAddCategory = () => {
    const name = newCatName.trim();
    if (!name) { toast.error("Isi nama kategori"); return; }
    const key = name.toLowerCase().replace(/\s+/g, "_");
    if (allCats.find((c) => c.key === key)) {
      toast.error("Kategori sudah ada");
      return;
    }
    addCategory({ key, label: name, icon: newCatIcon, type: newCatType });
    setNewCatName("");
    setNewCatIcon("category");
    toast.success(`Kategori "${name}" ditambahkan`);
  };

  const handleAddAccount = () => {
    const name = newAccName.trim();
    if (!name) { toast.error("Isi nama akun"); return; }
    addAccount(name, newAccType);
    setNewAccName("");
    toast.success(`Akun "${name}" ditambahkan`);
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

  // Display name: user_metadata.name > role keluarga > email prefix > fallback
  const displayName =
    session?.user?.user_metadata?.name ||
    me?.role ||
    session?.user?.email?.split("@")[0] ||
    "Kamu";

  const userEmail = session?.user?.email ?? "—";
  const provider = (session?.user?.app_metadata?.provider as string) || "email";

  // Avatar: uploaded > DiceBear fallback
  const avatarUrl =
    session?.user?.user_metadata?.avatar_url ||
    `https://api.dicebear.com/9.x/thumbs/svg?seed=${userEmail}&backgroundColor=ffd1dc`;

  return (
    <div className="min-h-dvh pb-32 bg-background">
      <TopAppBar title="Profil" showBack />

      {/* Hidden file input for avatar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleAvatarUpload}
      />

      <main className="px-5 md:px-10 max-w-xl mx-auto pt-4 space-y-4">
        {/* Profile Header */}
        <GlassCard className="p-6">
          <div className="flex flex-col items-center text-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-20 h-20 rounded-full border-4 border-primary-container flex items-center justify-center text-3xl font-bold bg-gradient-to-br from-primary-container to-secondary-container text-on-primary-container overflow-hidden hover:opacity-90 transition-all disabled:opacity-60"
              >
                {uploading ? (
                  <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                ) : (
                  <img
                    alt=""
                    className="w-full h-full object-cover"
                    src={avatarUrl}
                  />
                )}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs border-2 border-white shadow-sm hover:scale-110 transition-transform disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-sm">photo_camera</span>
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

          {/* Ganti Foto */}
          <GlassCard
            className="p-4 flex items-center gap-3 cursor-pointer hover:scale-[1.02] transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-10 h-10 rounded-xl bg-secondary-container/60 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-secondary">photo_camera</span>
            </div>
            <div>
              <p className="font-medium text-sm text-on-surface">Ganti Foto Profil</p>
              <p className="text-xs text-on-surface-variant">
                {session?.user?.user_metadata?.avatar_url
                  ? "Foto sudah diatur"
                  : "Upload foto dari galeri"}
              </p>
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
                <span className="material-symbols-outlined text-amber-600">spa</span>
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

          {/* Kelola Kategori */}
          <GlassCard
            className="p-4 flex items-center gap-3 cursor-pointer hover:scale-[1.02] transition-all"
            onClick={() => setCatOpen(true)}
          >
            <div className="w-10 h-10 rounded-xl bg-primary-container/60 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary">category</span>
            </div>
            <div>
              <p className="font-medium text-sm text-on-surface">Kelola Kategori</p>
              <p className="text-xs text-on-surface-variant">
                {custom.length} kategori kustom · {allCats.length} total
              </p>
            </div>
            <span className="ml-auto material-symbols-outlined text-on-surface-variant/40">chevron_right</span>
          </GlassCard>

          {/* Kelola Akun */}
          <GlassCard
            className="p-4 flex items-center gap-3 cursor-pointer hover:scale-[1.02] transition-all"
            onClick={() => setAccOpen(true)}
          >
            <div className="w-10 h-10 rounded-xl bg-tertiary-container/60 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-tertiary">account_balance_wallet</span>
            </div>
            <div>
              <p className="font-medium text-sm text-on-surface">Kelola Akun</p>
              <p className="text-xs text-on-surface-variant">
                {accounts.length} akun · tunai, bank, e-wallet
              </p>
            </div>
            <span className="ml-auto material-symbols-outlined text-on-surface-variant/40">chevron_right</span>
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

      {/* Category Management Dialog */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="rounded-2xl p-6 gap-5 max-w-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-on-surface">
              Kelola Kategori
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Built-in categories */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 mb-2">
                Bawaan
              </p>
              <div className="space-y-1.5">
                {allCats.filter(c => c.builtin).map((c) => (
                  <div key={c.key} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-container/50">
                    <span className="material-symbols-outlined text-base text-on-surface-variant">{c.icon}</span>
                    <span className="text-sm font-medium text-on-surface">{c.label}</span>
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-outline-variant/20 text-on-surface-variant/60">
                      {c.type === "both" ? "Masuk & Keluar" : c.type === "masuk" ? "Masuk" : "Keluar"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom categories */}
            {custom.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant/60 mb-2">
                  Kustom
                </p>
                <div className="space-y-1.5">
                  {custom.map((c) => (
                    <div key={c.key} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-primary-container/20">
                      <span className="material-symbols-outlined text-base text-primary">{c.icon}</span>
                      <span className="text-sm font-medium text-on-surface">{c.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-container text-on-primary-container">
                        {c.type === "masuk" ? "Masuk" : "Keluar"}
                      </span>
                      <button
                        onClick={() => { removeCategory(c.key); toast.success(`"${c.label}" dihapus`); }}
                        className="ml-auto w-7 h-7 rounded-full flex items-center justify-center text-destructive/60 hover:bg-destructive/10 hover:text-destructive transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add new */}
            <div className="border-t border-outline-variant pt-4 space-y-3">
              <p className="text-sm font-bold text-on-surface">Tambah Kategori Baru</p>

              {/* Name */}
              <Input
                placeholder="Nama kategori (contoh: Fitness)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="h-11 rounded-xl bg-surface-container border-outline-variant text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              />

              {/* Type toggle */}
              <div className="flex gap-1 bg-surface-container rounded-full p-1">
                <button
                  type="button"
                  onClick={() => setNewCatType("keluar")}
                  className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all ${
                    newCatType === "keluar" 
                      ? "bg-error-container text-on-error-container"
                      : "text-on-surface-variant/60"
                  }`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => setNewCatType("masuk")}
                  className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all ${
                    newCatType === "masuk"
                      ? "bg-tertiary-container text-on-tertiary-container"
                      : "text-on-surface-variant/60"
                  }`}
                >
                  Pemasukan
                </button>
              </div>

              {/* Icon picker */}
              <div>
                <p className="text-xs text-on-surface-variant/60 mb-2">Pilih Ikon</p>
                <div className="flex flex-wrap gap-1.5">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewCatIcon(icon)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        newCatIcon === icon
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface-container text-on-surface-variant hover:bg-primary-container/40"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full h-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                onClick={handleAddCategory}
              >
                Tambah Kategori
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Account Management Dialog */}
      <Dialog open={accOpen} onOpenChange={setAccOpen}>
        <DialogContent className="rounded-2xl p-6 gap-5 max-w-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
              Kelola Akun
            </DialogTitle>
            <DialogDescription>
              Pisahkan saldo tunai, rekening bank, dan e-wallet
            </DialogDescription>
          </DialogHeader>

          {/* Add new account */}
          <div className="space-y-3">
            <Input
              placeholder="Nama akun — e.g. BCA, GoPay"
              value={newAccName}
              onChange={(e) => setNewAccName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddAccount()}
              className="rounded-xl bg-surface-container border-outline-variant"
            />
            <div className="flex gap-2">
              {(["tunai", "bank", "ewallet"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setNewAccType(t)}
                  className={`flex-1 py-2 rounded-full text-xs font-bold border transition-all ${
                    newAccType === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-surface-container text-on-surface-variant border-outline-variant"
                  }`}
                >
                  {t === "tunai" ? "💵 Tunai" : t === "bank" ? "🏦 Bank" : "📱 E-Wallet"}
                </button>
              ))}
            </div>
            <Button
              onClick={handleAddAccount}
              className="w-full h-12 rounded-full bg-primary text-primary-foreground font-bold"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Tambah Akun
            </Button>
          </div>

          {/* Account list */}
          {accounts.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase text-on-surface-variant tracking-wider">Daftar Akun</p>
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-3"
                >
                  <span className="material-symbols-outlined text-primary">
                    {acc.type === "tunai" ? "payments" : acc.type === "bank" ? "account_balance" : "phone_android"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{acc.name}</p>
                    <p className="text-xs text-on-surface-variant capitalize">{acc.type}</p>
                  </div>
                  <p className={`text-sm font-bold ${(acc.balance ?? 0) >= 0 ? "text-primary" : "text-error"}`}>
                    Rp {(acc.balance ?? 0).toLocaleString("id-ID")}
                  </p>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus akun "${acc.name}"? Transaksi akan tetap ada tapi tanpa akun.`)) {
                        deleteAccount(acc.id);
                      }
                    }}
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-error hover:bg-error-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
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
