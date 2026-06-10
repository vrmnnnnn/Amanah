import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Account {
  id: number;
  family_id: string;
  name: string;
  type: "tunai" | "bank" | "ewallet";
  created_at: string;
  balance?: number;
}

export function useAccounts(familyId: string | undefined) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAccounts = useCallback(async () => {
    if (!familyId) { setAccounts([]); return; }
    setLoading(true);

    // Get accounts
    const { data: accs } = await supabase
      .from("accounts")
      .select("*")
      .eq("family_id", familyId)
      .order("created_at");

    if (!accs) { setAccounts([]); setLoading(false); return; }

    // Calculate balance per account from transactions
    const { data: txs } = await supabase
      .from("transactions")
      .select("account_id, type, amount")
      .eq("family_id", familyId);

    const accWithBalance = accs.map((acc: any) => {
      const accTxs = (txs || []).filter((tx: any) => tx.account_id === acc.id);
      const masuk = accTxs
        .filter((tx: any) => tx.type === "masuk")
        .reduce((s: number, tx: any) => s + Number(tx.amount), 0);
      const keluar = accTxs
        .filter((tx: any) => tx.type === "keluar")
        .reduce((s: number, tx: any) => s + Number(tx.amount), 0);
      return { ...acc, balance: masuk - keluar };
    });

    setAccounts(accWithBalance);
    setLoading(false);
  }, [familyId]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const addAccount = useCallback(async (name: string, type: Account["type"]) => {
    if (!familyId) return;
    const { data, error } = await supabase
      .from("accounts")
      .insert({ family_id: familyId, name, type })
      .select()
      .single();
    if (!error && data) {
      setAccounts((prev) => [...prev, { ...data, balance: 0 }]);
    }
    return { data, error };
  }, [familyId]);

  const deleteAccount = useCallback(async (id: number) => {
    await supabase.from("accounts").delete().eq("id", id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { accounts, loading, addAccount, deleteAccount, refresh: fetchAccounts };
}
