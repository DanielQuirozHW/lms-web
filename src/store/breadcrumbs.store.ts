import { create } from 'zustand'

interface BreadcrumbsState {
  overrides: Record<string, string>
  hrefOverrides: Record<string, string>
  setOverrides: (overrides: Record<string, string>, hrefOverrides?: Record<string, string>) => void
  clearOverrides: () => void
}

export const useBreadcrumbsStore = create<BreadcrumbsState>((set) => ({
  overrides: {},
  hrefOverrides: {},
  setOverrides: (overrides, hrefOverrides = {}) => set({ overrides, hrefOverrides }),
  clearOverrides: () => set({ overrides: {}, hrefOverrides: {} }),
}))
