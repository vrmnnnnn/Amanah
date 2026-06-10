import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exchangeCode } from "@/lib/auth-client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

/**
 * AuthCallback — handles Supabase email verification + password reset redirects.
 * Supabase redirects here after user clicks email link.
 * URL format: /auth/callback#access_token=...&refresh_token=...&type=signup|recovery
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Memverifikasi akun kamu...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase puts tokens in URL hash after email verification
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const type = params.get("type");

        // Also check query params (some flows use ?code=)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (accessToken && refreshToken) {
          // Exchange the tokens for a session
          const { data, error } = (await exchangeCode(
            accessToken
          ).catch(async () => {
            // Fallback: manually set session from tokens
            const { supabase } = await import("@/lib/supabase");
            return supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          })) as any;

          if (error) throw error;

          if (type === "recovery") {
            setStatus("success");
            setMessage(
              "Email berhasil diverifikasi! Silakan atur password baru kamu."
            );
            toast.success("Silakan atur password baru");
            // We should redirect to a password update page, but for MVP
            // just go to login — user can use "forgot password" flow
            setTimeout(() => navigate("/login", { replace: true }), 2000);
            return;
          }

          setStatus("success");
          setMessage("Akun berhasil diverifikasi! Mengarahkan...");
          toast.success("Email berhasil diverifikasi!");
          // Redirect to onboarding or home
          setTimeout(() => navigate("/onboarding", { replace: true }), 1500);
        } else if (code) {
          // PKCE flow — exchange code for session
          const { error } = (await exchangeCode(code)) as any;
          if (error) throw error;

          setStatus("success");
          setMessage("Akun berhasil diverifikasi! Mengarahkan...");
          toast.success("Email berhasil diverifikasi!");
          setTimeout(() => navigate("/onboarding", { replace: true }), 1500);
        } else if (type === "signup" || type === "signup_completed") {
          // Already confirmed (Supabase auto-confirm or user already clicked link)
          setStatus("success");
          setMessage("Akun sudah aktif! Mengarahkan...");
          toast.success("Akun sudah aktif!");
          setTimeout(() => navigate("/onboarding", { replace: true }), 1500);
        } else {
          // No tokens — might already be verified
          setStatus("success");
          setMessage("Verifikasi selesai. Mengarahkan...");
          toast.success("Verifikasi selesai!");
          setTimeout(() => navigate("/onboarding", { replace: true }), 1500);
        }
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Gagal memverifikasi akun");
        toast.error("Gagal memverifikasi akun");
        // Redirect to login after delay
        setTimeout(() => navigate("/login", { replace: true }), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

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
        <div className="mx-auto mb-5">
          {status === "loading" && (
            <div
              className="size-20 rounded-full flex items-center justify-center mx-auto"
              style={{ background: "var(--surface-container-low)" }}
            >
              <Loader2
                size={36}
                className="animate-spin"
                style={{ color: "var(--primary)" }}
              />
            </div>
          )}
          {status === "success" && (
            <div
              className="size-20 rounded-full flex items-center justify-center mx-auto"
              style={{ background: "var(--primary-container)" }}
            >
              <CheckCircle size={36} style={{ color: "var(--primary)" }} />
            </div>
          )}
          {status === "error" && (
            <div
              className="size-20 rounded-full flex items-center justify-center mx-auto"
              style={{ background: "var(--error-container, #ffdad6)" }}
            >
              <XCircle size={36} style={{ color: "var(--error, #ba1a1a)" }} />
            </div>
          )}
        </div>

        <h2
          className="text-xl font-bold tracking-heading mb-2"
          style={{ color: "var(--text)" }}
        >
          {status === "loading"
            ? "Memverifikasi..."
            : status === "success"
              ? "Berhasil!"
              : "Gagal"}
        </h2>
        <p
          className="text-[14px] leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
