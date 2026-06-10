import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, PenLine, Clock, Users, UserCircle } from "lucide-react";

const tabs = [
  { path: "/home", label: "Home", Icon: LayoutDashboard },
  { path: "/catat", label: "Catat", Icon: PenLine },
  { path: "/riwayat", label: "Riwayat", Icon: Clock },
  { path: "/anggota", label: "Anggota", Icon: Users },
  { path: "/profile", label: "Profil", Icon: UserCircle },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t px-2 pb-safe z-50"
      style={{
        background: "color-mix(in srgb, var(--surface) 85%, transparent)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map(({ path, label, Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200"
              style={{
                color: active ? "var(--navy)" : "var(--text-muted)",
                background: active ? "color-mix(in srgb, var(--navy) 6%, transparent)" : "transparent",
              }}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.25 : 1.75}
                className="transition-all duration-200"
              />
              <span className="text-[10px] font-semibold tracking-tight">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
