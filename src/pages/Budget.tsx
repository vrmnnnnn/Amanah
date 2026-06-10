import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useFamily } from "@/lib/family-context";
import { toast } from "sonner";
import TopAppBar from "@/components/TopAppBar";
import BudgetCategoryCard from "@/components/BudgetCategoryCard";

interface CategoryBudget {
  name: string;
  icon: string;
  budget: number;
  spent: number;
}

const DEFAULT_BUDGETS: CategoryBudget[] = [
  { name: "Makan", icon: "restaurant", budget: 3000000, spent: 0 },
  { name: "Transport", icon: "directions_car", budget: 1000000, spent: 0 },
  { name: "Belanja", icon: "shopping_bag", budget: 2000000, spent: 0 },
  { name: "Tagihan", icon: "bolt", budget: 1500000, spent: 0 },
  { name: "Lainnya", icon: "category", budget: 1000000, spent: 0 },
];

const CAT_MAP: Record<string, string> = {
  makan: "Makan",
  transport: "Transport",
  belanja: "Belanja",
  tagihan: "Tagihan",
  lainnya: "Lainnya",
};

export default function Budget() {
  const { family } = useFamily();
  const [editing, setEditing] = useState(false);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [editBudgets, setEditBudgets] = useState<CategoryBudget[]>([]);

  useEffect(() => {
    if (family) loadBudgets();
  }, [family]);

  const loadBudgets = async () => {
    if (!family) return;
    // Load budget config from localStorage
    const stored = localStorage.getItem(`budget_${family.id}`);
    const base = stored ? JSON.parse(stored) as CategoryBudget[] : DEFAULT_BUDGETS;
    setBudgets(base);
    setEditBudgets(JSON.parse(JSON.stringify(base)));

    // Calculate spent from transactions this month
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("family_id", family.id)
      .eq("type", "keluar");

    if (data) {
      const spentMap: Record<string, number> = {};
      data
        .filter((tx: any) => {
          const d = new Date(tx.created_at);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === thisMonth;
        })
        .forEach((tx: any) => {
          const label = CAT_MAP[tx.category] || "Lainnya";
          spentMap[label] = (spentMap[label] || 0) + Number(tx.amount);
        });

      setBudgets((prev) =>
        prev.map((b) => ({ ...b, spent: spentMap[b.name] || 0 }))
      );
    }
  };

  const saveBudgets = () => {
    if (!family) return;
    localStorage.setItem(`budget_${family.id}`, JSON.stringify(editBudgets));
    setBudgets(editBudgets.map((b) => ({ ...b, spent: budgets.find((bb) => bb.name === b.name)?.spent || 0 })));
    setEditing(false);
    toast.success("Budget disimpan! 💖");
  };

  const totalBudget = budgets.reduce((a, b) => a + b.budget, 0);
  const totalSpent = budgets.reduce((a, b) => a + b.spent, 0);
  const totalPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <div className="min-h-dvh pb-32 bg-background">
      <TopAppBar title="Budget Bulanan" showBack />

      <main className="px-5 md:px-10 max-w-4xl mx-auto pt-4 space-y-5">
        {/* Total Summary Card */}
        <div className="bg-gradient-to-br from-primary-container to-primary-fixed-dim rounded-xl p-6 shadow-[0_10px_30px_rgba(255,209,220,0.4)] text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative z-10 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-on-primary-container/70">Budget Bulan Ini</p>
            <p className="text-[2.5rem] font-extrabold text-on-primary-fixed leading-none">
              Rp {(totalBudget - totalSpent).toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-on-primary-container/70">
              Sisa dari Rp {totalBudget.toLocaleString("id-ID")} ({totalPct}% terpakai)
            </p>
            <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  totalPct > 100 ? "bg-error" : "bg-white"
                }`}
                style={{ width: `${Math.min(totalPct, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Edit / Save toggle */}
        <div className="flex justify-end">
          {editing ? (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-full text-xs font-bold bg-surface-container text-on-surface-variant"
              >
                Batal
              </button>
              <button
                onClick={saveBudgets}
                className="px-4 py-2 rounded-full text-xs font-bold bg-primary text-primary-foreground"
              >
                Simpan
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-surface-container text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-all"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Atur Budget
            </button>
          )}
        </div>

        {/* Category budgets */}
        <div className="space-y-3">
          {(editing ? editBudgets : budgets).map((b, i) => (
            editing ? (
              <div key={b.name} className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/20 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-on-surface-variant">{b.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-on-surface mb-1">{b.name}</p>
                  <input
                    type="number"
                    value={b.budget}
                    onChange={(e) => {
                      const next = [...editBudgets];
                      next[i] = { ...next[i], budget: Number(e.target.value) };
                      setEditBudgets(next);
                    }}
                    className="w-full h-10 rounded-lg bg-surface-container border border-outline-variant px-3 text-sm font-semibold text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>
            ) : (
              <BudgetCategoryCard
                key={b.name}
                name={b.name}
                icon={b.icon}
                budget={b.budget}
                spent={b.spent}
              />
            )
          ))}
        </div>
      </main>
    </div>
  );
}
