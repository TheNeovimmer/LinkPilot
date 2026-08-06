import { create } from 'zustand';

interface UIState {
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  /** Last known AI-not-configured flag (surfaced as a dismissible banner). */
  aiNoticeDismissed: boolean;
  dismissAiNotice: () => void;
}

export const useUI = create<UIState>((set) => ({
  paletteOpen: false,
  setPaletteOpen: (open) => set({ paletteOpen: open }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  aiNoticeDismissed: false,
  dismissAiNotice: () => set({ aiNoticeDismissed: true }),
}));
