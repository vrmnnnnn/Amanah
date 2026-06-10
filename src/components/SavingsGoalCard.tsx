import ProgressBar from "./ProgressBar";

interface SavingsGoalCardProps {
  title: string;
  current: number;
  target: number;
  icon: string;
  color?: string;
  status?: "active" | "achieved";
}

export default function SavingsGoalCard({
  title, current, target, icon, color, status = "active",
}: SavingsGoalCardProps) {
  const pct = Math.round((current / target) * 100);
  const barColor = color || "var(--primary)";
  const achieved = status === "achieved";

  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_4px_20px_rgba(255,209,220,0.15)] border border-outline-variant/30 hover:border-primary-container transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "var(--primary-container)", color: "var(--on-primary-container)" }}
          >
            <span className="material-symbols-outlined text-2xl">{icon}</span>
          </div>
          <div>
            <h4 className="font-bold text-sm text-on-surface">{title}</h4>
            <p className="text-xs text-on-surface-variant">
              Rp {current.toLocaleString("id-ID")} / Rp {target.toLocaleString("id-ID")}
            </p>
          </div>
        </div>
        <span
          className="text-xs font-bold px-2 py-1 rounded-full"
          style={{
            background: achieved ? "var(--tertiary-container)" : "var(--primary-container)",
            color: achieved ? "var(--on-tertiary-container)" : "var(--on-primary-container)",
          }}
        >
          {pct}%
        </span>
      </div>
      <ProgressBar
        value={pct}
        color={barColor}
        indicator={achieved ? "🏆" : "⭐"}
        size="sm"
      />
      {achieved && (
        <p className="text-xs text-center mt-2 font-semibold text-tertiary">🎉 Target tercapai!</p>
      )}
    </div>
  );
}
