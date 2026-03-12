import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/services/api';
import type { KYCStatus } from '@sendt/types';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  kycStatus: KYCStatus;
}

interface AuthState {
  _hasHydrated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  isKycVerified: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const result = await authApi.login(email, password);
          localStorage.setItem('access_token', result.accessToken);
          set({
            user: result.user as AuthUser,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            isLoading: false,
          });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const result = await authApi.register(data);
          localStorage.setItem('access_token', result.accessToken);
          set({
            user: result.user as AuthUser,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            isLoading: false,
          });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        if (refreshToken) {
          await authApi.logout(refreshToken).catch(() => {});
        }
        localStorage.removeItem('access_token');
        set({ user: null, accessToken: null, refreshToken: null });
      },

      isKycVerified: () => get().user?.kycStatus === 'VERIFIED',
    }),
    {
      name: 'sendt-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);

if (typeof window !== 'undefined') {
  if (useAuthStore.persist.hasHydrated()) {
    useAuthStore.setState({ _hasHydrated: true });
  } else {
    useAuthStore.persist.onFinishHydration(() => {
      useAuthStore.setState({ _hasHydrated: true });
    });
  }
}
