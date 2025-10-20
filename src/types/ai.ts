export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isLoading?: boolean
}

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  modified?: Date
  children?: FileNode[]
}

export interface AIConfig {
  provider: 'openai' | 'anthropic'
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
}

export interface AIProvider {
  name: string
  models: string[]
  defaultModel: string
}

export interface FileOperation {
  type: 'create' | 'edit' | 'delete' | 'rename' | 'read'
  path: string
  content?: string
  newPath?: string
}

export interface AIResponse {
  message: string
  operations?: FileOperation[]
  error?: string
}

export type ViewMode = 'split' | 'chat-only' | 'files-only' | 'editor-only'

