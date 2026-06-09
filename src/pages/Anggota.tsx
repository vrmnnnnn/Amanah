import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { supabase } from "@/lib/supabase";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

const roleIcons: Record<string, string> = {
  ayah: "👨",
  ibu: "👩",
  anak: "👦",
};

const roleLabel: Record<string, string> = {
  ayah: "Ayah",
  ibu: "Ibu",
  anak_1: "Anak 1",
  anak_2: "Anak 2",
  anak_3: "Anak 3",
  anak_4: "Anak 4",
};

export default function Anggota() {
  const { data: session } = authClient.useSession();
  const [members, setMembers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("anak_1");

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
    const { error } = await supabase.from("family_members").insert({
      user_id: session!.user!.id,
      name: name.trim(),
      role,
    });
    if (error) {
      toast.error("Gagal: " + error.message);
    } else {
      toast.success(`${name} ditambahkan!`);
      setName("");
      setOpen(false);
      load();
    }
  };

  const removeMember = async (id: string) => {
    await supabase.from("family_members").delete().eq("id", id);
    toast.success("Anggota dihapus");
    load();
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-emerald-50 to-white pb-20">
      <div className="px-4 pt-8">
        <h1 className="text-2xl font-bold text-emerald-700 text-center">
          👥 Anggota Keluarga
        </h1>

        <div className="mt-4 space-y-3">
          {members.map((m) => (
            <Card key={m.id} className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg">
                    {m.role === "ayah" ? "👨" : m.role === "ibu" ? "👩" : "👦"}
                  </div>
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {m.role.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                  onClick={() => removeMember(m.id)}
                >
                  ✕
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">
              + Tambah Anggota
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Anggota Keluarga</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nama</Label>
                <Input
                  placeholder="Misal: Budi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Peran</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ayah">👨 Ayah</SelectItem>
                    <SelectItem value="ibu">👩 Ibu</SelectItem>
                    <SelectItem value="anak_1">👦 Anak 1</SelectItem>
                    <SelectItem value="anak_2">👦 Anak 2</SelectItem>
                    <SelectItem value="anak_3">👦 Anak 3</SelectItem>
                    <SelectItem value="anak_4">👦 Anak 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={addMember}
              >
                Simpan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
