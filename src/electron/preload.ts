import { contextBridge, ipcRenderer } from 'electron'
import { ElectronAPI } from '../types/electron'

const electronAPI: ElectronAPI = {
  // App operations
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // File system operations
  getCurrentDirectory: () => ipcRenderer.invoke('get-current-directory'),
  setCurrentDirectory: (path: string) => ipcRenderer.invoke('set-current-directory', path),
  readDirectory: (path: string) => ipcRenderer.invoke('read-directory', path),
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', path, content),
  deleteFile: (path: string) => ipcRenderer.invoke('delete-file', path),
  renameFile: (oldPath: string, newPath: string) => ipcRenderer.invoke('rename-file', oldPath, newPath),
  createDirectory: (path: string) => ipcRenderer.invoke('create-directory', path),
  getFileStats: (path: string) => ipcRenderer.invoke('get-file-stats', path),
  
  // File watching (simplified implementation)
  watchFile: (path: string, callback: () => void) => {
    // In a real implementation, you'd use fs.watch or chokidar
    console.log('File watching not implemented in this demo')
  },
  unwatchFile: (path: string) => {
    console.log('File unwatching not implemented in this demo')
  },
  
  // Dialog operations
  showOpenDialog: (options: any) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

