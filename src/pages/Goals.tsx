import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useFamily } from "@/lib/family-context";
import { toast } from "sonner";
import TopAppBar from "@/components/TopAppBar";
import SavingsGoalCard from "@/components/SavingsGoalCard";

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  icon: string;
  status: "active" | "achieved";
}

const GOAL_ICONS = ["travel", "home", "school", "directions_car", "card_giftcard", "favorite"];
const PRESET_GOALS = [
  { title: "Liburan", icon: "travel", target: 5000000 },
  { title: "Renovasi", icon: "home", target: 20000000 },
  { title: "Pendidikan", icon: "school", target: 10000000 },
  { title: "Kendaraan", icon: "directions_car", target: 50000000 },
];

export default function Goals() {
  const { family } = useFamily();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newIcon, setNewIcon] = useState("spa");

  useEffect(() => {
    if (family) loadGoals();
  }, [family]);

  const loadGoals = async () => {
    if (!family) return;
    // Load from supabase or fallback to localStorage
    const stored = localStorage.getItem(`goals_${family.id}`);
    if (stored) {
      setGoals(JSON.parse(stored));
    }
  };

  const saveGoals = (g: Goal[]) => {
    if (!family) return;
    localStorage.setItem(`goals_${family.id}`, JSON.stringify(g));
    setGoals(g);
  };

  const addGoal = () => {
    if (!newTitle || !newTarget) {
      toast.error("Isi judul dan target");
      return;
    }
    const goal: Goal = {
      id: Date.now().toString(),
      title: newTitle,
      target: Number(newTarget),
      current: 0,
      icon: newIcon,
      status: "active",
    };
    saveGoals([...goals, goal]);
    setNewTitle("");
    setNewTarget("");
    setNewIcon("spa");
    setAddOpen(false);
    toast.success("Target tabungan dibuat! 🎯");
  };

  const addContribution = (goalId: string, amount: number) => {
    const updated = goals.map((g) => {
      if (g.id !== goalId) return g;
      const newCurrent = g.current + amount;
      const achieved = newCurrent >= g.target;
      return {
        ...g,
        current: newCurrent,
        status: achieved ? ("achieved" as const) : g.status,
      };
    });
    saveGoals(updated);
    if (updated.find((g) => g.id === goalId)?.status === "achieved") {
      toast.success("🎉 Target tercapai! Selamat!");
    }
  };

  const removeGoal = (goalId: string) => {
    saveGoals(goals.filter((g) => g.id !== goalId));
    toast.success("Target dihapus");
  };

  return (
    <div className="min-h-dvh pb-32 bg-background">
      <TopAppBar title="Target Tabungan" showBack />

      <main className="px-5 md:px-10 max-w-4xl mx-auto pt-4 space-y-5">
        {/* Add button */}
        <button
          onClick={() => setAddOpen(true)}
          className="w-full h-14 rounded-xl border-2 border-dashed border-outline-variant/50 bg-surface-container-lowest/50 flex items-center justify-center gap-2 hover:border-primary hover:bg-primary-container/10 transition-all group"
        >
          <span className="material-symbols-outlined text-on-surface-variant/50 group-hover:text-primary">add_circle</span>
          <span className="font-semibold text-sm text-on-surface-variant/50 group-hover:text-primary">Tambah Target Baru</span>
        </button>

        {/* Goals list */}
        <div className="space-y-3">
          {goals.map((goal) => (
            <div key={goal.id} className="group relative">
              <SavingsGoalCard
                title={goal.title}
                current={goal.current}
                target={goal.target}
                icon={goal.icon}
                color={goal.status === "achieved" ? "var(--tertiary)" : "var(--primary)"}
                status={goal.status}
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={() => addContribution(goal.id, 500000)}
                  className="px-2 py-1 rounded-full bg-primary-container text-on-primary-container text-[10px] font-bold hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  +500k
                </button>
                <button
                  onClick={() => removeGoal(goal.id)}
                  className="w-6 h-6 rounded-full bg-error-container text-on-error-container flex items-center justify-center hover:bg-error hover:text-on-error transition-all"
                >
                  <span className="material-symbols-outlined text-xs">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {goals.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-on-primary-container">savings</span>
            </div>
            <p className="font-semibold text-on-surface">Belum ada target</p>
            <p className="text-sm text-on-surface-variant mt-1">Tambahkan target tabungan keluarga!</p>
          </div>
        )}

        {/* Presets */}
        <section>
          <h3 className="font-bold text-sm text-on-surface mb-3">Ide Target</h3>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_GOALS.map((p) => (
              <button
                key={p.title}
                onClick={() => {
                  setNewTitle(p.title);
                  setNewIcon(p.icon);
                  setNewTarget(String(p.target));
                  setAddOpen(true);
                }}
                className="bg-surface-container-lowest rounded-xl p-3 flex items-center gap-2 border border-outline-variant/20 hover:border-primary hover:-translate-y-1 transition-all shadow-[0_4px_15px_rgba(255,209,220,0.1)]"
              >
                <span className="material-symbols-outlined text-primary text-2xl">{p.icon}</span>
                <div className="text-left">
                  <p className="font-semibold text-xs text-on-surface">{p.title}</p>
                  <p className="text-[10px] text-on-surface-variant">Rp {p.target.toLocaleString("id-ID")}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* Add Goal Bottom Sheet */}
      {addOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center animate-fade-in">
          <div className="bg-surface-container-lowest rounded-t-2xl md:rounded-2xl w-full md:max-w-md max-h-[90vh] overflow-y-auto p-6 shadow-[0_-10px_40px_rgba(255,209,220,0.5)] space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-lg text-on-surface">Target Baru</h2>
              <button
                onClick={() => setAddOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">Judul</label>
              <input
                type="text"
                placeholder="e.g. Liburan Keluarga"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-surface-container border border-outline-variant text-sm font-medium text-on-surface outline-none focus:border-primary"
              />
            </div>

            {/* Target */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">Target (Rp)</label>
              <input
                type="number"
                placeholder="5000000"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-surface-container border border-outline-variant text-sm font-medium text-on-surface outline-none focus:border-primary"
              />
            </div>

            {/* Icon picker */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">Ikon</label>
              <div className="flex gap-2 flex-wrap">
                {GOAL_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewIcon(icon)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      newIcon === icon
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-container text-on-surface-variant hover:bg-primary-container"
                    }`}
                  >
                    <span className="material-symbols-outlined">{icon}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={addGoal}
              className="w-full h-12 rounded-full font-bold text-sm bg-primary text-primary-foreground active:scale-95 transition-all shadow-[0_4px_0_var(--on-primary-fixed-variant)] active:shadow-none active:translate-y-[2px]"
            >
              Buat Target
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
