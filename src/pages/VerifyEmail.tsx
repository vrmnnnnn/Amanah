import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { resendVerification } from "@/lib/auth-client";
import { toast } from "sonner";
import { Mail, ArrowLeft, CheckCircle, RefreshCw } from "lucide-react";

/**
 * VerifyEmail — confirmation screen after sign up.
 * Tells user to check their email for the verification link.
 */
export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { email?: string; name?: string } | null;
  const email = state?.email || "email kamu";
  const name = state?.name || "";

  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (!state?.email) {
      toast.error("Email tidak ditemukan. Silakan daftar ulang.");
      return;
    }
    setResending(true);
    try {
      await resendVerification(state.email);
      toast.success("Link verifikasi baru telah dikirim!");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirim ulang");
    } finally {
      setResending(false);
    }
  };

  const openEmail = () => {
    // Try to open default email client
    window.open("mailto:", "_blank");
  };

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 text-center"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow:
            "0 1px 2px rgba(0,0,0,0.02), 0 4px 24px rgba(0,0,0,0.04)",
        }}
      >
        {/* Icon */}
        <div className="relative mx-auto mb-5">
          {/* Pulse ring */}
          <div
            className="size-20 rounded-full mx-auto"
            style={{
              animation: "pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
              background: "var(--primary-container)",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Mail size={36} style={{ color: "var(--primary)" }} />
          </div>
        </div>

        {/* Greeting */}
        {name && (
          <p className="text-[13px] font-medium mb-1" style={{ color: "var(--primary)" }}>
            Hai, {name}!
          </p>
        )}
        <h2 className="text-xl font-bold tracking-heading mb-2" style={{ color: "var(--text)" }}>
          Cek Email Kamu
        </h2>
        <p className="text-[14px] leading-relaxed mb-5" style={{ color: "var(--text-muted)" }}>
          Kami sudah kirim link verifikasi ke{" "}
          <strong style={{ color: "var(--text)" }}>{email}</strong>.
          Klik link tersebut untuk mengaktifkan akun kamu.
        </p>

        {/* Info box */}
        <div
          className="rounded-xl p-3.5 mb-5 text-left flex items-start gap-2.5"
          style={{
            background: "var(--surface-container-low)",
            border: "1px solid var(--border)",
          }}
        >
          <CheckCircle
            size={16}
            className="shrink-0 mt-0.5"
            style={{ color: "var(--primary)" }}
          />
          <div className="text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            <p className="font-semibold mb-0.5" style={{ color: "var(--text)" }}>
              Tidak menemukan email?
            </p>
            <p>
              Periksa folder <strong>Spam</strong> atau <strong>Promosi</strong>.
              Jika masih belum ada, klik "Kirim Ulang" di bawah.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2.5">
          <Button
            onClick={openEmail}
            className="w-full h-11 rounded-xl text-[15px] font-semibold tracking-tight text-white"
            style={{
              background: "var(--primary)",
              boxShadow: "0 2px 0 var(--on-primary-fixed-variant, #5e3e47)",
            }}
          >
            <Mail size={16} className="mr-2" />
            Buka Email
          </Button>

          <Button
            variant="outline"
            onClick={handleResend}
            disabled={resending}
            className="w-full h-11 rounded-xl text-[15px] font-medium"
            style={{ borderColor: "var(--border)" }}
          >
            {resending ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Mengirim ulang...
              </>
            ) : (
              <>
                <RefreshCw size={16} className="mr-2" />
                Kirim Ulang Link
              </>
            )}
          </Button>
        </div>

        {/* Back to login */}
        <button
          onClick={() => navigate("/login", { replace: true })}
          className="flex items-center justify-center gap-1.5 w-full mt-5 text-[13px] font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={14} />
          Kembali ke Login
        </button>
      </div>

      {/* Footer */}
      <p
        className="text-[11px] mt-auto pb-8 pt-12"
        style={{ color: "var(--text-faded)" }}
      >
        Amanah &middot; v4
      </p>
    </div>
  );
}
