import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";
import { authClient } from "./auth-client";

export interface Family {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  // Denormalized from auth
  email?: string;
  name?: string;
}

interface FamilyContextType {
  family: Family | null;
  me: FamilyMember | null;
  members: FamilyMember[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType>({
  family: null,
  me: null,
  members: [],
  loading: true,
  refresh: async () => {},
});

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const [family, setFamily] = useState<Family | null>(null);
  const [me, setMe] = useState<FamilyMember | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = authClient.useSession();

  const refresh = useCallback(async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    // Get my membership
    const { data: myMembership } = await supabase
      .from("family_members")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (!myMembership) {
      setFamily(null);
      setMe(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    setMe(myMembership);

    // Get family
    const { data: fam } = await supabase
      .from("families")
      .select("*")
      .eq("id", myMembership.family_id)
      .single();

    setFamily(fam);

    // Get all members
    const { data: mems } = await supabase
      .from("family_members")
      .select("*")
      .eq("family_id", myMembership.family_id)
      .order("joined_at");

    if (mems) {
      // Fetch user emails/names from auth (we can't query auth.users directly via anon key)
      // Instead, store name in user metadata and read it
      const enriched: FamilyMember[] = mems.map((m: any) => ({
        ...m,
        email: m.user_id === session.user.id ? session.user.email : undefined,
      }));
      setMembers(enriched);
    }

    setLoading(false);
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <FamilyContext.Provider value={{ family, me, members, loading, refresh }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  return useContext(FamilyContext);
}
