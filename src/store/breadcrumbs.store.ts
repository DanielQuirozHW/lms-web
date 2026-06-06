import { create } from 'zustand'

interface BreadcrumbsState {
  overrides: Record<string, string>
  setOverrides: (overrides: Record<string, string>) => void
  clearOverrides: () => void
}

export const useBreadcrumbsStore = create<BreadcrumbsState>((set) => ({
  overrides: {},
  setOverrides: (overrides) => set({ overrides }),
  clearOverrides: () => set({ overrides: {} }),
}))
