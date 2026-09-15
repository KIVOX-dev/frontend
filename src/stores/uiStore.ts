import { create } from 'zustand';

interface UiState {
  activeScreen: string;
  activeNav: string;
  isSidebarCollapsed: boolean;
  isMobileSidebarOpen: boolean;
  uiMode: 'user' | 'admin';
  /** Set when navigating to an item from a search result — the destination
   * screen scrolls to and briefly highlights whichever row's id matches,
   * then clears this itself (see CollegeAdminDashboard.tsx's focus effect).
   * Not screen-specific on purpose: only one "thing to focus" is ever live
   * at a time, regardless of which screen ends up reading it. */
  searchFocusId: string | null;
  setActiveScreen: (screenId: string, navId?: string) => void;
  toggleSidebar: () => void;
  toggleMobileSidebar: (open?: boolean) => void;
  setUiMode: (mode: 'user' | 'admin') => void;
  setSearchFocusId: (id: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeScreen: 'dash',
  activeNav: 'nav-dash',
  isSidebarCollapsed: false,
  isMobileSidebarOpen: false,
  uiMode: 'user',
  searchFocusId: null,
  setActiveScreen: (screenId, navId) =>
    set({
      activeScreen: screenId,
      activeNav: navId ?? `nav-${screenId}`,
      isMobileSidebarOpen: false
    }),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  toggleMobileSidebar: (open) => set((state) => ({
    isMobileSidebarOpen: open !== undefined ? open : !state.isMobileSidebarOpen
  })),
  setUiMode: (mode) => set({ uiMode: mode }),
  setSearchFocusId: (id) => set({ searchFocusId: id }),
}));
