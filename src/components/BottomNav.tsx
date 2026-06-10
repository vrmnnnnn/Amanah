import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { path: "/home", label: "Home", icon: "🏠" },
  { path: "/catat", label: "Catat", icon: "✍️" },
  { path: "/riwayat", label: "Riwayat", icon: "📋" },
  { path: "/anggota", label: "Anggota", icon: "👥" },
  { path: "/profile", label: "Profile", icon: "👤" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border px-2 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                active
                  ? "text-emerald-700 bg-emerald-50"
                  : "text-muted-foreground hover:text-emerald-600"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
