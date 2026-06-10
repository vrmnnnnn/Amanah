import { supabase } from "./supabase";
import { useEffect, useState } from "react";
import type { Session, Provider } from "@supabase/supabase-js";

/**
 * Supabase Auth adapter — preserves the same API shape as Better Auth's
 * `createAuthClient` so all existing pages continue to work.
 * v4: added resetPassword, resendVerification, confirmEmail
 */

export const authClient = {
  signIn: {
    email: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
    social: async ({ provider }: { provider: string }) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as Provider,
        options: { redirectTo: window.location.origin + "/home" },
      });
      if (error) throw error;
      return data;
    },
  },
  signUp: {
    email: async ({
      email,
      password,
      name,
    }: {
      email: string;
      password: string;
      name?: string;
    }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: window.location.origin + "/auth/callback",
        },
      });
      if (error) throw error;
      return data;
    },
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  /** Reset password — sends recovery email */
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/auth/callback",
    });
    if (error) throw error;
  },
  /** Update password after recovery — for auth callback page */
  updatePassword: async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  },
  /** Resend email verification */
  resendVerification: async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: window.location.origin + "/auth/callback",
      },
    });
    if (error) throw error;
  },
  /** Exchange auth tokens from URL hash (callback handler) */
  exchangeCode: async (code: string) => {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data;
  },
  useSession: () => {
    const [session, setSession] = useState<Session | null>(null);
    const [isPending, setIsPending] = useState(true);

    useEffect(() => {
      // Initial fetch
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);
        setIsPending(false);
      });

      // Subscribe to changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setIsPending(false);
      });

      return () => subscription.unsubscribe();
    }, []);

    return { data: session, isPending };
  },
  getSession: async () => {
    const { data } = await supabase.auth.getSession();
    return data as any;
  },
};

export const {
  signIn,
  signUp,
  signOut,
  resetPassword,
  updatePassword,
  resendVerification,
  exchangeCode,
  useSession,
  getSession,
} = authClient;
