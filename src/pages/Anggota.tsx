import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@radix-ui/react-alert-dialog";
import { supabase } from "@/lib/supabase";
import { authClient } from "@/lib/auth-client";
import { useFamily } from "@/lib/family-context";
import { toast } from "sonner";
import { Copy, Trash2, UserRound, Share2, Pencil, Check } from "lucide-react";

export default function Anggota() {
  const { data: session } = authClient.useSession();
  const { family, me, members, refresh } = useFamily();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [newRole, setNewRole] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  const isAdmin = me?.role === "Admin" || family?.created_by === session?.user?.id;

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
      toast.success("Pesan invite disalin! Share ke keluarga.");
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

  if (!family) return null;

  return (
    <div className="min-h-dvh pb-24" style={{ background: "var(--bg)" }}>
      <div className="px-5 pt-10">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold tracking-heading" style={{ color: "var(--text)" }}>
            Anggota
          </h1>

          <Button
            size="sm"
            onClick={() => setShowInvite(true)}
            className="h-9 px-4 rounded-xl gap-1.5 text-[13px] font-semibold bg-[var(--navy)] hover:bg-[var(--navy)]/90"
          >
            <Share2 size={13} />
            Invite
          </Button>
        </div>

        <p className="text-[13px] mb-6" style={{ color: "var(--text-muted)" }}>
          {family.name} &middot; {members.length} anggota
        </p>

        {/* Members list */}
        <div className="space-y-2">
          {members.map((m) => {
            const isMe = m.user_id === session?.user?.id;
            return (
              <div
                key={m.id}
                className="card-layered p-3.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="size-11 rounded-full flex items-center justify-center text-base font-bold shrink-0"
                    style={{ background: "var(--surface-hover)", color: "var(--text)" }}
                  >
                    {m.role?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    {editingRole === m.id ? (
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="h-8 w-32 rounded-lg text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveRole(m.id);
                            if (e.key === "Escape") setEditingRole(null);
                          }}
                        />
                        <button
                          onClick={() => saveRole(m.id)}
                          className="size-7 rounded-lg flex items-center justify-center bg-[var(--green)]/10 text-[var(--green)]"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                          {m.role}
                        </p>
                        <p className="text-[11px] truncate" style={{ color: "var(--text-faded)" }}>
                          {isMe ? "Kamu" : `Bergabung ${new Date(m.joined_at).toLocaleDateString("id-ID")}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isAdmin && !isMe && editingRole !== m.id && (
                    <>
                      <button
                        onClick={() => startEditRole(m.id, m.role)}
                        className="size-8 rounded-xl flex items-center justify-center"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(m.id)}
                        className="size-8 rounded-xl flex items-center justify-center hover:text-red-500"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                  {isMe && !isAdmin && (
                    <button
                      onClick={() => setDeleteTarget(m.id)}
                      className="size-8 rounded-xl flex items-center justify-center hover:text-red-500"
                      style={{ color: "var(--text-muted)" }}
                      title="Keluar dari keluarga"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="rounded-2xl p-6 gap-5 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-heading" style={{ color: "var(--text)" }}>
              Undang Anggota
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Bagikan kode ini ke anggota keluarga. Mereka bisa gabung lewat aplikasi dengan kode ini.
            </p>

            {/* Invite code */}
            <button
              onClick={copyInviteCode}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl tracking-[0.3em] text-2xl font-bold transition-colors hover:opacity-80"
              style={{
                background: "color-mix(in srgb, var(--navy) 8%, transparent)",
                color: "var(--navy)",
                letterSpacing: "0.3em",
              }}
            >
              {family.invite_code}
              <Copy size={16} className="opacity-50" />
            </button>
            <p className="text-[11px] text-center -mt-2" style={{ color: "var(--text-faded)" }}>
              Klik untuk menyalin
            </p>

            {/* Share button */}
            <Button
              onClick={shareInvite}
              className="w-full h-11 rounded-xl text-[15px] font-semibold bg-[var(--navy)] hover:bg-[var(--navy)]/90 gap-2"
            >
              <Share2 size={15} />
              Bagikan Undangan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 animate-scale-in"
            style={{ background: "var(--surface)", boxShadow: "0 0 0 1px var(--border), 0 4px 24px rgba(0,0,0,0.08)" }}
          >
            <div>
              <AlertDialogTitle className="text-lg font-bold" style={{ color: "var(--text)" }}>
                {deleteTarget && members.find((m) => m.id === deleteTarget)?.user_id === session?.user?.id
                  ? "Keluar dari Keluarga?"
                  : "Hapus Anggota?"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm mt-1.5" style={{ color: "var(--text-muted)" }}>
                {deleteTarget && members.find((m) => m.id === deleteTarget)?.user_id === session?.user?.id
                  ? "Kamu akan keluar dari keluarga ini. Transaksi kamu tetap tersimpan."
                  : "Anggota ini akan dikeluarkan dari keluarga."}
              </AlertDialogDescription>
            </div>

            <div className="flex gap-2 mt-5">
              <AlertDialogCancel asChild>
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl"
                  onClick={() => setDeleteTarget(null)}
                >
                  Batal
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600"
                  onClick={handleDelete}
                >
                  {deleteTarget && members.find((m) => m.id === deleteTarget)?.user_id === session?.user?.id
                    ? "Keluar"
                    : "Hapus"}
                </Button>
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
