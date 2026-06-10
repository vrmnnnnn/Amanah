import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useFamily } from "@/lib/family-context";
import { useCategories } from "@/lib/categories";
import TopAppBar from "@/components/TopAppBar";

const PERIODS = [
  { key: "7d", label: "7H" },
  { key: "30d", label: "30H" },
  { key: "90d", label: "90H" },
] as const;

export default function Stats() {
  const { family } = useFamily();
  const { getLabel, getIcon } = useCategories(family?.id);
  const [period, setPeriod] = useState<string>("30d");
  const [totalMasuk, setTotalMasuk] = useState(0);
  const [totalKeluar, setTotalKeluar] = useState(0);
  const [catBreakdown, setCatBreakdown] = useState<{ name: string; amount: number; icon: string }[]>([]);
  const [topSpenders, setTopSpenders] = useState<{ name: string; total: number }[]>([]);
  const [trend, setTrend] = useState<string>("stabil");

  useEffect(() => {
    if (!family) return;
    loadStats();
  }, [family, period]);

  const loadStats = async () => {
    if (!family) return;
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("family_id", family.id);

    if (!data) return;

    const days = parseInt(period);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const recent = data.filter((tx: any) => new Date(tx.created_at) >= cutoff);
    const masuk = recent.filter((tx: any) => tx.type === "masuk");
    const keluar = recent.filter((tx: any) => tx.type === "keluar");

    const tMasuk = masuk.reduce((a: number, tx: any) => a + Number(tx.amount), 0);
    const tKeluar = keluar.reduce((a: number, tx: any) => a + Number(tx.amount), 0);
    setTotalMasuk(tMasuk);
    setTotalKeluar(tKeluar);

    // Category breakdown
    const catMap: Record<string, number> = {};
    keluar.forEach((tx: any) => {
      catMap[tx.category] = (catMap[tx.category] || 0) + Number(tx.amount);
    });
    setCatBreakdown(
      Object.entries(catMap)
        .sort(([, a], [, b]) => b - a)
        .map(([cat, amt]) => ({
          name: getLabel(cat),
          amount: amt,
          icon: getIcon(cat),
        }))
    );

    // Top spenders (simplified — by member_id count)
    const memberMap: Record<string, number> = {};
    keluar.forEach((tx: any) => {
      if (tx.member_id) {
        memberMap[tx.member_id] = (memberMap[tx.member_id] || 0) + Number(tx.amount);
      }
    });
    // We don't have member names here, just IDs — simplified
    setTopSpenders(
      Object.entries(memberMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([id, total]) => ({ name: `Anggota ${id.slice(0, 6)}`, total }))
    );

    // Trend computation
    if (tKeluar > tMasuk * 1.1) setTrend("boros");
    else if (tMasuk > tKeluar * 1.1) setTrend("hemat");
    else setTrend("stabil");
  };

  const maxCat = catBreakdown[0]?.amount || 1;
  const balance = totalMasuk - totalKeluar;

  const trendEmoji = trend === "boros" ? "📉" : trend === "hemat" ? "📈" : "➡️";
  const trendMsg =
    trend === "boros"
      ? "Pengeluaran lebih besar dari pemasukan, yuk hemat!"
      : trend === "hemat"
      ? "Keren! Pemasukan lebih besar dari pengeluaran."
      : "Keuangan stabil, tetap dijaga ya!";

  return (
    <div className="min-h-dvh pb-32 bg-background">
      <TopAppBar title="Statistik" showBack />

      <main className="px-5 md:px-10 max-w-4xl mx-auto pt-4 space-y-6">
        {/* Period filter chips */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${
                period === p.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-container text-on-surface-variant hover:bg-primary-container/50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Total summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-container-lowest rounded-xl p-3 text-center shadow-[0_4px_15px_rgba(255,209,220,0.15)] border border-outline-variant/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Masuk</p>
            <p className="text-sm font-extrabold text-tertiary leading-tight">
              +{(totalMasuk / 1000).toFixed(0)}k
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-3 text-center shadow-[0_4px_15px_rgba(255,209,220,0.15)] border border-outline-variant/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Keluar</p>
            <p className="text-sm font-extrabold text-error leading-tight">
              -{(totalKeluar / 1000).toFixed(0)}k
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-3 text-center shadow-[0_4px_15px_rgba(255,209,220,0.15)] border border-outline-variant/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Saldo</p>
            <p className={`text-sm font-extrabold leading-tight ${balance >= 0 ? "text-tertiary" : "text-error"}`}>
              {balance >= 0 ? "+" : ""}{(balance / 1000).toFixed(0)}k
            </p>
          </div>
        </div>

        {/* AI Insight card */}
        <div className="bg-gradient-to-br from-primary-container to-secondary-container rounded-xl p-5 shadow-[0_10px_30px_rgba(255,209,220,0.4)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-6 -mt-6 blur-xl" />
          <div className="relative z-10 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center shrink-0">
              <span className="text-xl">{trendEmoji}</span>
            </div>
            <div>
              <p className="font-bold text-sm text-on-primary-container mb-1">
                Insight AI {">"}
              </p>
              <p className="text-xs text-on-primary-container/70 leading-relaxed">{trendMsg}</p>
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        {catBreakdown.length > 0 && (
          <section>
            <h3 className="font-bold text-sm text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">pie_chart</span>
              Pengeluaran per Kategori
            </h3>
            <div className="space-y-3">
              {catBreakdown.map((c) => {
                const pct = Math.max(Math.round((c.amount / maxCat) * 100), 2);
                return (
                  <div key={c.name} className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "var(--surface-container-high)", color: "var(--on-surface-variant)" }}
                    >
                      <span className="material-symbols-outlined text-lg">{c.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-xs font-semibold text-on-surface">{c.name}</span>
                        <span className="text-xs font-bold text-on-surface-variant">
                          Rp {c.amount.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="h-2.5 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Top spenders */}
        {topSpenders.length > 0 && (
          <section>
            <h3 className="font-bold text-sm text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">leaderboard</span>
              Top Spender
            </h3>
            <div className="space-y-2">
              {topSpenders.map((s, i) => (
                <div
                  key={s.name}
                  className="flex items-center gap-3 bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/20"
                >
                  <span className="text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                  <span className="font-semibold text-sm text-on-surface flex-1">{s.name}</span>
                  <span className="font-bold text-sm text-on-surface-variant">
                    Rp {s.total.toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {catBreakdown.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-on-primary-container">insights</span>
            </div>
            <p className="font-semibold text-on-surface">Belum ada data</p>
            <p className="text-sm text-on-surface-variant mt-1">Statistik akan muncul setelah ada transaksi</p>
          </div>
        )}
      </main>
    </div>
  );
}
