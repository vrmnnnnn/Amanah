import { useNavigate } from "react-router-dom";
import { useFamily, getMemberAvatar } from "@/lib/family-context";
import { authClient } from "@/lib/auth-client";

interface TopAppBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export default function TopAppBar({ title, showBack, onBack }: TopAppBarProps) {
  const navigate = useNavigate();
  const { family, me } = useFamily();
  const { data: session } = authClient.useSession();

  const avatarUrl = me
    ? getMemberAvatar(me, 80)
    : `https://api.dicebear.com/9.x/thumbs/svg?seed=Amanah&backgroundColor=ffd1dc`;

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/20 shadow-[0_10px_30px_rgba(255,209,220,0.1)]">
      <div className="flex justify-between items-center px-5 py-2 w-full">
        {/* Left: Avatar + Title — tappable → profile */}
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          {showBack && (
            <span
              onClick={(e) => { e.stopPropagation(); (onBack || (() => navigate(-1)))(); }}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </span>
          )}
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container">
            <img
              alt="Avatar"
              className="w-full h-full object-cover"
              src={avatarUrl}
            />
          </div>
          <h1 className="font-extrabold text-lg text-primary tracking-tight">
            {title || family?.name || "Amanah"}
          </h1>
        </button>

        {/* Right: Anggota shortcut */}
        <button
          onClick={() => navigate("/anggota")}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant relative"
        >
          <span className="material-symbols-outlined">group</span>
        </button>
      </div>
    </header>
  );
}
