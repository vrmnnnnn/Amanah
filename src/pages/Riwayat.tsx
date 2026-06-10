import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { authClient } from "@/lib/auth-client";
import { useFamily } from "@/lib/family-context";
import { toast } from "sonner";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Filter,
  Trash2,
  Pencil,
  X,
  Download,
} from "lucide-react";

const categoryLabel: Record<string, string> = {
  makan: "Makan",
  transport: "Transport",
  belanja: "Belanja",
  tagihan: "Tagihan",
  gaji: "Gaji",
  bisnis: "Bisnis",
  investasi: "Investasi",
  lainnya: "Lainnya",
};

export default function Riwayat() {
  const { family, members } = useFamily();
  const [transactions, setTransactions] = useState<any[]>([]);

  // Filters
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
      .select("*, member_id(id, role)")
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
      const memberRole = members.find((m) => m.id === tx.member_id)?.role || "Semua";
      return [
        date,
        tx.type === "masuk" ? "Masuk" : "Keluar",
        tx.amount,
        categoryLabel[tx.category] || tx.category,
        tx.note || "",
        memberRole,
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

  const formatRupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

  // Month options (last 12 months)
  const months: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    months.push({
      value: `${y}-${m}`,
      label: d.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
    });
  }

  const filtered = transactions.filter((tx) => {
    if (filterMonth) {
      const d = new Date(tx.created_at);
      const txMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (txMonth !== filterMonth) return false;
    }
    if (filterCategory !== "all" && tx.category !== filterCategory) return false;
    if (filterType !== "all" && tx.type !== filterType) return false;
    return true;
  });

  // Get all categories from data for filter dropdown
  const allCats = [...new Set(transactions.map((t) => t.category))];

  return (
    <div className="min-h-dvh pb-24" style={{ background: "var(--bg)" }}>
      <div className="px-5 pt-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-heading" style={{ color: "var(--text)" }}>
            Riwayat
          </h1>

          {/* Export */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-lg"
            style={{ color: "var(--text-muted)", background: "var(--surface-hover)" }}
          >
            <Download size={13} />
            CSV
          </button>
        </div>

        {/* Filter toggle */}
        <div className="flex justify-end mt-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-lg transition-colors ${
              showFilters || filterMonth || filterCategory !== "all" || filterType !== "all"
                ? "text-white"
                : ""
            }`}
            style={
              showFilters || filterMonth || filterCategory !== "all" || filterType !== "all"
                ? { background: "var(--navy)" }
                : { color: "var(--text-muted)", background: "var(--surface-hover)" }
            }
          >
            <Filter size={13} />
            Filter
            {(filterMonth || filterCategory !== "all" || filterType !== "all") && (
              <span className="size-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center">
                {[filterMonth, filterCategory !== "all", filterType !== "all"].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div className="animate-fade-in mt-2 p-3 card-layered flex flex-wrap gap-2">
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="h-9 rounded-lg text-xs min-w-[120px]" style={{ background: "var(--bg)" }}>
                <SelectValue placeholder="Semua bulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua bulan</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-9 rounded-lg text-xs min-w-[100px]" style={{ background: "var(--bg)" }}>
                <SelectValue placeholder="Semua tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua tipe</SelectItem>
                <SelectItem value="masuk">Masuk</SelectItem>
                <SelectItem value="keluar">Keluar</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-9 rounded-lg text-xs min-w-[110px]" style={{ background: "var(--bg)" }}>
                <SelectValue placeholder="Semua kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kategori</SelectItem>
                {allCats.map((c) => (
                  <SelectItem key={c} value={c}>{categoryLabel[c] || c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filterMonth || filterCategory !== "all" || filterType !== "all") && (
              <button
                onClick={() => {
                  setFilterMonth("");
                  setFilterCategory("all");
                  setFilterType("all");
                }}
                className="h-9 px-3 rounded-lg text-xs flex items-center gap-1"
                style={{ color: "var(--text-muted)", background: "var(--surface-hover)" }}
              >
                <X size={12} /> Reset
              </button>
            )}
          </div>
        )}

        {/* Transaction list */}
        <div className="mt-4 space-y-2.5">
          {filtered.map((tx) => (
            <div key={tx.id} className="card-layered p-3.5 flex items-center justify-between gap-3 group">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.type === "masuk"
                      ? "bg-[var(--green)]/10 text-[var(--green)]"
                      : "bg-red-50 text-red-500 dark:bg-red-950 dark:text-red-400"
                  }`}
                >
                  {tx.type === "masuk" ? (
                    <ArrowDownToLine size={18} />
                  ) : (
                    <ArrowUpFromLine size={18} />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                    {categoryLabel[tx.category] || tx.category}
                  </p>
                  {tx.note && (
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      {tx.note}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {tx.member_id && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 px-1.5"
                        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                      >
                        {tx.member_id?.role || "Anggota"}
                      </Badge>
                    )}
                    <span className="text-[10px]" style={{ color: "var(--text-faded)" }}>
                      {new Date(tx.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <p
                  className={`font-bold text-sm ${
                    tx.type === "masuk" ? "text-[var(--green)]" : ""
                  }`}
                  style={tx.type !== "masuk" ? { color: "var(--text)" } : {}}
                >
                  {tx.type === "masuk" ? "+" : "-"}
                  {formatRupiah(tx.amount)}
                </p>

                {/* Action buttons */}
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(tx)}
                    className="size-7 rounded-lg flex items-center justify-center hover:opacity-70"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => deleteTransaction(tx.id)}
                    className="size-7 rounded-lg flex items-center justify-center hover:text-red-500"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="card-layered text-center py-12 px-4 mt-4">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {transactions.length === 0 ? "Belum ada transaksi." : "Tidak ada hasil filter."}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-faded)" }}>
                {transactions.length === 0 ? "Yuk mulai catat di tab Catat!" : "Coba ubah filter."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="rounded-2xl p-6 gap-5 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-heading" style={{ color: "var(--text)" }}>
              Edit Transaksi
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              {/* Type toggle */}
              <div className="flex rounded-xl p-1 gap-1" style={{ background: "var(--surface-hover)" }}>
                {(["keluar", "masuk"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEditType(t)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-sm font-semibold transition-all ${
                      editType === t
                        ? t === "masuk"
                          ? "bg-white text-[var(--green)] shadow-sm dark:bg-[var(--surface)]"
                          : "bg-white text-red-500 shadow-sm dark:bg-[var(--surface)]"
                        : ""
                    }`}
                    style={editType !== t ? { color: "var(--text-muted)" } : {}}
                  >
                    {t === "masuk" ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}
                    {t === "masuk" ? "Masuk" : "Keluar"}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>Jumlah</Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-semibold" style={{ color: "var(--text-muted)" }}>Rp</span>
                  <Input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="h-12 pl-10 rounded-xl text-lg font-semibold"
                    style={{ borderColor: "var(--border)", background: "var(--bg)" }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>Kategori</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allCats.map((c) => (
                      <SelectItem key={c} value={c}>{categoryLabel[c] || c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {members.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>Anggota</Label>
                  <Select value={editMemberId} onValueChange={setEditMemberId}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Semua anggota" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Semua anggota</SelectItem>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>Catatan</Label>
                <Textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  rows={2}
                  className="rounded-xl resize-none"
                  style={{ borderColor: "var(--border)", background: "var(--bg)" }}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl"
                  onClick={() => setEditing(null)}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1 h-11 rounded-xl text-[15px] font-semibold tracking-tight"
                  style={{ background: "var(--navy)" }}
                  onClick={saveEdit}
                >
                  Simpan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
