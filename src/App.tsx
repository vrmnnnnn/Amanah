import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { authClient } from "@/lib/auth-client";
import { FamilyProvider, useFamily } from "@/lib/family-context";
import BottomNav from "@/components/BottomNav";
import Login from "@/pages/Login";
import Onboarding from "@/pages/Onboarding";
import Home from "@/pages/Home";
import Catat from "@/pages/Catat";
import Riwayat from "@/pages/Riwayat";
import Anggota from "@/pages/Anggota";
import Profile from "@/pages/Profile";
import Stats from "@/pages/Stats";
import Goals from "@/pages/Goals";
import Budget from "@/pages/Budget";
import Calendar from "@/pages/Calendar";
import AIChat from "@/pages/AIChat";
import VerifyEmail from "@/pages/VerifyEmail";
import AuthCallback from "@/pages/AuthCallback";

const queryClient = new QueryClient();

/** Loading spinner */
function Spinner() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[var(--bg)] gap-3">
      <div className="size-2 rounded-full bg-[var(--gold)] animate-pulse" />
      <p className="text-sm text-[var(--text-muted)] animate-pulse">Memuat...</p>
    </div>
  );
}

/**
 * Guard: checks session + family membership.
 * - No session → /login
 * - Session but no family → /onboarding
 * - Session + family → render children
 */
function AppGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const { family, loading: familyLoading } = useFamily();

  if (sessionLoading || familyLoading) return <Spinner />;
  if (!session) return <Navigate to="/login" replace />;
  if (!family) return <Navigate to="/onboarding" replace />;

  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}

/**
 * Onboarding guard: must be logged in, but must NOT have a family.
 * If already has family → redirect to /home
 */
function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const { family, loading: familyLoading } = useFamily();

  if (sessionLoading || familyLoading) return <Spinner />;
  if (!session) return <Navigate to="/login" replace />;
  if (family) return <Navigate to="/home" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <FamilyProvider>
          <BrowserRouter>
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  borderRadius: "0.75rem",
                  fontSize: "14px",
                  fontWeight: 500,
                },
              }}
            />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              <Route
                path="/onboarding"
                element={
                  <OnboardingGuard>
                    <Onboarding />
                  </OnboardingGuard>
                }
              />

              <Route
                path="/home"
                element={
                  <AppGuard>
                    <Home />
                  </AppGuard>
                }
              />
              <Route
                path="/catat"
                element={
                  <AppGuard>
                    <Catat />
                  </AppGuard>
                }
              />
              <Route
                path="/riwayat"
                element={
                  <AppGuard>
                    <Riwayat />
                  </AppGuard>
                }
              />
              <Route
                path="/anggota"
                element={
                  <AppGuard>
                    <Anggota />
                  </AppGuard>
                }
              />
              <Route
                path="/profile"
                element={
                  <AppGuard>
                    <Profile />
                  </AppGuard>
                }
              />
              <Route
                path="/stats"
                element={
                  <AppGuard>
                    <Stats />
                  </AppGuard>
                }
              />
              <Route
                path="/goals"
                element={
                  <AppGuard>
                    <Goals />
                  </AppGuard>
                }
              />
              <Route
                path="/budget"
                element={
                  <AppGuard>
                    <Budget />
                  </AppGuard>
                }
              />
              <Route
                path="/calendar"
                element={
                  <AppGuard>
                    <Calendar />
                  </AppGuard>
                }
              />
              <Route
                path="/aichat"
                element={
                  <AppGuard>
                    <AIChat />
                  </AppGuard>
                }
              />

              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </BrowserRouter>
        </FamilyProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
