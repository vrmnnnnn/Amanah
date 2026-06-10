interface TransactionCardProps {
  icon: string;
  label: string;
  note?: string;
  amount: number;
  type: "masuk" | "keluar";
  member?: string;
  time?: string;
  iconBg?: string;
  onClick?: () => void;
}

export default function TransactionCard({
  icon, label, note, amount, type, member, time, iconBg, onClick,
}: TransactionCardProps) {
  const isIncome = type === "masuk";
  const bg = iconBg || (isIncome ? "var(--tertiary-container)" : "var(--error-container)");
  const fg = isIncome ? "var(--on-tertiary-container)" : "var(--on-error-container)";
  const amtColor = isIncome ? "var(--tertiary)" : "var(--error)";

  return (
    <div
      onClick={onClick}
      className="bg-surface-container-lowest rounded-lg p-4 shadow-[0_4px_15px_rgba(255,209,220,0.15)] flex items-center gap-3 hover:-translate-y-1 transition-transform cursor-pointer group"
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shrink-0"
        style={{ background: bg, color: fg }}
      >
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-on-surface leading-tight">{label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {member && (
            <span className="text-[11px] text-on-surface-variant/60">{member}</span>
          )}
          {note && (
            <span className="text-[11px] text-on-surface-variant truncate">{note}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end shrink-0">
        <p className="font-bold text-sm" style={{ color: amtColor }}>
          {isIncome ? "+" : "-"} Rp {amount.toLocaleString("id-ID")}
        </p>
        {time && (
          <div className="flex items-center gap-1 text-on-surface-variant/40 mt-0.5">
            <span className="material-symbols-outlined text-[10px]">schedule</span>
            <span className="text-[10px]">{time}</span>
          </div>
        )}
      </div>
    </div>
  );
}
