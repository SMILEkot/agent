import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { useAIStore } from '../store/aiStore'

export const useHotkeys = () => {
  const { setCommandPaletteOpen } = useAppStore()
  const { setViewMode } = useAIStore()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Command Palette: Ctrl/Cmd + K
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        setCommandPaletteOpen(true)
      }

      // View Mode shortcuts
      if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
        switch (event.key) {
          case '1':
            event.preventDefault()
            setViewMode('split')
            break
          case '2':
            event.preventDefault()
            setViewMode('chat-only')
            break
          case '3':
            event.preventDefault()
            setViewMode('files-only')
            break
          case '4':
            event.preventDefault()
            setViewMode('editor-only')
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [setCommandPaletteOpen, setViewMode])
}

