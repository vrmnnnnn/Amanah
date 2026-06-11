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
  avatar_url?: string;
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
      // Enrich: current user gets name + avatar from auth metadata; others keep role as fallback
      const enriched: FamilyMember[] = mems.map((m: any) => {
        const isMe = m.user_id === session.user.id;
        const meta = session.user.user_metadata;
        const displayName = isMe
          ? (meta?.name || m.role)
          : (m.name || m.role);
        const avatar = isMe
          ? (meta?.avatar_url || null)
          : (m.avatar_url || null);
        return {
          ...m,
          email: isMe ? session.user.email : undefined,
          name: displayName,
          avatar_url: avatar,
        };
      });
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

/** Get display name for a member: prefers name (from user_metadata), falls back to role */
export function getMemberDisplayName(member: FamilyMember): string {
  return member.name || member.role || "Anggota";
}

/** Get avatar URL for a member: uses avatar_url if available, otherwise DiceBear fallback */
export function getMemberAvatar(member: FamilyMember, size: number = 80): string {
  if (member.avatar_url) return member.avatar_url;
  const seed = member.name || member.role || member.user_id;
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}&size=${size}&backgroundColor=ffd1dc`;
}
