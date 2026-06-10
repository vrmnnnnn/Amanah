import ProgressBar from "./ProgressBar";

interface BudgetCategoryCardProps {
  name: string;
  icon: string;
  budget: number;
  spent: number;
}

const STATUS = {
  healthy: { color: "var(--primary)", bg: "var(--primary-container)", icon: "favorite" },
  warning: { color: "var(--secondary)", bg: "var(--secondary-container)", icon: "info" },
  over: { color: "var(--error)", bg: "var(--error-container)", icon: "heart_broken" },
} as const;

export default function BudgetCategoryCard({ name, icon, budget, spent }: BudgetCategoryCardProps) {
  const pct = Math.round((spent / budget) * 100);
  const statusKey: keyof typeof STATUS = pct > 100 ? "over" : pct > 80 ? "warning" : "healthy";
  const s = STATUS[statusKey];

  return (
    <div
      className={`rounded-xl p-4 shadow-[0_4px_20px_rgba(255,209,220,0.1)] border transition-all hover:border-primary-container relative overflow-hidden ${
        statusKey === "over"
          ? "bg-error-container/20 border-error-container"
          : "bg-surface-container-lowest border-outline-variant/30"
      }`}
    >
      {/* Warning banner for nearly over */}
      {statusKey === "warning" && (
        <div className="absolute inset-0 bg-secondary-fixed/10 pointer-events-none" />
      )}

      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: s.bg }}>
            <span className="material-symbols-outlined text-2xl">{icon}</span>
          </div>
          <div>
            <h4 className="font-bold text-sm text-on-surface">{name}</h4>
            <p className="text-xs text-on-surface-variant">
              Budget: Rp {budget.toLocaleString("id-ID")}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-sm" style={{ color: s.color }}>
            Rp {spent.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] font-semibold" style={{ color: s.color }}>
            {pct}% terpakai
          </p>
        </div>
      </div>

      <div className="relative z-10">
        <ProgressBar value={Math.min(pct, 100)} color={s.color} indicator={pct > 100 ? "😭" : "💖"} size="sm" />
      </div>

      {/* Alert messages */}
      {statusKey === "warning" && (
        <div className="mt-2 bg-secondary-fixed rounded-lg p-2 flex items-center gap-1.5 relative z-10 border border-secondary-fixed-dim">
          <span className="material-symbols-outlined text-sm text-on-secondary-container">info</span>
          <p className="text-[11px] font-medium text-on-secondary-container">Yuk hemat sedikit lagi ya! 💖</p>
        </div>
      )}
      {statusKey === "over" && (
        <div className="mt-2 bg-error-container rounded-lg p-2 flex items-center gap-1.5 relative z-10">
          <span className="text-lg">😭</span>
          <p className="text-[11px] font-medium text-on-error-container">Sudah melebihi budget bulan ini!</p>
        </div>
      )}
    </div>
  );
}
