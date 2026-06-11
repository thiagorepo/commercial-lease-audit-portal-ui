import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

import { supabase } from '@/lib/supabase';
import { authService } from '@/services/auth.service';

const mockAuth = supabase.auth as Record<string, ReturnType<typeof vi.fn>>;

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('returns null error on success', async () => {
      mockAuth.signInWithPassword.mockResolvedValueOnce({ error: null });

      const result = await authService.signIn('user@test.com', 'pass');
      expect(result.error).toBeNull();
    });

    it('returns error message on failure', async () => {
      mockAuth.signInWithPassword.mockResolvedValueOnce({
        error: { message: 'Invalid credentials' },
      });

      const result = await authService.signIn('user@test.com', 'wrong');
      expect(result.error).toBe('Invalid credentials');
    });

    it('catches exceptions', async () => {
      mockAuth.signInWithPassword.mockRejectedValueOnce(new Error('Network error'));

      const result = await authService.signIn('user@test.com', 'pass');
      expect(result.error).toBe('Network error');
    });
  });

  describe('signUp', () => {
    it('returns null error on success', async () => {
      mockAuth.signUp.mockResolvedValueOnce({ error: null });

      const result = await authService.signUp('new@test.com', 'pass');
      expect(result.error).toBeNull();
    });
  });

  describe('signOut', () => {
    it('returns null error on success', async () => {
      mockAuth.signOut.mockResolvedValueOnce({ error: null });

      const result = await authService.signOut();
      expect(result.error).toBeNull();
    });
  });

  describe('getSession', () => {
    it('returns null session when not authenticated', async () => {
      mockAuth.getSession.mockResolvedValueOnce({ data: { session: null } });

      const result = await authService.getSession();
      expect(result.session).toBeNull();
      expect(result.user).toBeNull();
    });

    it('returns session and user when authenticated', async () => {
      const mockUser = { id: 'u1', email: 'user@test.com' };
      const mockSession = { access_token: 'tok', user: mockUser };
      mockAuth.getSession.mockResolvedValueOnce({ data: { session: mockSession } });

      const result = await authService.getSession();
      expect(result.session).toBe(mockSession);
      expect(result.user).toBe(mockUser);
    });
  });

  describe('onAuthStateChange', () => {
    it('calls callback with session and user', () => {
      const mockUser = { id: 'u1' };
      const mockSession = { user: mockUser };
      const unsubscribe = vi.fn();
      mockAuth.onAuthStateChange.mockReturnValueOnce({
        data: { subscription: { unsubscribe } },
      });

      const callback = vi.fn();
      const cleanup = authService.onAuthStateChange(callback);

      const onChange = mockAuth.onAuthStateChange.mock.calls[0][0];
      onChange('SIGNED_IN', mockSession);

      expect(callback).toHaveBeenCalledWith(mockSession, mockUser);
      cleanup();
      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
