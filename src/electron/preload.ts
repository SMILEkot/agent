import { contextBridge, ipcRenderer } from 'electron';

// Типы для API
export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: Date;
}

export interface SSHConfig {
  host: string;
  username: string;
  password?: string;
  privateKey?: string;
  port?: number;
}

export interface SSHResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  code?: number;
  error?: string;
  connectionId?: string;
}

// Безопасный API для renderer процесса
const electronAPI = {
  // Файловые операции
  selectFolder: (): Promise<string | null> => 
    ipcRenderer.invoke('select-folder'),
  
  readDirectory: (dirPath: string): Promise<FileItem[]> => 
    ipcRenderer.invoke('read-directory', dirPath),
  
  readFile: (filePath: string): Promise<string> => 
    ipcRenderer.invoke('read-file', filePath),
  
  writeFile: (filePath: string, content: string): Promise<boolean> => 
    ipcRenderer.invoke('write-file', filePath, content),

  // SSH операции
  sshConnect: (config: SSHConfig): Promise<SSHResult> => 
    ipcRenderer.invoke('ssh-connect', config),
  
  sshExecute: (connectionId: string, command: string): Promise<SSHResult> => 
    ipcRenderer.invoke('ssh-execute', connectionId, command),
  
  sshDisconnect: (connectionId: string): Promise<SSHResult> => 
    ipcRenderer.invoke('ssh-disconnect', connectionId),

  // События
  onProjectFolderSelected: (callback: (folderPath: string) => void) => {
    ipcRenderer.on('project-folder-selected', (_, folderPath) => callback(folderPath));
  },

  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Системная информация
  platform: process.platform,
  versions: process.versions,
};

// Экспортируем API в глобальный объект window
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Типы для TypeScript
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
