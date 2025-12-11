import { create } from "zustand";

interface AuthState {
  role: string | null;
  setRole: (role: string) => void;
  clearRole: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  role: null,
  setRole: (role) => set({ role }),
  clearRole: () => set({ role: null }),
}));
