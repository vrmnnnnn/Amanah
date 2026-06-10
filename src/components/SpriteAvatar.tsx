interface SpriteAvatarProps {
  initial?: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
}

const sizeMap = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14",
};

export default function SpriteAvatar({ initial, src, size = "md", color }: SpriteAvatarProps) {
  const bg = color || "var(--primary-container)";
  const text = "var(--on-primary-container)";

  if (src) {
    return (
      <div className={`${sizeMap[size]} rounded-full overflow-hidden border-2 border-primary-container shrink-0`}>
        <img alt="Avatar" className="w-full h-full object-cover" src={src} />
      </div>
    );
  }

  return (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center font-bold text-base shrink-0 border-2 border-primary-container/50`}
      style={{ background: bg, color: text }}
    >
      {initial?.toUpperCase() || "?"}
    </div>
  );
}
