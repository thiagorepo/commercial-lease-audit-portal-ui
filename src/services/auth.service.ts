/**
 * Why: Extracts Supabase auth operations from AuthContext into a reusable service
 *      so non-React code (stores, hooks) can call auth methods without context dependency.
 * What: Wraps supabase.auth with error normalization and session access.
 * Test: Mock supabase.auth, verify each method returns { error: null } on success.
 */

import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthResult {
  error: string | null;
}

export interface SessionResult {
  session: Session | null;
  user: User | null;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'An error occurred';
}

export const authService = {
  async signUp(email: string, password: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      return { error: error?.message ?? null };
    } catch (err) {
      return { error: errorMessage(err) };
    }
  },

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    } catch (err) {
      return { error: errorMessage(err) };
    }
  },

  async signOut(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error?.message ?? null };
    } catch (err) {
      return { error: errorMessage(err) };
    }
  },

  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      return { error: error?.message ?? null };
    } catch (err) {
      return { error: errorMessage(err) };
    }
  },

  async updatePassword(password: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      return { error: error?.message ?? null };
    } catch (err) {
      return { error: errorMessage(err) };
    }
  },

  async getSession(): Promise<SessionResult> {
    const { data } = await supabase.auth.getSession();
    return {
      session: data.session,
      user: data.session?.user ?? null,
    };
  },

  onAuthStateChange(
    callback: (session: Session | null, user: User | null) => void,
  ): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        callback(session, session?.user ?? null);
      },
    );
    return () => subscription?.unsubscribe();
  },
};
