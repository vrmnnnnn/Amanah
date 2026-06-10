import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/lib/auth-client";
import { toast } from "sonner";

export default function Profile() {
  const { data: session } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Berhasil keluar");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error("Gagal keluar");
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-emerald-50 to-white pb-20">
      {/* Header */}
      <div className="bg-emerald-600 text-white px-4 pt-12 pb-8 rounded-b-3xl">
        <h1 className="text-2xl font-bold text-center">👤 Profile</h1>
      </div>

      {/* Info */}
      <div className="px-4 mt-6 space-y-4">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Info Akun</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{session?.user?.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">User ID</p>
              <p className="font-mono text-xs text-muted-foreground break-all">
                {session?.user?.id ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Provider</p>
              <p className="font-medium capitalize">
                {session?.user?.app_metadata?.provider ?? "email"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
        >
          🚪 Keluar
        </Button>
      </div>
    </div>
  );
}
