import { useNavigate } from "react-router-dom";
import { useFamily } from "@/lib/family-context";

interface TopAppBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export default function TopAppBar({ title, showBack, onBack }: TopAppBarProps) {
  const navigate = useNavigate();
  const { family } = useFamily();

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/20 shadow-[0_10px_30px_rgba(255,209,220,0.1)]">
      <div className="flex justify-between items-center px-5 py-2 w-full">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={onBack || (() => navigate(-1))}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container">
            <img
              alt="Avatar"
              className="w-full h-full object-cover"
              src="https://api.dicebear.com/9.x/thumbs/svg?seed=Amanah&backgroundColor=ffd1dc"
            />
          </div>
          <h1 className="font-extrabold text-lg text-primary tracking-tight">
            {title || family?.name || "Amanah"}
          </h1>
        </div>

        <button className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors text-primary relative">
          <span className="material-symbols-outlined">notifications</span>
          {/* Notification dot */}
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
        </button>
      </div>
    </header>
  );
}
