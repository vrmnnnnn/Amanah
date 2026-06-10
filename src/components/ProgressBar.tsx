interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  color?: string;
  bgColor?: string;
  showLabel?: boolean;
  label?: string;
  indicator?: string; // emoji or icon
  size?: "sm" | "md";
}

export default function ProgressBar({
  value, max = 100, color, bgColor, showLabel, label, indicator, size = "md",
}: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  const barColor = color || "var(--primary)";
  const trackColor = bgColor || "var(--surface-container)";
  const h = size === "sm" ? "h-2" : "h-4";

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-semibold text-on-surface-variant">{label}</span>
          <span className="text-xs font-medium text-on-surface-variant">{Math.round(pct)}%</span>
        </div>
      )}
      <div
        className={`w-full ${h} rounded-full overflow-hidden relative`}
        style={{ background: trackColor }}
      >
        <div
          className={`${h} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${pct}%`, background: barColor }}
        />
        {indicator && (
          <span
            className="absolute top-1/2 -translate-y-1/2 text-sm"
            style={{ left: `calc(${pct}% - 10px)` }}
          >
            {indicator}
          </span>
        )}
      </div>
    </div>
  );
}
