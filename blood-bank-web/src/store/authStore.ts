import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../lib/api';

export interface User {
    id: string;
    username: string;
    email: string;
    fullName: string;
    laboratoryId: string | null;
    isGlobalAdmin: boolean;
    roles: string[];
    permissions: string[];
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    setUser: (user: User) => void;
    clearAuth: () => void;
    hasRole: (role: string) => boolean;
    hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,

            login: async (username: string, password: string) => {
                set({ isLoading: true });
                try {
                    const { data } = await authApi.login(username, password);

                    localStorage.setItem('accessToken', data.tokens.accessToken);
                    localStorage.setItem('refreshToken', data.tokens.refreshToken);

                    set({
                        user: data.user,
                        accessToken: data.tokens.accessToken,
                        refreshToken: data.tokens.refreshToken,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            logout: async () => {
                try {
                    const { refreshToken } = get();
                    if (refreshToken) {
                        await authApi.logout(refreshToken);
                    }
                } catch {
                    // Ignore logout errors
                } finally {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    set({
                        user: null,
                        accessToken: null,
                        refreshToken: null,
                        isAuthenticated: false,
                    });
                }
            },

            setUser: (user: User) => set({ user }),

            clearAuth: () => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                });
            },

            hasRole: (role: string) => {
                const { user } = get();
                if (!user) return false;
                if (user.isGlobalAdmin) return true;
                return user.roles.includes(role);
            },

            hasPermission: (permission: string) => {
                const { user } = get();
                if (!user) return false;
                if (user.isGlobalAdmin) return true;
                return user.permissions.includes(permission);
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
