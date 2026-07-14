import { create } from 'zustand';

interface UiState {
  activeScreen: string;
  activeNav: string;
  isSidebarCollapsed: boolean;
  isMobileSidebarOpen: boolean;
  uiMode: 'user' | 'admin';
  setActiveScreen: (screenId: string, navId?: string) => void;
  toggleSidebar: () => void;
  toggleMobileSidebar: (open?: boolean) => void;
  setUiMode: (mode: 'user' | 'admin') => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeScreen: 'dash',
  activeNav: 'nav-dash',
  isSidebarCollapsed: false,
  isMobileSidebarOpen: false,
  uiMode: 'user',
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
}));
