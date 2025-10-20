import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Message, FileNode, AIConfig, ViewMode } from '../types/ai'
import { aiService } from '../services/aiService'
import { fileService } from '../services/fileService'

interface AIState {
  // Chat
  messages: Message[]
  isLoading: boolean
  
  // Files
  fileTree: FileNode[]
  selectedFile: string | null
  fileContent: string
  
  // Config
  config: AIConfig | null
  
  // UI
  viewMode: ViewMode
}

interface AIActions {
  // Chat actions
  sendMessage: (content: string) => Promise<void>
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  clearMessages: () => void
  
  // File actions
  loadFileTree: () => Promise<void>
  selectFile: (path: string) => Promise<void>
  setFileContent: (content: string) => void
  refreshFileTree: () => Promise<void>
  
  // Config actions
  setConfig: (config: AIConfig) => void
  isConfigured: () => boolean
  
  // UI actions
  setViewMode: (mode: ViewMode) => void
}

export const useAIStore = create<AIState & AIActions>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [],
      isLoading: false,
      fileTree: [],
      selectedFile: null,
      fileContent: '',
      config: null,
      viewMode: 'split',

      // Chat actions
      sendMessage: async (content: string) => {
        const { config, addMessage } = get()
        
        if (!config) {
          addMessage({
            role: 'system',
            content: 'Please configure your AI settings first.',
          })
          return
        }

        // Add user message
        addMessage({ role: 'user', content })
        
        // Add loading message
        const loadingId = Date.now().toString()
        set(state => ({
          messages: [...state.messages, {
            id: loadingId,
            role: 'assistant' as const,
            content: '',
            timestamp: new Date(),
            isLoading: true,
          }],
          isLoading: true,
        }))

        try {
          const response = await aiService.sendMessage(content, config)
          
          // Remove loading message and add response
          set(state => ({
            messages: state.messages.filter(m => m.id !== loadingId),
            isLoading: false,
          }))
          
          addMessage({ role: 'assistant', content: response.message })
          
          // Execute file operations if any
          if (response.operations) {
            for (const operation of response.operations) {
              try {
                await fileService.executeOperation(operation)
              } catch (error) {
                console.error('Failed to execute operation:', operation, error)
                addMessage({
                  role: 'system',
                  content: `Failed to execute ${operation.type} operation on ${operation.path}: ${error}`,
                })
              }
            }
            
            // Refresh file tree after operations
            get().refreshFileTree()
          }
        } catch (error) {
          set(state => ({
            messages: state.messages.filter(m => m.id !== loadingId),
            isLoading: false,
          }))
          
          addMessage({
            role: 'system',
            content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
          })
        }
      },

      addMessage: (message) => {
        const newMessage: Message = {
          ...message,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          timestamp: new Date(),
        }
        
        set(state => ({
          messages: [...state.messages, newMessage]
        }))
      },

      clearMessages: () => set({ messages: [] }),

      // File actions
      loadFileTree: async () => {
        try {
          const tree = await fileService.getFileTree()
          set({ fileTree: tree })
        } catch (error) {
          console.error('Failed to load file tree:', error)
        }
      },

      selectFile: async (path: string) => {
        try {
          const content = await fileService.readFile(path)
          set({ selectedFile: path, fileContent: content })
        } catch (error) {
          console.error('Failed to read file:', error)
          set({ selectedFile: path, fileContent: `Error reading file: ${error}` })
        }
      },

      setFileContent: (content: string) => set({ fileContent: content }),

      refreshFileTree: async () => {
        get().loadFileTree()
      },

      // Config actions
      setConfig: (config: AIConfig) => set({ config }),

      isConfigured: () => {
        const { config } = get()
        return !!(config?.apiKey && config?.provider)
      },

      // UI actions
      setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
    }),
    {
      name: 'ai-store',
      partialize: (state) => ({
        config: state.config,
        viewMode: state.viewMode,
      }),
    }
  )
)

