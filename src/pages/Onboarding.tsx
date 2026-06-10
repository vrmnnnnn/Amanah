import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Copy, ArrowRight, Users, UserPlus } from "lucide-react";

export default function Onboarding() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  // Create family state
  const [familyName, setFamilyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  // Join family state
  const [joinCode, setJoinCode] = useState("");
  const [joinRole, setJoinRole] = useState("");
  const [joining, setJoining] = useState(false);

  // Tab: create or join
  const [tab, setTab] = useState<"create" | "join">("create");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim() || !session?.user) return;

    setCreating(true);
    try {
      // Create family
      const { data: family, error: famErr } = await supabase
        .from("families")
        .insert({
          name: familyName.trim(),
          created_by: session.user.id,
        })
        .select()
        .single();

      if (famErr) throw famErr;

      // Add self as admin member
      const { error: memErr } = await supabase
        .from("family_members")
        .insert({
          family_id: family.id,
          user_id: session.user.id,
          role: "Admin",
        });

      if (memErr) throw memErr;

      setInviteCode(family.invite_code);
      toast.success(`Keluarga "${family.name}" dibuat!`);
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat keluarga");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !session?.user) return;

    setJoining(true);
    try {
      const { data, error } = await supabase.rpc("join_family", {
        p_invite_code: joinCode.trim(),
        p_role: joinRole.trim() || "Anggota",
      });

      if (error) throw error;

      toast.success("Berhasil bergabung ke keluarga!");
      navigate("/home", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Gagal bergabung");
    } finally {
      setJoining(false);
    }
  };

  const copyInvite = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      toast.success("Kode disalin!");
    }
  };

  // If invite code generated, show success screen
  if (inviteCode) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
        <div
          className="w-full max-w-sm rounded-2xl p-6 text-center"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02), 0 4px 24px rgba(0,0,0,0.04)",
          }}
        >
          <div className="size-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-[var(--navy)]/10">
            <Users size={28} style={{ color: "var(--navy)" }} />
          </div>
          <h2 className="text-xl font-bold tracking-heading" style={{ color: "var(--text)" }}>
            Keluarga "{familyName}" Siap!
          </h2>
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
            Bagikan kode ini ke anggota keluarga:
          </p>

          {/* Invite code display */}
          <div className="mt-4 mb-1">
            <button
              onClick={copyInvite}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl tracking-[0.3em] text-2xl font-bold transition-colors hover:opacity-80 cursor-pointer"
              style={{
                background: "color-mix(in srgb, var(--navy) 8%, transparent)",
                color: "var(--navy)",
                letterSpacing: "0.3em",
              }}
            >
              {inviteCode}
              <Copy size={16} className="opacity-50" />
            </button>
          </div>
          <p className="text-[11px] mb-6" style={{ color: "var(--text-faded)" }}>
            Klik kode untuk menyalin
          </p>

          <Button
            className="w-full h-11 rounded-xl bg-[var(--navy)] hover:bg-[var(--navy)]/90 text-[15px] font-semibold"
            onClick={() => navigate("/home", { replace: true })}
          >
            Mulai Pakai Amanah
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-heading" style={{ color: "var(--text)" }}>
          Selamat Datang
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
          Buat atau gabung keluarga untuk mulai
        </p>
      </div>

      {/* Tab toggle */}
      <div className="w-full max-w-sm mb-6">
        <div className="flex rounded-xl p-1 gap-1" style={{ background: "var(--surface-hover)" }}>
          <button
            onClick={() => setTab("create")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-sm font-semibold transition-all ${
              tab === "create" ? "bg-white shadow-sm dark:bg-[var(--surface)]" : ""
            }`}
            style={{ color: tab === "create" ? "var(--text)" : "var(--text-muted)" }}
          >
            <Users size={16} />
            Buat Baru
          </button>
          <button
            onClick={() => setTab("join")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-sm font-semibold transition-all ${
              tab === "join" ? "bg-white shadow-sm dark:bg-[var(--surface)]" : ""
            }`}
            style={{ color: tab === "join" ? "var(--text)" : "var(--text-muted)" }}
          >
            <UserPlus size={16} />
            Gabung
          </button>
        </div>
      </div>

      {/* Form card */}
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.02), 0 4px 24px rgba(0,0,0,0.04)",
        }}
      >
        {tab === "create" ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                Nama Keluarga
              </Label>
              <Input
                placeholder="Misal: Keluarga Budi"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                required
                className="h-11 rounded-xl"
                style={{ borderColor: "var(--border)", background: "var(--bg)" }}
              />
            </div>
            <Button
              type="submit"
              disabled={creating}
              className="w-full h-11 rounded-xl bg-[var(--navy)] hover:bg-[var(--navy)]/90 text-[15px] font-semibold"
            >
              {creating ? "Membuat..." : "Buat Keluarga"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                Kode Invite
              </Label>
              <Input
                placeholder="Misal: A1B2C3"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                required
                maxLength={6}
                className="h-11 rounded-xl text-center tracking-[0.3em] font-bold text-lg"
                style={{ borderColor: "var(--border)", background: "var(--bg)", letterSpacing: "0.3em" }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                Peran (opsional)
              </Label>
              <Input
                placeholder="Misal: Ibu, Ayah, Anak..."
                value={joinRole}
                onChange={(e) => setJoinRole(e.target.value)}
                className="h-11 rounded-xl"
                style={{ borderColor: "var(--border)", background: "var(--bg)" }}
              />
            </div>
            <Button
              type="submit"
              disabled={joining}
              className="w-full h-11 rounded-xl bg-[var(--navy)] hover:bg-[var(--navy)]/90 text-[15px] font-semibold"
            >
              {joining ? "Bergabung..." : "Gabung Keluarga"}
            </Button>
          </form>
        )}
      </div>

      {/* Footer */}
      <p className="text-[11px] mt-auto pb-8 pt-12" style={{ color: "var(--text-faded)" }}>
        Amanah v3 &middot; Kolaborasi Keluarga
      </p>
    </div>
  );
}
