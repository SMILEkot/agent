import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  theme: 'light' | 'dark'
}

interface AppActions {
  setTheme: (theme: 'light' | 'dark') => void
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      // State
      theme: 'dark',

      // Actions
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
)
