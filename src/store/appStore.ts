import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  theme: 'light' | 'dark'
  isCommandPaletteOpen: boolean
  sidebarCollapsed: boolean
  currentProject: string | null
  recentProjects: string[]
}

interface AppActions {
  setTheme: (theme: 'light' | 'dark') => void
  setCommandPaletteOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setCurrentProject: (project: string | null) => void
  addRecentProject: (project: string) => void
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      // State
      theme: 'dark',
      isCommandPaletteOpen: false,
      sidebarCollapsed: false,
      currentProject: null,
      recentProjects: [],

      // Actions
      setTheme: (theme) => set({ theme }),
      setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setCurrentProject: (project) => set({ currentProject: project }),
      addRecentProject: (project) => {
        const { recentProjects } = get()
        const filtered = recentProjects.filter(p => p !== project)
        set({ recentProjects: [project, ...filtered].slice(0, 5) })
      },
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        currentProject: state.currentProject,
        recentProjects: state.recentProjects,
      }),
    }
  )
)

