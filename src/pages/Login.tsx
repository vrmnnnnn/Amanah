import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp, resetPassword, resendVerification } from "@/lib/auth-client";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Check, X } from "lucide-react";

type Tab = "login" | "register";

export default function Login() {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Forgot password state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (tab === "login") {
        const { error } = (await signIn.email({ email, password })) as any;
        if (error) throw new Error(error.message || "Login gagal");
        toast.success("Selamat datang kembali!");
        navigate("/home", { replace: true });
      } else {
        // Validasi register
        if (!name.trim()) throw new Error("Nama tidak boleh kosong");
        if (password.length < 6) throw new Error("Password minimal 6 karakter");
        if (password !== confirmPassword) throw new Error("Password tidak cocok");

        const { error, data } = (await signUp.email({
          email,
          password,
          name: name.trim(),
        })) as any;

        if (error) throw new Error(error.message || "Daftar gagal");

        // Check if user is already confirmed (email confirmation disabled on Supabase)
        if (data?.user?.identities?.length === 0) {
          throw new Error("Email sudah terdaftar. Silakan masuk.");
        }

        // Navigate to email verification screen
        navigate("/verify-email", {
          state: { email, name: name.trim() },
          replace: true,
        });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signIn.social({ provider: "google" });
    } catch (err: any) {
      const msg =
        err?.message || err?.error_description || "Login Google gagal";
      toast.error(
        msg.includes("provider") && msg.includes("not enabled")
          ? "Login Google belum diaktifkan di server. Hubungi admin."
          : msg.includes("popup")
            ? "Popup diblokir browser. Izinkan popup untuk situs ini."
            : msg
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error("Masukkan email terlebih dahulu");
      return;
    }
    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail.trim());
      setForgotSent(true);
      toast.success("Link reset password telah dikirim ke email kamu");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirim link reset");
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgot = () => {
    setForgotOpen(false);
    setForgotSent(false);
    setForgotEmail("");
  };

  // ── Password strength ──
  const pwStrength = (pw: string): { score: number; label: string; color: string } => {
    if (!pw) return { score: 0, label: "", color: "transparent" };
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^a-zA-Z0-9]/.test(pw)) s++;
    if (s <= 1) return { score: s, label: "Lemah", color: "var(--error)" };
    if (s <= 3) return { score: s, label: "Cukup", color: "#f59e0b" };
    return { score: s, label: "Kuat", color: "#10b981" };
  };
  const strength = tab === "register" ? pwStrength(password) : { score: 0, label: "", color: "transparent" };

  // ── Forgot Password View ──
  if (forgotOpen) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6" style={{ background: "var(--bg)" }}>
        <div
          className="w-full max-w-sm rounded-2xl p-6"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02), 0 4px 24px rgba(0,0,0,0.04)",
          }}
        >
          {!forgotSent ? (
            <>
              <button
                onClick={closeForgot}
                className="flex items-center gap-1.5 text-[13px] font-medium mb-5 transition-opacity hover:opacity-70"
                style={{ color: "var(--primary)" }}
              >
                <ArrowLeft size={16} />
                Kembali
              </button>

              <h2 className="text-xl font-bold tracking-heading mb-1" style={{ color: "var(--text)" }}>
                Lupa Password?
              </h2>
              <p className="text-[13px] mb-5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Masukkan email kamu, kami akan kirim link untuk reset password.
              </p>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                    Email
                  </Label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-muted)" }}
                    />
                    <Input
                      type="email"
                      placeholder="keluarga@mail.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      className="h-11 rounded-xl text-[15px] pl-10"
                      style={{ borderColor: "var(--border)", background: "var(--bg)" }}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full h-11 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/85 text-[15px] font-semibold tracking-tight text-white"
                >
                  {forgotLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" strokeLinecap="round" />
                      </svg>
                      Mengirim...
                    </span>
                  ) : (
                    "Kirim Link Reset"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div
                className="size-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "var(--primary-container)" }}
              >
                <Check size={28} style={{ color: "var(--primary)" }} />
              </div>
              <h2 className="text-xl font-bold tracking-heading mb-2" style={{ color: "var(--text)" }}>
                Email Terkirim!
              </h2>
              <p className="text-[13px] leading-relaxed mb-5" style={{ color: "var(--text-muted)" }}>
                Cek inbox <strong>{forgotEmail}</strong> untuk link reset password. Jangan lupa cek folder spam.
              </p>
              <Button
                variant="outline"
                onClick={closeForgot}
                className="w-full h-11 rounded-xl text-[15px] font-medium"
                style={{ borderColor: "var(--border)" }}
              >
                Kembali ke Login
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Main Login / Register View ──
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
          {/* Pill tab toggle */}
          <div className="flex rounded-xl p-1 gap-1 mb-5" style={{ background: "var(--surface-hover, var(--surface-container-low))" }}>
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-2.5 rounded-[10px] text-sm font-semibold transition-all ${
                tab === "login" ? "bg-white shadow-sm" : ""
              }`}
              style={{
                color: tab === "login" ? "var(--text)" : "var(--text-muted)",
                ...(tab === "login" ? { background: "var(--surface-container-lowest)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" } : {}),
              }}
            >
              Masuk
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-2.5 rounded-[10px] text-sm font-semibold transition-all ${
                tab === "register" ? "bg-white shadow-sm" : ""
              }`}
              style={{
                color: tab === "register" ? "var(--text)" : "var(--text-muted)",
                ...(tab === "register" ? { background: "var(--surface-container-lowest)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" } : {}),
              }}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Name — register only */}
            {tab === "register" && (
              <div className="space-y-1.5 animate-fade-in">
                <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                  Nama
                </Label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <Input
                    type="text"
                    placeholder="Nama kamu"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={tab === "register"}
                    className="h-11 rounded-xl text-[15px] pl-10 focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                    style={{ borderColor: "var(--border)", background: "var(--bg)" }}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                Email
              </Label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                />
                <Input
                  type="email"
                  placeholder="keluarga@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl text-[15px] pl-10 focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                  style={{ borderColor: "var(--border)", background: "var(--bg)" }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                Password
              </Label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                />
                <Input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-xl text-[15px] pl-10 pr-10 focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                  style={{ borderColor: "var(--border)", background: "var(--bg)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Password strength bar — register only */}
              {tab === "register" && password && (
                <div className="flex items-center gap-2 mt-1.5 animate-fade-in">
                  <div className="flex-1 h-1 rounded-full" style={{ background: "var(--border)" }}>
                    <div
                      className="h-1 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((strength.score / 5) * 100, 100)}%`,
                        background: strength.color,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-medium" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password — register only */}
            {tab === "register" && (
              <div className="space-y-1.5 animate-fade-in">
                <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                  Konfirmasi Password
                </Label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <Input
                    type={showConfirmPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={tab === "register"}
                    className="h-11 rounded-xl text-[15px] pl-10 pr-10 focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                    style={{
                      borderColor: confirmPassword && password !== confirmPassword ? "var(--error)" : "var(--border)",
                      background: "var(--bg)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-opacity hover:opacity-70"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[11px] flex items-center gap-1 mt-1" style={{ color: "var(--error)" }}>
                    <X size={12} />
                    Password tidak cocok
                  </p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="text-[11px] flex items-center gap-1 mt-1" style={{ color: "#10b981" }}>
                    <Check size={12} />
                    Password cocok
                  </p>
                )}
              </div>
            )}

            {/* Forgot password — login only */}
            {tab === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-[12px] font-medium transition-opacity hover:opacity-70"
                  style={{ color: "var(--primary)" }}
                >
                  Lupa password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl text-[15px] font-semibold tracking-tight text-white transition-all"
              style={{
                background: "var(--primary)",
                boxShadow: "0 2px 0 var(--on-primary-fixed-variant, #5e3e47)",
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" strokeLinecap="round" />
                  </svg>
                  {tab === "login" ? "Masuk..." : "Mendaftar..."}
                </span>
              ) : tab === "login" ? (
                "Masuk"
              ) : (
                "Daftar"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: "var(--border)" }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
                atau
              </span>
            </div>
          </div>

          {/* Google */}
          <Button
            variant="outline"
            className="w-full h-11 rounded-xl text-[15px] font-medium transition-colors"
            style={{ borderColor: "var(--border)" }}
            onClick={handleGoogle}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <svg className="size-4 mr-2 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="size-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {googleLoading ? "Menghubungkan..." : "Google"}
          </Button>

          {/* Bottom switch */}
          <p className="text-center text-[13px] mt-5" style={{ color: "var(--text-muted)" }}>
            {tab === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
            <button
              type="button"
              className="font-semibold hover:underline underline-offset-2 transition-opacity hover:opacity-80"
              style={{ color: "var(--primary)" }}
              onClick={() => setTab(tab === "login" ? "register" : "login")}
            >
              {tab === "login" ? "Daftar" : "Masuk"}
            </button>
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="text-[11px] mt-auto pb-8 pt-12" style={{ color: "var(--text-faded)" }}>
        Amanah &middot; v4
      </p>
    </div>
  );
}
