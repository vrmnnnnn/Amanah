import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { toast } from "sonner";
import { Plus, Trash2, UserRound } from "lucide-react";

export default function Anggota() {
  const { data: session } = authClient.useSession();
  const [members, setMembers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("anak_1");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    load();
  }, [session]);

  const load = async () => {
    const { data } = await supabase
      .from("family_members")
      .select("*")
      .eq("user_id", session?.user?.id)
      .order("created_at");
    if (data) setMembers(data);
  };

  const addMember = async () => {
    if (!name.trim()) return;
    if (!session?.user?.id) {
      toast.error("Silakan login terlebih dahulu");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("family_members").insert({
      user_id: session.user.id,
      name: name.trim(),
      role,
    });
    setSaving(false);
    if (error) {
      toast.error("Gagal: " + error.message);
    } else {
      toast.success(`${name} ditambahkan!`);
      setName("");
      setOpen(false);
      load();
    }
  };

  const removeMember = async () => {
    if (!deleteId) return;
    await supabase.from("family_members").delete().eq("id", deleteId);
    toast.success("Anggota dihapus");
    setDeleteId(null);
    load();
  };

  const memberToDelete = members.find((m) => m.id === deleteId);

  return (
    <div className="min-h-dvh pb-24" style={{ background: "var(--bg)" }}>
      <div className="px-5 pt-10">
        <h1 className="text-2xl font-bold text-center tracking-heading" style={{ color: "var(--text)" }}>
          Anggota Keluarga
        </h1>

        <div className="mt-5 space-y-2.5">
          {members.map((m) => (
            <div
              key={m.id}
              className="card-layered p-3.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--surface-hover)" }}>
                  <UserRound size={20} style={{ color: "var(--text)", opacity: 0.4 }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                    {m.name}
                  </p>
                  <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
                    {m.role.replace("_", " ")}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-lg hover:text-red-500"
                style={{ color: "var(--text-faded)" }}
                onClick={() => setDeleteId(m.id)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>

        {members.length === 0 && (
          <div className="card-layered text-center py-12 px-4 mt-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Belum ada anggota keluarga.
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-faded)" }}>
              Tambahkan untuk mulai mencatat per-orang.
            </p>
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full mt-5 h-12 rounded-xl bg-[var(--navy)] hover:bg-[var(--navy)]/90 text-[15px] font-semibold tracking-tight">
              <Plus size={18} className="mr-2" />
              Tambah Anggota
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl p-6 gap-5">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold tracking-heading" style={{ color: "var(--text)" }}>
                Tambah Anggota
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                  Nama
                </Label>
                <Input
                  placeholder="Misal: Budi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 rounded-xl"
                  style={{ borderColor: "var(--border)", background: "var(--bg)" }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                  Peran
                </Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="h-11 rounded-xl" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ayah">Ayah</SelectItem>
                    <SelectItem value="ibu">Ibu</SelectItem>
                    <SelectItem value="anak_1">Anak 1</SelectItem>
                    <SelectItem value="anak_2">Anak 2</SelectItem>
                    <SelectItem value="anak_3">Anak 3</SelectItem>
                    <SelectItem value="anak_4">Anak 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full h-11 rounded-xl bg-[var(--navy)] hover:bg-[var(--navy)]/90 text-[15px] font-semibold tracking-tight"
                onClick={addMember}
                disabled={saving}
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-[#1a1d27] rounded-2xl p-6 max-w-sm mx-4 shadow-2xl animate-fade-in border" style={{ borderColor: "var(--border)" }}>
            <div>
              <AlertDialogTitle className="text-lg font-bold" style={{ color: "var(--text)" }}>
                Hapus Anggota?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
                {memberToDelete ? (
                  <>Yakin hapus <strong style={{ color: "var(--text)" }}>{memberToDelete.name}</strong>? Transaksi yang terkait tidak akan terhapus.</>
                ) : (
                  "Yakin ingin menghapus anggota ini?"
                )}
              </AlertDialogDescription>
            </div>
            <div className="flex gap-2 mt-5">
              <AlertDialogCancel asChild>
                <Button variant="outline" className="flex-1 h-10 rounded-xl" onClick={() => setDeleteId(null)}>
                  Batal
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  variant="destructive"
                  className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white border-0"
                  onClick={removeMember}
                >
                  Hapus
                </Button>
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
