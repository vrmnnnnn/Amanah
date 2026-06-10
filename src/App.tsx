import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { authClient } from "@/lib/auth-client";
import BottomNav from "@/components/BottomNav";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Catat from "@/pages/Catat";
import Riwayat from "@/pages/Riwayat";
import Anggota from "@/pages/Anggota";
import Profile from "@/pages/Profile";

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[var(--bg)] gap-3">
        <div className="size-2 rounded-full bg-[var(--gold)] animate-pulse" />
        <p className="text-sm text-[var(--text-muted)] animate-pulse">Memuat...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
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
            <Route
              path="/home"
              element={
                <AuthGuard>
                  <Home />
                </AuthGuard>
              }
            />
            <Route
              path="/catat"
              element={
                <AuthGuard>
                  <Catat />
                </AuthGuard>
              }
            />
            <Route
              path="/riwayat"
              element={
                <AuthGuard>
                  <Riwayat />
                </AuthGuard>
              }
            />
            <Route
              path="/anggota"
              element={
                <AuthGuard>
                  <Anggota />
                </AuthGuard>
              }
            />
            <Route
              path="/profile"
              element={
                <AuthGuard>
                  <Profile />
                </AuthGuard>
              }
            />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
