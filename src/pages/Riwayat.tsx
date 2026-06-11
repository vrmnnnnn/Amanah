import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useFamily, getMemberDisplayName } from "@/lib/family-context";
import { useCategories } from "@/lib/categories";
import { toast } from "sonner";
import TopAppBar from "@/components/TopAppBar";
import TransactionCard from "@/components/TransactionCard";

export default function Riwayat() {
  const { family, members } = useFamily();
  const { getLabel, getIcon, getByType } = useCategories(family?.id);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Edit state
  const [editing, setEditing] = useState<any>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editType, setEditType] = useState("");
  const [editMemberId, setEditMemberId] = useState("");

  useEffect(() => {
    if (!family) return;
    loadTransactions();
  }, [family]);

  const loadTransactions = async () => {
    if (!family) return;
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("family_id", family.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) setTransactions(data);
  };

  const deleteTransaction = async (id: string) => {
    await supabase.from("transactions").delete().eq("id", id);
    toast.success("Transaksi dihapus");
    loadTransactions();
  };

  const openEdit = (tx: any) => {
    setEditing(tx);
    setEditAmount(String(tx.amount));
    setEditCategory(tx.category);
    setEditNote(tx.note || "");
    setEditType(tx.type);
    setEditMemberId(tx.member_id || "");
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase
      .from("transactions")
      .update({
        amount: parseFloat(editAmount),
        category: editCategory,
        note: editNote,
        type: editType,
        member_id: editMemberId || null,
      })
      .eq("id", editing.id);
    if (error) {
      toast.error("Gagal update: " + error.message);
    } else {
      toast.success("Transaksi diupdate");
      setEditing(null);
      loadTransactions();
    }
  };

  const exportCSV = () => {
    if (filtered.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }
    const rows = filtered.map((tx) => {
      const date = new Date(tx.created_at).toLocaleDateString("id-ID");
      const memberName = members.find((m) => m.id === tx.member_id)?.name || members.find((m) => m.id === tx.member_id)?.role || "Semua";
      return [
        date,
        tx.type === "masuk" ? "Masuk" : "Keluar",
        tx.amount,
        getLabel(tx.category),
        tx.note || "",
        memberName,
      ];
    });
    const header = ["Tanggal", "Tipe", "Jumlah", "Kategori", "Catatan", "Anggota"];
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `amanah-riwayat-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV didownload");
  };

  // Month options
  const months = useMemo(() => {
    const result: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      result.push({
        value: `${y}-${m}`,
        label: d.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
      });
    }
    return result;
  }, []);

  const allCats = useMemo(
    () => [...new Set(transactions.map((t) => t.category))],
    [transactions]
  );

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (search) {
        const s = search.toLowerCase();
        const cat = getLabel(tx.category).toLowerCase();
        const note = (tx.note || "").toLowerCase();
        const role = (members.find((m) => m.id === tx.member_id)?.name || members.find((m) => m.id === tx.member_id)?.role || "").toLowerCase();
        if (!cat.includes(s) && !note.includes(s) && !role.includes(s)) return false;
      }
      if (filterMonth) {
        const d = new Date(tx.created_at);
        const txMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (txMonth !== filterMonth) return false;
      }
      if (filterCategory !== "all" && tx.category !== filterCategory) return false;
      if (filterType !== "all" && tx.type !== filterType) return false;
      return true;
    });
  }, [transactions, search, filterMonth, filterCategory, filterType, members]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const tx of filtered) {
      const key = new Date(tx.created_at).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }
    return map;
  }, [filtered]);

  return (
    <div className="min-h-dvh pb-32 bg-background">
      <TopAppBar title="Riwayat" showBack />

      <main className="px-5 md:px-10 max-w-4xl mx-auto pt-4 space-y-4">
        {/* Search bar */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/50">
            search
          </span>
          <input
            type="text"
            placeholder="Cari transaksi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-full bg-surface-container-lowest border border-outline-variant text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-container/50 transition-all placeholder:text-on-surface-variant/40"
          />
          {/* Export + filter */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <button
              onClick={exportCSV}
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant/50 hover:text-primary hover:bg-primary-container/30 transition-all"
              title="Export CSV"
            >
              <span className="material-symbols-outlined text-lg">download</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                showFilters || filterMonth || filterCategory !== "all" || filterType !== "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-on-surface-variant/50 hover:text-primary hover:bg-primary-container/30"
              }`}
              title="Filter"
            >
              <span className="material-symbols-outlined text-lg">filter_list</span>
            </button>
          </div>
        </div>

        {/* Filter chips */}
        {showFilters && (
          <div className="animate-fade-in bg-surface-container-lowest rounded-xl p-4 shadow-[0_4px_15px_rgba(255,209,220,0.15)] border border-outline-variant/30 flex flex-wrap gap-2">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-surface-container rounded-full px-4 py-2 text-xs font-semibold border border-outline-variant outline-none text-on-surface-variant"
            >
              <option value="">Semua Bulan</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-surface-container rounded-full px-4 py-2 text-xs font-semibold border border-outline-variant outline-none text-on-surface-variant"
            >
              <option value="all">Semua Tipe</option>
              <option value="masuk">💰 Masuk</option>
              <option value="keluar">💸 Keluar</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-surface-container rounded-full px-4 py-2 text-xs font-semibold border border-outline-variant outline-none text-on-surface-variant"
            >
              <option value="all">Semua Kategori</option>
              {allCats.map((c) => (
                <option key={c} value={c}>{getLabel(c)}</option>
              ))}
            </select>

            {(filterMonth || filterCategory !== "all" || filterType !== "all") && (
              <button
                onClick={() => {
                  setFilterMonth("");
                  setFilterCategory("all");
                  setFilterType("all");
                }}
                className="rounded-full px-4 py-2 text-xs font-semibold bg-error-container text-on-error-container hover:bg-error hover:text-on-error transition-all"
              >
                ✕ Reset
              </button>
            )}
          </div>
        )}

        {/* Transaction list — grouped by date */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-on-primary-container">
                {transactions.length === 0 ? "edit_note" : "search_off"}
              </span>
            </div>
            <p className="font-semibold text-on-surface">
              {transactions.length === 0 ? "Belum ada transaksi" : "Tidak ada hasil"}
            </p>
            <p className="text-sm text-on-surface-variant mt-1">
              {transactions.length === 0 ? "Yuk mulai catat transaksi!" : "Coba ubah filter atau kata kunci"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {[...grouped.entries()].map(([date, txs]) => (
              <section key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-1 rounded-full bg-primary" />
                  <h3 className="font-bold text-sm text-on-surface">{date}</h3>
                </div>
                <div className="space-y-2">
                  {txs.map((tx) => (
                    <div key={tx.id} className="group relative">
                      <TransactionCard
                        icon={getIcon(tx.category)}
                        label={getLabel(tx.category)}
                        note={tx.note}
                        amount={Number(tx.amount)}
                        type={tx.type}
                        member={members.find((m) => m.id === tx.member_id)?.name || members.find((m) => m.id === tx.member_id)?.role}
                        time={new Date(tx.created_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        onClick={() => openEdit(tx)}
                      />
                      {/* Swipe-to-delete (visual) — tap to reveal */}
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(tx);
                          }}
                          className="w-8 h-8 rounded-full bg-surface-container hover:bg-primary-container flex items-center justify-center transition-colors"
                        >
                          <span className="material-symbols-outlined text-base text-on-surface-variant">edit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTransaction(tx.id);
                          }}
                          className="w-8 h-8 rounded-full bg-surface-container hover:bg-error-container flex items-center justify-center transition-colors"
                        >
                          <span className="material-symbols-outlined text-base text-on-surface-variant hover:text-error">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Edit Dialog */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center animate-fade-in">
          <div className="bg-surface-container-lowest rounded-t-2xl md:rounded-2xl w-full md:max-w-md max-h-[90vh] overflow-y-auto p-6 shadow-[0_-10px_40px_rgba(255,209,220,0.5)] space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-lg text-on-surface">Edit Transaksi</h2>
              <button
                onClick={() => setEditing(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            {/* Type toggle */}
            <div className="bg-surface-container rounded-full p-1 flex gap-0.5">
              {(["keluar", "masuk"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setEditType(t)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-sm font-bold transition-all ${
                    editType === t
                      ? t === "masuk"
                        ? "bg-tertiary-container text-on-tertiary-container shadow-sm"
                        : "bg-error-container text-on-error-container shadow-sm"
                      : "text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {t === "masuk" ? "arrow_downward" : "arrow_upward"}
                  </span>
                  {t === "masuk" ? "Masuk" : "Keluar"}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">
                Jumlah
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant/40">Rp</span>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-surface-container border border-outline-variant text-lg font-semibold text-on-surface outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">
                Kategori
              </label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-surface-container border border-outline-variant text-sm font-medium text-on-surface outline-none focus:border-primary"
              >
                {allCats.map((c) => (
                  <option key={c} value={c}>{getLabel(c)}</option>
                ))}
              </select>
            </div>

            {/* Member */}
            {members.length > 0 && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">
                  Anggota
                </label>
                <select
                  value={editMemberId}
                  onChange={(e) => setEditMemberId(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-surface-container border border-outline-variant text-sm font-medium text-on-surface outline-none focus:border-primary"
                >
                  <option value="">Semua anggota</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{getMemberDisplayName(m)}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Note */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 block">
                Catatan
              </label>
              <textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                rows={2}
                className="w-full rounded-xl bg-surface-container border border-outline-variant p-4 text-sm resize-none outline-none focus:border-primary"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 h-12 rounded-full font-bold text-sm bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all"
              >
                Batal
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 h-12 rounded-full font-bold text-sm bg-primary text-primary-foreground active:scale-95 transition-all shadow-[0_4px_0_var(--on-primary-fixed-variant)] active:shadow-none active:translate-y-[2px]"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
