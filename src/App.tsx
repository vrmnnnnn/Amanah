import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Memuat...</p>
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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-center" richColors />
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
  );
}
