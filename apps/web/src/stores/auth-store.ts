import { create } from "zustand";
import { UserRole } from "@warfire/shared";

export interface CurrentUser {
  id: string;
  name: string;
  login: string;
  role: UserRole;
}

interface AuthState {
  user: CurrentUser | null;
  hydrated: boolean;
  setUser: (user: CurrentUser | null) => void;
  setHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user }),
  setHydrated: (v) => set({ hydrated: v }),
}));
