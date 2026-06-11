import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { authClient } from "@/lib/auth-client";
import { useFamily, getMemberDisplayName } from "@/lib/family-context";
import { toast } from "sonner";
import TopAppBar from "@/components/TopAppBar";
import GlassCard from "@/components/GlassCard";

export default function Anggota() {
  const { data: session } = authClient.useSession();
  const { family, me, members, refresh } = useFamily();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [newRole, setNewRole] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [showAddByEmail, setShowAddByEmail] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("Anggota");
  const [adding, setAdding] = useState(false);

  const isCreator = family?.created_by === session?.user?.id;
  const isAdmin = me?.role === "Admin" || isCreator;

  const copyInviteCode = () => {
    if (family?.invite_code) {
      navigator.clipboard.writeText(family.invite_code);
      toast.success("Kode invite disalin!");
    }
  };

  const shareInvite = async () => {
    if (!family?.invite_code) return;
    const text = `Gabung ke keluarga "${family.name}" di Amanah!\n\nKode invite: ${family.invite_code}\n\nBuka https://amanah-navy.vercel.app dan masukkan kode ini.`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Invite Amanah", text });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Pesan invite disalin!");
    }
  };

  const shareWhatsApp = () => {
    if (!family?.invite_code) return;
    const text = `Gabung ke keluarga *${family.name}* di Amanah! 💖\n\nKode invite: *${family.invite_code}*\n\nBuka https://amanah-navy.vercel.app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const regenerateCode = async () => {
    if (!family) return;
    const { error } = await supabase.rpc("regenerate_invite_code", {
      p_family_id: family.id,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Kode invite baru dibuat!");
      refresh();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("family_members")
      .delete()
      .eq("id", deleteTarget);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Anggota dikeluarkan");
      refresh();
    }
    setDeleteTarget(null);
  };

  const startEditRole = (memberId: string, currentRole: string) => {
    setEditingRole(memberId);
    setNewRole(currentRole);
  };

  const saveRole = async (memberId: string) => {
    if (!newRole.trim()) return;
    const { error } = await supabase
      .from("family_members")
      .update({ role: newRole.trim() })
      .eq("id", memberId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Role diupdate");
      setEditingRole(null);
      refresh();
    }
  };

  const handleAddByEmail = async () => {
    if (!family || !addEmail.trim()) return;
    setAdding(true);
    const { error } = await supabase.rpc("admin_add_member_by_email", {
      p_family_id: family.id,
      p_email: addEmail.trim(),
      p_role: addRole,
    });
    setAdding(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${addEmail} berhasil ditambahkan!`);
      setAddEmail("");
      setAddRole("Anggota");
      setShowAddByEmail(false);
      refresh();
    }
  };

  if (!family) return null;

  return (
    <div className="min-h-dvh pb-32 bg-background">
      <TopAppBar title="Anggota" showBack />

      <main className="px-5 md:px-10 max-w-xl mx-auto pt-4">
        {/* Family header */}
        <GlassCard className="p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-on-surface">{family.name}</h2>
              <p className="text-sm text-on-surface-variant mt-0.5">
                Kode: <span className="font-mono font-bold tracking-wider text-primary">{family.invite_code}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-on-surface-variant bg-surface-container-highest px-2.5 py-1 rounded-full">
                {members.length} anggota
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Action buttons */}
        {isAdmin && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowInvite(true)}
              className="flex-1 h-11 rounded-full bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-1.5 hover:scale-[1.02] transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">share</span>
              Invite Anggota
            </button>
            <button
              onClick={() => setShowAddByEmail(true)}
              className="h-11 px-5 rounded-full bg-tertiary-container text-on-tertiary-container font-semibold text-sm flex items-center justify-center gap-1.5 hover:scale-[1.02] transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              Tambah
            </button>
          </div>
        )}

        {/* Members list */}
        <div className="space-y-2">
          {members.map((m) => {
            const isMe = m.user_id === session?.user?.id;
            const email = m.email || "";
            const avatarSeed = email || m.role;

            return (
              <GlassCard key={m.id} className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full border-2 border-primary-container shrink-0 overflow-hidden">
                    <img
                      alt=""
                      className="w-full h-full object-cover"
                      src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${avatarSeed}&backgroundColor=ffd1dc`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    {editingRole === m.id ? (
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="h-8 w-32 rounded-lg text-sm bg-surface-container border-outline-variant"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveRole(m.id);
                            if (e.key === "Escape") setEditingRole(null);
                          }}
                        />
                        <button
                          onClick={() => saveRole(m.id)}
                          className="size-7 rounded-lg flex items-center justify-center bg-primary text-primary-foreground"
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                        </button>
                        <button
                          onClick={() => setEditingRole(null)}
                          className="size-7 rounded-lg flex items-center justify-center bg-surface-container-highest text-on-surface-variant"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold text-sm text-on-surface flex items-center gap-1.5">
                          {getMemberDisplayName(m)}
                          {isMe && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-container text-primary font-semibold">
                              Kamu
                            </span>
                          )}
                          {isCreator && m.user_id === session?.user?.id && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container font-semibold">
                              Admin
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-on-surface-variant truncate">
                          Bergabung {new Date(m.joined_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {isAdmin && !isMe && editingRole !== m.id && (
                    <>
                      <button
                        onClick={() => startEditRole(m.id, m.role)}
                        className="size-9 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors text-on-surface-variant"
                        title="Edit role"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => { setDeleteTarget(m.id); setDeleteName(getMemberDisplayName(m)); }}
                        className="size-9 rounded-full flex items-center justify-center hover:bg-destructive/10 transition-colors text-on-surface-variant hover:text-destructive"
                        title="Hapus anggota"
                      >
                        <span className="material-symbols-outlined text-lg">person_remove</span>
                      </button>
                    </>
                  )}
                  {isMe && !isAdmin && (
                    <button
                      onClick={() => { setDeleteTarget(m.id); setDeleteName("keluarga"); }}
                      className="size-9 rounded-full flex items-center justify-center hover:bg-destructive/10 transition-colors text-on-surface-variant hover:text-destructive"
                      title="Keluar dari keluarga"
                    >
                      <span className="material-symbols-outlined text-lg">logout</span>
                    </button>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </main>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="rounded-2xl p-6 gap-5 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-on-surface">
              Undang Anggota
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant">
              Bagikan kode ini ke anggota keluarga. Mereka bisa gabung lewat aplikasi dengan kode ini.
            </p>

            {/* Invite code display */}
            <button
              onClick={copyInviteCode}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl tracking-[0.3em] text-2xl font-bold transition-all hover:scale-[1.02] active:scale-95 bg-primary-container/40 text-primary border-2 border-dashed border-primary/30"
            >
              {family.invite_code}
              <span className="material-symbols-outlined text-lg opacity-60">content_copy</span>
            </button>
            <p className="text-xs text-center -mt-2 text-on-surface-variant/50">
              Klik untuk menyalin
            </p>

            {/* Share buttons */}
            <div className="flex gap-2">
              <Button
                onClick={shareInvite}
                className="flex-1 h-11 rounded-full bg-surface-container-highest text-on-surface hover:bg-surface-container-high font-semibold text-sm gap-1.5"
              >
                <span className="material-symbols-outlined text-lg">share</span>
                Share
              </Button>
              <Button
                onClick={shareWhatsApp}
                className="flex-1 h-11 rounded-full bg-[#25D366] hover:bg-[#1ea853] text-white font-semibold text-sm gap-1.5"
              >
                <span className="material-symbols-outlined text-lg">chat</span>
                WhatsApp
              </Button>
            </div>

            {/* Regenerate code */}
            {isAdmin && (
              <button
                onClick={regenerateCode}
                className="w-full text-center text-xs text-on-surface-variant/50 hover:text-primary transition-colors py-1"
              >
                Generate kode baru
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add by Email Dialog */}
      <Dialog open={showAddByEmail} onOpenChange={setShowAddByEmail}>
        <DialogContent className="rounded-2xl p-6 gap-5 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-on-surface">
              Tambah Anggota via Email
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant">
              Masukkan email anggota yang sudah terdaftar di Amanah untuk langsung ditambahkan ke keluarga.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Email
              </label>
              <Input
                type="email"
                placeholder="contoh: budi@email.com"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                className="h-12 rounded-xl bg-surface-container border-outline-variant"
                onKeyDown={(e) => e.key === "Enter" && handleAddByEmail()}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Role
              </label>
              <div className="flex gap-2">
                {["Anggota", "Admin", "Anak"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setAddRole(r)}
                    className={`flex-1 h-9 rounded-full text-xs font-semibold transition-all ${
                      addRole === r
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full h-11 rounded-full bg-primary text-primary-foreground font-semibold"
              onClick={handleAddByEmail}
              disabled={adding || !addEmail.trim()}
            >
              {adding ? (
                <span className="inline-flex items-center gap-2">
                  <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                  Menambahkan...
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  Tambah Anggota
                </span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className="rounded-2xl p-6 gap-5 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-on-surface">
              {deleteTarget && members.find((m) => m.id === deleteTarget)?.user_id === session?.user?.id
                ? "Keluar dari Keluarga?"
                : "Hapus Anggota?"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-on-surface-variant">
            {deleteTarget && members.find((m) => m.id === deleteTarget)?.user_id === session?.user?.id
              ? "Kamu akan keluar dari keluarga ini. Transaksi kamu tetap tersimpan."
              : `Anggota "${deleteName}" akan dikeluarkan dari keluarga.`}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-full border-outline-variant"
              onClick={() => setDeleteTarget(null)}
            >
              Batal
            </Button>
            <Button
              className="flex-1 h-11 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
              onClick={handleDelete}
            >
              {deleteTarget && members.find((m) => m.id === deleteTarget)?.user_id === session?.user?.id
                ? "Keluar"
                : "Hapus"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
