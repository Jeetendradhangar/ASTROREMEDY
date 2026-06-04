import { create } from 'zustand';

interface User {
  [x: string]: any;
  id: number;
  email: string;
  username: string;
  phone_number: string | null;
  profile_photo: string | null;
  is_astrologer: boolean;
  first_name?: string;
  last_name?: string;
}

interface AuthState {
  accessToken: string | null; // Kept for type compatibility
  refreshToken: string | null; // Kept for type compatibility
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (accessToken: string | null, refreshToken: string | null, user: User) => void;
  setUser: (user: User | null) => void;
  setHydrated: (hydrated: boolean) => void;
  updateUser: (user: Partial<User>) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,

  setAuth: (accessToken, refreshToken, user) => {
    set({ user, isAuthenticated: true, isHydrated: true });
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  setHydrated: (isHydrated) => {
    set({ isHydrated });
  },

  updateUser: (updatedUserFields) => {
    set((state) => {
      if (!state.user) return state;
      const newUser = { ...state.user, ...updatedUserFields };
      return { user: newUser };
    });
  },

  clearAuth: () => {
    set({ user: null, isAuthenticated: false });
  },

  hydrate: () => {
    // Left as a no-op; actual hydration is handled asynchronously by the Hydration component
    set({ isHydrated: true });
  },
}));
