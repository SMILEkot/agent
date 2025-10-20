export interface ElectronAPI {
  // App operations
  getAppVersion: () => Promise<string>
  getPlatform: () => Promise<string>
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  
  // File system operations
  getCurrentDirectory: () => Promise<string>
  setCurrentDirectory: (path: string) => Promise<void>
  readDirectory: (path: string) => Promise<import('./ai').FileNode[]>
  readFile: (path: string) => Promise<string>
  writeFile: (path: string, content: string) => Promise<void>
  deleteFile: (path: string) => Promise<void>
  renameFile: (oldPath: string, newPath: string) => Promise<void>
  createDirectory: (path: string) => Promise<void>
  getFileStats: (path: string) => Promise<{ size: number; modified: Date } | null>
  
  // File watching
  watchFile: (path: string, callback: () => void) => void
  unwatchFile: (path: string) => void
  
  // Dialog operations
  showOpenDialog: (options: any) => Promise<{ canceled: boolean; filePaths: string[] }>
  showSaveDialog: (options: any) => Promise<{ canceled: boolean; filePath?: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

