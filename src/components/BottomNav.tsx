import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { path: "/home", label: "Home", icon: "home" },
  { path: "/stats", label: "Stats", icon: "insights" },
  // Center FAB — rendered separately
  { path: "/goals", label: "Goals", icon: "spa" },
  { path: "/profile", label: "Profil", icon: "person" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      {/* Center FAB — voice input trigger */}
      <button
        onClick={() => navigate("/catat")}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-primary shadow-[0_8px_20px_rgba(120,85,94,0.4)] flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all border-2 border-white/20 animate-pulse-soft"
      >
        <span className="material-symbols-outlined icon-filled text-3xl">add</span>
      </button>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-40 bg-surface-container-lowest/80 backdrop-blur-xl border-t border-white/40 shadow-[0_-10px_30px_rgba(255,209,220,0.3)] rounded-t-lg">
        <div className="flex justify-around items-center px-2 pb-6 pt-2 max-w-lg mx-auto">
          {/* Home — left side */}
          <div className="flex gap-0 flex-1 justify-around">
            {tabs.slice(0, 2).map(({ path, label, icon }) => {
              const active = location.pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`flex flex-col items-center justify-center rounded-2xl px-4 py-1 transition-all duration-200 ${
                    active
                      ? "bg-primary-container text-on-primary-container animate-bounce-short"
                      : "text-on-surface-variant opacity-70 hover:bg-primary-container/50"
                  }`}
                >
                  <span className={`material-symbols-outlined text-2xl ${active ? "icon-filled" : ""}`}>
                    {icon}
                  </span>
                  <span className="text-[10px] font-semibold mt-1">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Center spacer for FAB */}
          <div className="w-16 shrink-0" />

          {/* Right side */}
          <div className="flex gap-0 flex-1 justify-around">
            {tabs.slice(2).map(({ path, label, icon }) => {
              const active = location.pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`flex flex-col items-center justify-center rounded-2xl px-4 py-1 transition-all duration-200 ${
                    active
                      ? "bg-primary-container text-on-primary-container animate-bounce-short"
                      : "text-on-surface-variant opacity-70 hover:bg-primary-container/50"
                  }`}
                >
                  <span className={`material-symbols-outlined text-2xl ${active ? "icon-filled" : ""}`}>
                    {icon}
                  </span>
                  <span className="text-[10px] font-semibold mt-1">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
