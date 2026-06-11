import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useFamily, getMemberDisplayName, getMemberAvatar } from "@/lib/family-context";
import { useCategories } from "@/lib/categories";
import { useAccounts } from "@/lib/accounts";
import TopAppBar from "@/components/TopAppBar";
import ProgressBar from "@/components/ProgressBar";
import TransactionCard from "@/components/TransactionCard";

export default function Home() {
  const { family, members } = useFamily();
  const { getLabel, getIcon } = useCategories(family?.id);
  const { accounts } = useAccounts(family?.id);
  const [totalMasuk, setTotalMasuk] = useState(0);
  const [totalKeluar, setTotalKeluar] = useState(0);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [catBreakdown, setCatBreakdown] = useState<{ name: string; amount: number }[]>([]);

  useEffect(() => {
    if (!family) return;
    loadData();
  }, [family]);

  const loadData = async () => {
    if (!family) return;

    const { data: t } = await supabase
      .from("transactions")
      .select("*")
      .eq("family_id", family.id)
      .order("created_at", { ascending: false });

    if (t) {
      const masuk = t.filter((tx: any) => tx.type === "masuk");
      const keluar = t.filter((tx: any) => tx.type === "keluar");

      setTotalMasuk(masuk.reduce((a: number, tx: any) => a + Number(tx.amount), 0));
      setTotalKeluar(keluar.reduce((a: number, tx: any) => a + Number(tx.amount), 0));
      setRecentTx(t.slice(0, 4));

      // Category breakdown this month
      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const catMap: Record<string, number> = {};
      keluar
        .filter((tx: any) => {
          const d = new Date(tx.created_at);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === thisMonth;
        })
        .forEach((tx: any) => {
          catMap[tx.category] = (catMap[tx.category] || 0) + Number(tx.amount);
        });

      setCatBreakdown(
        Object.entries(catMap)
          .sort(([, a], [, b]) => b - a)
          .map(([cat, amt]) => ({ name: getLabel(cat), amount: amt }))
      );
    }
  };

  const saldo = totalMasuk - totalKeluar;
  const sisa = totalMasuk - totalKeluar;

  return (
    <div className="min-h-dvh pb-32" style={{ background: "var(--background)" }}>
      <TopAppBar />

      <main className="px-5 md:px-10 max-w-4xl mx-auto space-y-6 pt-4">
        {/* ── Total Balance Card ── */}
        <section className="bg-gradient-to-br from-primary-container to-primary-fixed-dim rounded-xl p-6 shadow-[0_10px_30px_rgba(255,209,220,0.4)] relative overflow-hidden text-on-primary-container">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-20 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary-container opacity-40 rounded-full -ml-8 -mb-8 blur-lg" />
          <div className="relative z-10 flex flex-col items-center text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              Saldo Keluarga
            </span>
            <h2 className="text-[2.5rem] font-extrabold text-on-primary-fixed leading-none tracking-tight">
              Rp {saldo.toLocaleString("id-ID")}
            </h2>
            <div className="bg-white/30 backdrop-blur-md rounded-full px-4 py-1.5">
              <p className="text-xs font-semibold">
                Sisa: Rp {sisa.toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        </section>

        {/* ── Account Balances ── */}
        {accounts.length > 0 && (
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 snap-x">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="snap-start flex-shrink-0 bg-surface-container-lowest rounded-xl px-4 py-3 min-w-[140px] shadow-[0_4px_15px_rgba(255,209,220,0.15)] border border-outline-variant/20"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="material-symbols-outlined text-xs text-primary">
                    {acc.type === "tunai" ? "payments" : acc.type === "bank" ? "account_balance" : "phone_android"}
                  </span>
                  <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                    {acc.type}
                  </span>
                </div>
                <p className="text-xs font-bold text-on-surface truncate">{acc.name}</p>
                <p className={`text-sm font-extrabold mt-1 ${(acc.balance ?? 0) >= 0 ? "text-primary" : "text-error"}`}>
                  Rp {(acc.balance ?? 0).toLocaleString("id-ID")}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Bento Grid Stats ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_4px_15px_rgba(255,209,220,0.15)] border border-outline-variant/20">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-tertiary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-base text-on-tertiary-container">trending_down</span>
              </div>
              <span className="text-xs font-semibold text-on-surface-variant">Pemasukan</span>
            </div>
            <p className="text-lg font-extrabold text-tertiary">
              +Rp {totalMasuk.toLocaleString("id-ID")}
            </p>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_4px_15px_rgba(255,209,220,0.15)] border border-outline-variant/20">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-error-container flex items-center justify-center">
                <span className="material-symbols-outlined text-base text-on-error-container">trending_up</span>
              </div>
              <span className="text-xs font-semibold text-on-surface-variant">Pengeluaran</span>
            </div>
            <p className="text-lg font-extrabold text-error">
              -Rp {totalKeluar.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        {/* ── Savings Target Progress ── */}
        {(() => {
          const target = 5000000; // Could be dynamic later
          const pct = totalMasuk > 0 ? Math.min(Math.round((saldo / target) * 100), 100) : 0;
          return (
            <section className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_4px_15px_rgba(255,209,220,0.15)] border border-outline-variant/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">spa</span>
                  <h3 className="font-bold text-sm text-on-surface">Target Tabungan</h3>
                </div>
                <span className="text-xs font-bold text-primary">{pct}%</span>
              </div>
              <ProgressBar
                value={pct}
                color="var(--primary)"
                indicator="⭐"
                size="sm"
              />
              <p className="text-xs text-center mt-2 text-on-surface-variant">
                Rp {saldo.toLocaleString("id-ID")} dari Rp {target.toLocaleString("id-ID")}
              </p>
            </section>
          );
        })()}

        {/* ── Family Members ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">family_restroom</span>
              Anggota Keluarga
            </h3>
            <span className="text-xs text-on-surface-variant">{members.length} orang</span>
          </div>

          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {members.map((m) => (
              <div key={m.id} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary-container shrink-0">
                  <img
                    alt=""
                    className="w-full h-full object-cover"
                    src={getMemberAvatar(m, 80)}
                  />
                </div>
                <p className="text-[11px] font-semibold text-on-surface text-center">
                  {getMemberDisplayName(m)}
                </p>
              </div>
            ))}
            {members.length === 0 && (
              <div className="w-full text-center py-8">
                <p className="text-sm text-on-surface-variant">Belum ada anggota keluarga</p>
                <p className="text-xs text-on-surface-variant/50 mt-1">Bagikan kode invite ke keluarga</p>
              </div>
            )}
          </div>
        </section>

        {/* ── Recent Activity ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              Aktivitas Terbaru
            </h3>
            <span className="text-xs text-primary cursor-pointer font-semibold">Lihat Semua</span>
          </div>

          <div className="space-y-3">
            {recentTx.map((tx: any) => (
              <TransactionCard
                key={tx.id}
                icon={getIcon(tx.category)}
                label={getLabel(tx.category)}
                note={tx.note}
                amount={Number(tx.amount)}
                type={tx.type}
                member={members.find((m) => m.user_id === tx.user_id)?.name || members.find((m) => m.user_id === tx.user_id)?.role}
                time={new Date(tx.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              />
            ))}
            {recentTx.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-on-surface-variant">Belum ada transaksi</p>
                <p className="text-xs text-on-surface-variant/50 mt-1">Mulai catat transaksi pertama!</p>
              </div>
            )}
          </div>
        </section>

        {/* ── Monthly Category Breakdown ── */}
        {catBreakdown.length > 0 && (
          <section className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_4px_15px_rgba(255,209,220,0.15)] border border-outline-variant/20">
            <h3 className="font-bold text-sm text-on-surface mb-3">Pengeluaran Bulan Ini</h3>
            <div className="space-y-2">
              {catBreakdown.map((c) => {
                const max = catBreakdown[0]?.amount || 1;
                const pct = Math.round((c.amount / max) * 100);
                return (
                  <div key={c.name} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-on-surface w-20 truncate">{c.name}</span>
                    <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-on-surface-variant w-24 text-right">
                      Rp {c.amount.toLocaleString("id-ID")}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
