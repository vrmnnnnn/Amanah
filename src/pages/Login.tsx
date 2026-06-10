import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp } from "@/lib/auth-client";
import { toast } from "sonner";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const { error } = (await signIn.email({ email, password })) as any;
        if (error) throw new Error(error.message || "Login gagal");
        toast.success("Berhasil masuk!");
        navigate("/home", { replace: true });
      } else {
        const { error } = (await signUp.email({ email, password })) as any;
        if (error) throw new Error(error.message || "Daftar gagal");
        toast.success("Akun dibuat! Silakan cek email untuk konfirmasi.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleGoogle = async () => {
    await signIn.social({ provider: "google" });
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      {/* Wordmark */}
      <div className="mb-2 text-center">
        <h1
          className="text-4xl font-bold tracking-heading"
          style={{ color: "var(--text)", letterSpacing: "-0.03em" }}
        >
          Amanah
        </h1>
        <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Catatan keuangan keluarga
        </p>
      </div>

      {/* Form card */}
      <div className="w-full max-w-sm mt-8">
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02), 0 4px 24px rgba(0,0,0,0.04)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="keluarga@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl text-[15px] focus:border-[var(--gold)] focus:ring-[var(--gold)]/20"
                style={{ borderColor: "var(--border)", background: "var(--bg)" }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-xl text-[15px] focus:border-[var(--gold)] focus:ring-[var(--gold)]/20"
                style={{ borderColor: "var(--border)", background: "var(--bg)" }}
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-[var(--navy)] hover:bg-[var(--navy)]/90 text-[15px] font-semibold tracking-tight"
            >
              {isLogin ? "Masuk" : "Daftar"}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: "var(--border)" }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>atau</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-11 rounded-xl text-[15px] font-medium transition-colors"
            style={{ borderColor: "var(--border)" }}
            onClick={handleGoogle}
          >
            <svg className="size-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </Button>

          <p className="text-center text-[13px] mt-5" style={{ color: "var(--text-muted)" }}>
            {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
            <button
              type="button"
              className="text-[var(--gold)] font-semibold hover:underline underline-offset-2"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Daftar" : "Masuk"}
            </button>
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="text-[11px] mt-auto pb-8 pt-12" style={{ color: "var(--text-faded)" }}>
        Amanah &middot; v3
      </p>
    </div>
  );
}
