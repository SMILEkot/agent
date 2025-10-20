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

export interface ElectronAPI {
  // Файловые операции
  selectFolder: () => Promise<string | null>;
  readDirectory: (dirPath: string) => Promise<FileItem[]>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<boolean>;

  // SSH операции
  sshConnect: (config: SSHConfig) => Promise<SSHResult>;
  sshExecute: (connectionId: string, command: string) => Promise<SSHResult>;
  sshDisconnect: (connectionId: string) => Promise<SSHResult>;

  // События
  onProjectFolderSelected: (callback: (folderPath: string) => void) => void;
  removeAllListeners: (channel: string) => void;

  // Системная информация
  platform: string;
  versions: NodeJS.ProcessVersions;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
