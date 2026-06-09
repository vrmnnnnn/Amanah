import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { authClient } from "@/lib/auth-client";

export default function Riwayat() {
  const { data: session } = authClient.useSession();
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!session?.user) return;
    supabase
      .from("transactions")
      .select("*, family_members(name)")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setTransactions(data);
      });
  }, [session]);

  const formatRupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

  return (
    <div className="min-h-dvh bg-gradient-to-b from-emerald-50 to-white pb-20">
      <div className="px-4 pt-8">
        <h1 className="text-2xl font-bold text-emerald-700 text-center">
          📋 Riwayat
        </h1>

        <div className="mt-4 space-y-3">
          {transactions.map((tx) => (
            <Card key={tx.id} className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {tx.type === "masuk" ? "🟢" : "🔴"}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {tx.category || "Lainnya"}
                    </p>
                    {tx.note && (
                      <p className="text-xs text-muted-foreground">{tx.note}</p>
                    )}
                    {tx.family_members?.name && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {tx.family_members.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <p
                  className={`font-semibold text-sm ${
                    tx.type === "masuk" ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {tx.type === "masuk" ? "+" : "-"}
                  {formatRupiah(tx.amount)}
                </p>
              </CardContent>
            </Card>
          ))}
          {transactions.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Belum ada transaksi. Yuk mulai catat!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
