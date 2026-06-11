/**
 * Why: Provides a Zustand store for auth state so components can subscribe
 *      to user/session without being nested inside AuthProvider.
 * What: Exposes user, session, isLoading, and auth actions. Syncs via authService.
 * Test: Call signIn, assert user populated. Call signOut, assert user null.
 */

import { create } from 'zustand';
import { authService } from '@/services/auth.service';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;

  initialize: () => () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  error: null,

  initialize: () => {
    authService.getSession().then(({ session, user }) => {
      set({ session, user, isLoading: false });
    });

    const unsubscribe = authService.onAuthStateChange((session, user) => {
      set({ session, user, isLoading: false });
    });

    return unsubscribe;
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    const { error } = await authService.signIn(email, password);
    if (error) set({ error, isLoading: false });
  },

  signUp: async (email, password) => {
    set({ isLoading: true, error: null });
    const { error } = await authService.signUp(email, password);
    if (error) set({ error, isLoading: false });
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    const { error } = await authService.signOut();
    if (error) set({ error, isLoading: false });
  },

  resetPassword: async (email) => {
    set({ error: null });
    const { error } = await authService.resetPassword(email);
    if (error) set({ error });
  },

  updatePassword: async (password) => {
    set({ error: null });
    const { error } = await authService.updatePassword(password);
    if (error) set({ error });
  },

  clearError: () => set({ error: null }),
}));
