import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useFamily } from "@/lib/family-context";
import { useCategories } from "@/lib/categories";
import TopAppBar from "@/components/TopAppBar";

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const COLOR_PALETTE = [
  "var(--primary-container)",
  "var(--secondary-container)",
  "var(--tertiary-container)",
  "var(--primary-fixed-dim)",
  "var(--secondary-fixed-dim)",
  "var(--surface-container-high)",
  "var(--surface-container-highest)",
  "var(--outline-variant)",
];

function catColor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}

export default function Calendar() {
  const { family } = useFamily();
  const { getLabel } = useCategories(family?.id);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!family) return;
    loadTransactions();
  }, [family]);

  const loadTransactions = async () => {
    if (!family) return;
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("family_id", family.id);
    if (data) setTransactions(data);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    // Padding for start of month
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);
    return cells;
  }, [year, month]);

  // Transactions grouped by date
  const txByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const tx of transactions) {
      const d = new Date(tx.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }
    return map;
  }, [transactions]);

  const selectedTxs = useMemo(() => {
    if (!selectedDate) return [];
    return txByDate.get(selectedDate) || [];
  }, [selectedDate, txByDate]);

  const dateLabel = viewDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div className="min-h-dvh pb-32 bg-background">
      <TopAppBar title="Kalender Keuangan" showBack />

      <main className="px-5 md:px-10 max-w-4xl mx-auto pt-4 space-y-5">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-primary-container transition-all"
          >
            <span className="material-symbols-outlined text-on-surface-variant">chevron_left</span>
          </button>
          <h2 className="font-extrabold text-lg text-on-surface">{dateLabel}</h2>
          <button
            onClick={nextMonth}
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-primary-container transition-all"
          >
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_4px_20px_rgba(255,209,220,0.15)] border border-outline-variant/30">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[11px] font-bold text-on-surface-variant/50 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((day, i) => {
              if (day === null) return <div key={`pad-${i}`} className="aspect-square" />;

              const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayTxs = txByDate.get(dateKey) || [];
              const isToday =
                new Date().getFullYear() === year &&
                new Date().getMonth() === month &&
                new Date().getDate() === day;
              const isSelected = selectedDate === dateKey;

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-semibold transition-all relative ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : isToday
                      ? "bg-primary-container text-on-primary-container ring-2 ring-primary"
                      : "hover:bg-primary-container/30 text-on-surface"
                  }`}
                >
                  <span>{day}</span>
                  {dayTxs.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {[...new Set(dayTxs.map((tx) => tx.category))].slice(0, 3).map((cat) => (
                        <div
                          key={cat}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: catColor(cat) }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected date details */}
        {selectedDate && (
          <section className="animate-fade-in space-y-3">
            <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">today</span>
              {new Date(selectedDate).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h3>

            {selectedTxs.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-4">
                Tidak ada transaksi di tanggal ini
              </p>
            ) : (
              <div className="space-y-2">
                {selectedTxs.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-surface-container-lowest rounded-lg p-3 flex items-center gap-3 border border-outline-variant/20 shadow-sm"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: catColor(tx.category) }}
                    >
                      <span className="text-xs font-bold text-on-surface">
                        {getLabel(tx.category)[0] || "?"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-on-surface">
                        {getLabel(tx.category)}
                      </p>
                      {tx.note && (
                        <p className="text-[10px] text-on-surface-variant truncate">{tx.note}</p>
                      )}
                    </div>
                    <p
                      className={`font-bold text-xs ${
                        tx.type === "masuk" ? "text-tertiary" : "text-on-surface"
                      }`}
                    >
                      {tx.type === "masuk" ? "+" : "-"} Rp {Number(tx.amount).toLocaleString("id-ID")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
