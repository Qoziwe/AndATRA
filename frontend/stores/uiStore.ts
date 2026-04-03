import { create } from "zustand";

type RealtimeStatus = "live" | "reconnecting" | "offline";
export type ThemeMode = "light" | "dark";

interface UiState {
  sidebarCollapsed: boolean;
  realtimeStatus: RealtimeStatus;
  globalSearch: string;
  theme: ThemeMode;
  profileMenuOpen: boolean;
  toggleSidebar: () => void;
  setRealtimeStatus: (status: RealtimeStatus) => void;
  setGlobalSearch: (value: string) => void;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  toggleProfileMenu: () => void;
  closeProfileMenu: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  realtimeStatus: "offline",
  globalSearch: "",
  theme: "dark",
  profileMenuOpen: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setRealtimeStatus: (realtimeStatus) => set({ realtimeStatus }),
  setGlobalSearch: (globalSearch) => set({ globalSearch }),
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
  setTheme: (theme) => set({ theme }),
  toggleProfileMenu: () =>
    set((state) => ({ profileMenuOpen: !state.profileMenuOpen })),
  closeProfileMenu: () => set({ profileMenuOpen: false })
}));
