import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { authClient } from "@/lib/auth-client";

interface FamilyMember {
  id: string;
  name: string;
  role: string;
  balance?: number;
}

export default function Home() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [totalMasuk, setTotalMasuk] = useState(0);
  const [totalKeluar, setTotalKeluar] = useState(0);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (!session?.user) return;
    loadData();
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
      setTotalMasuk(t.filter((tx: any) => tx.type === "masuk").reduce((a: number, tx: any) => a + tx.amount, 0));
      setTotalKeluar(t.filter((tx: any) => tx.type === "keluar").reduce((a: number, tx: any) => a + tx.amount, 0));
    }

    if (m) setMembers(m);
  };

  const saldo = totalMasuk - totalKeluar;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-emerald-50 to-white pb-20">
      {/* Header */}
      <div className="bg-emerald-600 text-white px-4 pt-12 pb-8 rounded-b-3xl">
        <h1 className="text-2xl font-bold text-center">🤲 Amanah</h1>
        <div className="mt-4 text-center">
          <p className="text-emerald-200 text-sm">Saldo Keluarga</p>
          <p className="text-4xl font-bold mt-1">
            Rp {saldo.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="flex justify-center gap-4 mt-3 text-sm">
          <span>🟢 Masuk: Rp {totalMasuk.toLocaleString("id-ID")}</span>
          <span>🔴 Keluar: Rp {totalKeluar.toLocaleString("id-ID")}</span>
        </div>
      </div>

      {/* Members */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold mb-3">👥 Anggota Keluarga</h2>
        <div className="grid grid-cols-2 gap-3">
          {members.map((m) => (
            <Card key={m.id} className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg">
                  {m.role === "ayah" ? "👨" : m.role === "ibu" ? "👩" : "👦"}
                </div>
                <div>
                  <p className="font-medium text-sm">{m.name}</p>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {m.role.replace("_", " ")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {members.length === 0 && (
            <p className="text-muted-foreground text-sm col-span-2 text-center py-8">
              Belum ada anggota. Tambahkan di tab Anggota.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function BellIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;
}
