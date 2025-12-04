import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AppState {
  // User/Actor
  actor: string;
  setActor: (actor: string) => void;

  // Filters
  statusFilter: string | null;
  domainFilter: string | null;
  setStatusFilter: (status: string | null) => void;
  setDomainFilter: (domain: string | null) => void;
  clearFilters: () => void;

  // UI State
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Selected entities (for detail views)
  selectedEntityId: string | null;
  selectedEntityType: string | null;
  selectEntity: (type: string, id: string) => void;
  clearSelection: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        actor: 'team@numberlabs.ai',
        setActor: (actor) => set({ actor }),

        statusFilter: null,
        domainFilter: null,
        setStatusFilter: (status) => set({ statusFilter: status }),
        setDomainFilter: (domain) => set({ domainFilter: domain }),
        clearFilters: () => set({ statusFilter: null, domainFilter: null }),

        sidebarCollapsed: false,
        toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

        selectedEntityId: null,
        selectedEntityType: null,
        selectEntity: (type, id) => set({ selectedEntityType: type, selectedEntityId: id }),
        clearSelection: () => set({ selectedEntityId: null, selectedEntityType: null }),
      }),
      { name: 'airline-os-store' }
    )
  )
);
