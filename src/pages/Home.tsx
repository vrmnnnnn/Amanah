import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { authClient } from "@/lib/auth-client";
import { ArrowDownToLine, ArrowUpFromLine, Users, AlertTriangle } from "lucide-react";

const BUDGET_KEY = "amanah-budget";
const CHART_COLORS = ["#0d9488", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

interface FamilyMember {
  id: string;
  name: string;
  role: string;
}

export default function Home() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [totalMasuk, setTotalMasuk] = useState(0);
  const [totalKeluar, setTotalKeluar] = useState(0);
  const [budget, setBudget] = useState<number | null>(null);
  const [catByMonth, setCatByMonth] = useState<{ name: string; amount: number; color: string }[]>([]);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (!session?.user) return;
    loadData();
    const stored = localStorage.getItem(BUDGET_KEY);
    if (stored) setBudget(Number(stored));
  }, [session]);

  const loadData = async () => {
    const { data: m } = await supabase
      .from("family_members")
      .select("*")
      .eq("user_id", session?.user?.id);

    const { data: t } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", session?.user?.id);

    if (t) {
      // Totals
      setTotalMasuk(
        t.filter((tx: any) => tx.type === "masuk").reduce((a: number, tx: any) => a + tx.amount, 0)
      );
      const keluarTotal = t
        .filter((tx: any) => tx.type === "keluar")
        .reduce((a: number, tx: any) => a + tx.amount, 0);
      setTotalKeluar(keluarTotal);

      // Current month spending by category
      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const catMap: Record<string, number> = {};
      t.filter((tx: any) => {
        if (tx.type !== "keluar") return false;
        const d = new Date(tx.created_at);
        const txMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return txMonth === thisMonth;
      }).forEach((tx: any) => {
        catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount;
      });
      const labels: Record<string, string> = {
        makan: "Makan", transport: "Transport", belanja: "Belanja",
        tagihan: "Tagihan", gaji: "Gaji", lainnya: "Lainnya",
      };
      const entries = Object.entries(catMap)
        .sort(([, a], [, b]) => b - a)
        .map(([cat, amt], i) => ({
          name: labels[cat] || cat,
          amount: amt,
          color: CHART_COLORS[i % CHART_COLORS.length],
        }));
      setCatByMonth(entries);
    }

    if (m) setMembers(m);
  };

  const saldo = totalMasuk - totalKeluar;
  const budgetPercent = budget && budget > 0 ? Math.min((totalKeluar / budget) * 100, 100) : 0;
  const budgetWarning = budget && totalKeluar > budget;

  // Simple SVG donut chart
  const totalChart = catByMonth.reduce((s, c) => s + c.amount, 0);
  let cumulative = 0;
  const slices = catByMonth.map((c) => {
    const start = cumulative;
    cumulative += c.amount;
    const end = cumulative;
    return { ...c, start, end };
  });

  return (
    <div className="min-h-dvh pb-24" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="bg-[var(--navy)] text-[#faf9f7] px-5 pt-14 pb-10 rounded-b-[2rem]">
        <h1 className="text-center text-lg font-semibold tracking-tight opacity-80">
          Amanah
        </h1>
        <div className="mt-6 text-center">
          <p className="text-[13px] font-medium uppercase tracking-wider" style={{ color: "var(--navy-light)" }}>
            Saldo Keluarga
          </p>
          <p className="text-[2.75rem] font-bold mt-1 tracking-heading leading-none">
            Rp {saldo.toLocaleString("id-ID")}
          </p>
        </div>

        {/* Summary pills */}
        <div className="flex justify-center gap-3 mt-5">
          <div className="flex items-center gap-1.5 bg-white/[0.08] rounded-full px-4 py-1.5 text-[13px]">
            <ArrowDownToLine size={14} className="text-[var(--green)]" />
            <span className="text-[var(--green)] font-semibold">
              +Rp {totalMasuk.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/[0.08] rounded-full px-4 py-1.5 text-[13px]">
            <ArrowUpFromLine size={14} className="text-red-400" />
            <span className="text-red-400 font-semibold">
              -Rp {totalKeluar.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-5">
        {/* Budget warning */}
        {budgetWarning && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 animate-fade-in">
            <AlertTriangle size={16} className="text-red-500 shrink-0" />
            <p className="text-[13px] font-medium text-red-600 dark:text-red-400">
              Pengeluaran sudah melebihi budget! Rp {totalKeluar.toLocaleString("id-ID")} dari Rp {budget!.toLocaleString("id-ID")}
            </p>
          </div>
        )}

        {/* Budget progress bar */}
        {budget && budget > 0 && !budgetWarning && (
          <div className="card-layered p-4 animate-fade-in">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Budget Bulanan
              </p>
              <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                Rp {totalKeluar.toLocaleString("id-ID")} / Rp {budget.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-hover)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${budgetPercent}%`,
                  background: budgetPercent > 80 ? "#ef4444" : budgetPercent > 50 ? "#f59e0b" : "var(--green)",
                }}
              />
            </div>
          </div>
        )}

        {/* Chart — spending breakdown */}
        {catByMonth.length > 0 && totalChart > 0 && (
          <div className="card-layered p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
              Pengeluaran Bulan Ini
            </h2>
            <div className="flex items-center gap-4">
              {/* Donut chart */}
              <svg viewBox="0 0 100 100" className="size-24 shrink-0 -rotate-90">
                {slices.map((s, i) => {
                  const startAngle = (s.start / totalChart) * 360;
                  const endAngle = (s.end / totalChart) * 360;
                  const r = 40;
                  const cx = 50, cy = 50;
                  const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180);
                  const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180);
                  const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180);
                  const y2 = cy + r * Math.sin((endAngle * Math.PI) / 180);
                  const large = endAngle - startAngle > 180 ? 1 : 0;
                  return (
                    <path
                      key={i}
                      d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
                      fill={s.color}
                      opacity={0.85}
                    />
                  );
                })}
                <circle cx="50" cy="50" r="24" fill="var(--surface)" />
              </svg>

              {/* Legend */}
              <div className="flex-1 min-w-0 space-y-1.5">
                {catByMonth.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="size-2 rounded-full shrink-0" style={{ background: c.color }} />
                      <span className="truncate" style={{ color: "var(--text)" }}>{c.name}</span>
                    </div>
                    <span className="font-medium ml-2 shrink-0" style={{ color: "var(--text-muted)" }}>
                      Rp {c.amount.toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
                {catByMonth.length > 5 && (
                  <p className="text-[10px]" style={{ color: "var(--text-faded)" }}>
                    +{catByMonth.length - 5} lainnya
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Members section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} style={{ color: "var(--text-muted)" }} />
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Anggota Keluarga
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {members.map((m) => (
              <div key={m.id} className="card-layered p-3.5 flex items-center gap-3">
                <div className="size-11 rounded-full flex items-center justify-center text-base font-bold" style={{ background: "var(--surface-hover)", color: "var(--text)", opacity: 0.6 }}>
                  {m.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>
                    {m.name}
                  </p>
                  <Badge
                    variant="secondary"
                    className="text-[10px] capitalize h-5 px-1.5 mt-0.5 border-0"
                    style={{ background: "var(--surface-hover)", color: "var(--text-muted)" }}
                  >
                    {m.role.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {members.length === 0 && (
            <div className="card-layered text-center py-10 px-4">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Belum ada anggota keluarga.
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-faded)" }}>
                Tambahkan di tab Anggota.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
