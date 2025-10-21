import { Client } from 'ssh2';
import * as fs from 'fs';
import * as path from 'path';
import { taskOrchestrator, AutomationTask } from './TaskOrchestrator';

export interface SSHConnection {
  id: string;
  host: string;
  port: number;
  username: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastActivity: Date;
  projectPath?: string;
  error?: string;
}

export interface SSHCredentials {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
}

export interface RemoteCommand {
  command: string;
  cwd?: string;
  timeout?: number;
}

export interface RemoteCommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode?: number;
  duration: number;
}

export class SSHManager {
  private connections: Map<string, { client: Client; info: SSHConnection }> = new Map();
  private activeConnections: Map<string, SSHConnection> = new Map();

  public async connect(credentials: SSHCredentials): Promise<SSHConnection> {
    const connectionId = this.generateConnectionId();
    
    const connection: SSHConnection = {
      id: connectionId,
      host: credentials.host,
      port: credentials.port,
      username: credentials.username,
      status: 'connecting',
      lastActivity: new Date()
    };

    this.activeConnections.set(connectionId, connection);

    try {
      const client = new Client();
      
      await new Promise<void>((resolve, reject) => {
        client.on('ready', () => {
          connection.status = 'connected';
          connection.lastActivity = new Date();
          resolve();
        });

        client.on('error', (err) => {
          connection.status = 'error';
          connection.error = err.message;
          reject(err);
        });

        client.on('close', () => {
          connection.status = 'disconnected';
          this.connections.delete(connectionId);
          this.activeConnections.delete(connectionId);
        });

        // Подключаемся
        const connectOptions: any = {
          host: credentials.host,
          port: credentials.port,
          username: credentials.username,
          readyTimeout: 30000,
          keepaliveInterval: 30000
        };

        if (credentials.password) {
          connectOptions.password = credentials.password;
        }

        if (credentials.privateKey) {
          connectOptions.privateKey = credentials.privateKey;
          if (credentials.passphrase) {
            connectOptions.passphrase = credentials.passphrase;
          }
        }

        client.connect(connectOptions);
      });

      this.connections.set(connectionId, { client, info: connection });
      
      // Проверяем базовые команды
      await this.executeCommand(connectionId, { command: 'pwd' });
      
      return connection;

    } catch (error) {
      connection.status = 'error';
      connection.error = error instanceof Error ? error.message : 'Connection failed';
      throw error;
    }
  }

  public async disconnect(connectionId: string): Promise<boolean> {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.client.end();
      return true;
    }
    return false;
  }

  public async executeCommand(
    connectionId: string, 
    command: RemoteCommand
  ): Promise<RemoteCommandResult> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    if (connection.info.status !== 'connected') {
      throw new Error('Connection not active');
    }

    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const timeout = command.timeout || 30000;
      let stdout = '';
      let stderr = '';
      let exitCode: number | undefined;

      // Формируем команду с учетом рабочей директории
      let fullCommand = command.command;
      if (command.cwd) {
        fullCommand = `cd "${command.cwd}" && ${command.command}`;
      }

      connection.client.exec(fullCommand, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }

        const timeoutId = setTimeout(() => {
          stream.destroy();
          reject(new Error('Command timeout'));
        }, timeout);

        stream.on('close', (code: number) => {
          clearTimeout(timeoutId);
          exitCode = code;
          
          const duration = Date.now() - startTime;
          connection.info.lastActivity = new Date();

          resolve({
            success: code === 0,
            stdout,
            stderr,
            exitCode: code,
            duration
          });
        });

        stream.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        stream.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
      });
    });
  }

  public async uploadFile(
    connectionId: string,
    localPath: string,
    remotePath: string
  ): Promise<boolean> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    return new Promise((resolve, reject) => {
      connection.client.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }

        sftp.fastPut(localPath, remotePath, (err) => {
          if (err) {
            reject(err);
          } else {
            connection.info.lastActivity = new Date();
            resolve(true);
          }
        });
      });
    });
  }

  public async downloadFile(
    connectionId: string,
    remotePath: string,
    localPath: string
  ): Promise<boolean> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    return new Promise((resolve, reject) => {
      connection.client.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }

        sftp.fastGet(remotePath, localPath, (err) => {
          if (err) {
            reject(err);
          } else {
            connection.info.lastActivity = new Date();
            resolve(true);
          }
        });
      });
    });
  }

  public async listDirectory(
    connectionId: string,
    remotePath: string
  ): Promise<Array<{ name: string; type: 'file' | 'directory'; size: number; modified: Date }>> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    return new Promise((resolve, reject) => {
      connection.client.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }

        sftp.readdir(remotePath, (err, list) => {
          if (err) {
            reject(err);
            return;
          }

          const files = list.map(item => ({
            name: item.filename,
            type: item.attrs.isDirectory() ? 'directory' as const : 'file' as const,
            size: item.attrs.size || 0,
            modified: new Date((item.attrs.mtime || 0) * 1000)
          }));

          connection.info.lastActivity = new Date();
          resolve(files);
        });
      });
    });
  }

  public async setupRemoteProject(
    connectionId: string,
    projectPath: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Проверяем существование директории
      const lsResult = await this.executeCommand(connectionId, {
        command: `ls -la "${projectPath}"`,
        timeout: 10000
      });

      if (!lsResult.success) {
        return {
          success: false,
          message: `Директория ${projectPath} не найдена на удаленном сервере`
        };
      }

      // Проверяем наличие основных файлов проекта
      const checkFiles = ['package.json', 'index.js', 'src/', 'public/'];
      const foundFiles: string[] = [];

      for (const file of checkFiles) {
        const checkResult = await this.executeCommand(connectionId, {
          command: `test -e "${path.join(projectPath, file)}" && echo "exists" || echo "missing"`,
          cwd: projectPath,
          timeout: 5000
        });

        if (checkResult.stdout.trim() === 'exists') {
          foundFiles.push(file);
        }
      }

      // Обновляем информацию о подключении
      const connection = this.activeConnections.get(connectionId);
      if (connection) {
        connection.projectPath = projectPath;
        connection.lastActivity = new Date();
      }

      return {
        success: true,
        message: `Проект настроен в ${projectPath}. Найдены файлы: ${foundFiles.join(', ')}`
      };

    } catch (error) {
      return {
        success: false,
        message: `Ошибка настройки проекта: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  public async executeRemoteAutomation(
    connectionId: string,
    projectPath: string,
    userMessage: string,
    selectedAgent: string
  ): Promise<AutomationTask> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    // Создаем временную локальную копию проекта для анализа
    const tempDir = path.join(process.cwd(), '.temp-remote-projects', connectionId);
    
    try {
      // Создаем временную директорию
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Скачиваем основные файлы проекта
      await this.downloadProjectFiles(connectionId, projectPath, tempDir);

      // Запускаем автоматизацию на локальной копии
      const task = await taskOrchestrator.executeFullAutomation(
        tempDir,
        userMessage,
        selectedAgent
      );

      // Модифицируем задачу для работы с удаленным сервером
      this.setupRemoteTaskHandling(task, connectionId, projectPath, tempDir);

      return task;

    } catch (error) {
      // Очищаем временную директорию в случае ошибки
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      throw error;
    }
  }

  private async downloadProjectFiles(
    connectionId: string,
    remotePath: string,
    localPath: string
  ): Promise<void> {
    // Скачиваем основные файлы для анализа
    const importantFiles = [
      'package.json',
      'package-lock.json',
      'yarn.lock',
      'tsconfig.json',
      'webpack.config.js',
      'vite.config.js',
      'next.config.js',
      '.gitignore',
      'README.md'
    ];

    const importantDirs = [
      'src',
      'public',
      'components',
      'pages',
      'styles'
    ];

    // Скачиваем важные файлы
    for (const file of importantFiles) {
      try {
        const remoteFile = path.join(remotePath, file);
        const localFile = path.join(localPath, file);
        
        await this.downloadFile(connectionId, remoteFile, localFile);
      } catch (error) {
        // Файл может не существовать, это нормально
        console.log(`File ${file} not found, skipping`);
      }
    }

    // Скачиваем важные директории (ограниченно)
    for (const dir of importantDirs) {
      try {
        await this.downloadDirectoryLimited(connectionId, 
          path.join(remotePath, dir), 
          path.join(localPath, dir),
          2 // максимум 2 уровня вложенности
        );
      } catch (error) {
        console.log(`Directory ${dir} not found or error downloading, skipping`);
      }
    }
  }

  private async downloadDirectoryLimited(
    connectionId: string,
    remotePath: string,
    localPath: string,
    maxDepth: number
  ): Promise<void> {
    if (maxDepth <= 0) return;

    try {
      const files = await this.listDirectory(connectionId, remotePath);
      
      if (!fs.existsSync(localPath)) {
        fs.mkdirSync(localPath, { recursive: true });
      }

      for (const file of files) {
        const remoteFile = path.join(remotePath, file.name);
        const localFile = path.join(localPath, file.name);

        if (file.type === 'file' && file.size < 1024 * 1024) { // Только файлы < 1MB
          try {
            await this.downloadFile(connectionId, remoteFile, localFile);
          } catch (error) {
            console.log(`Failed to download ${remoteFile}, skipping`);
          }
        } else if (file.type === 'directory' && maxDepth > 1) {
          await this.downloadDirectoryLimited(connectionId, remoteFile, localFile, maxDepth - 1);
        }
      }
    } catch (error) {
      console.log(`Failed to list directory ${remotePath}:`, error);
    }
  }

  private setupRemoteTaskHandling(
    task: AutomationTask,
    connectionId: string,
    remotePath: string,
    tempPath: string
  ): void {
    // Добавляем обработчик для загрузки изменений на удаленный сервер
    const originalSteps = task.steps;
    
    // Добавляем шаг загрузки изменений
    task.steps.push({
      id: 'upload_changes',
      name: '📤 Загрузка изменений',
      description: 'Загрузка измененных файлов на удаленный сервер',
      status: 'pending',
      progress: 0
    });

    // Добавляем шаг очистки
    task.steps.push({
      id: 'cleanup',
      name: '🧹 Очистка',
      description: 'Очистка временных файлов',
      status: 'pending',
      progress: 0
    });

    // Переопределяем выполнение задачи для работы с удаленным сервером
    // (это упрощенная версия, в реальности нужна более сложная интеграция)
  }

  public async uploadChangesToRemote(
    connectionId: string,
    localPath: string,
    remotePath: string
  ): Promise<{ success: boolean; uploadedFiles: string[]; errors: string[] }> {
    const uploadedFiles: string[] = [];
    const errors: string[] = [];

    try {
      // Получаем список измененных файлов
      const changedFiles = this.getChangedFiles(localPath);

      for (const file of changedFiles) {
        try {
          const localFile = path.join(localPath, file);
          const remoteFile = path.join(remotePath, file);

          // Создаем директории на удаленном сервере если нужно
          const remoteDir = path.dirname(remoteFile);
          await this.executeCommand(connectionId, {
            command: `mkdir -p "${remoteDir}"`,
            timeout: 10000
          });

          // Загружаем файл
          await this.uploadFile(connectionId, localFile, remoteFile);
          uploadedFiles.push(file);

        } catch (error) {
          errors.push(`${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: errors.length === 0,
        uploadedFiles,
        errors
      };

    } catch (error) {
      return {
        success: false,
        uploadedFiles,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private getChangedFiles(projectPath: string): string[] {
    // Простая реализация - возвращаем все файлы
    // В реальности нужно отслеживать изменения
    const files: string[] = [];
    
    const scanDir = (dir: string, relativePath: string = '') => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativeItemPath = path.join(relativePath, item);
        
        if (fs.statSync(fullPath).isDirectory()) {
          if (!item.startsWith('.') && item !== 'node_modules') {
            scanDir(fullPath, relativeItemPath);
          }
        } else {
          files.push(relativeItemPath);
        }
      }
    };

    try {
      scanDir(projectPath);
    } catch (error) {
      console.error('Error scanning directory:', error);
    }

    return files;
  }

  public getActiveConnections(): SSHConnection[] {
    return Array.from(this.activeConnections.values());
  }

  public getConnection(connectionId: string): SSHConnection | undefined {
    return this.activeConnections.get(connectionId);
  }

  public async testConnection(credentials: SSHCredentials): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const connection = await this.connect(credentials);
      
      // Выполняем тестовую команду
      const result = await this.executeCommand(connection.id, {
        command: 'echo "SSH connection test successful" && whoami && pwd',
        timeout: 10000
      });

      await this.disconnect(connection.id);

      return {
        success: true,
        message: 'SSH подключение успешно установлено',
        details: {
          output: result.stdout,
          duration: result.duration
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Ошибка подключения: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private generateConnectionId(): string {
    return `ssh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public async cleanup(): Promise<void> {
    // Закрываем все активные подключения
    for (const [connectionId, connection] of this.connections) {
      try {
        connection.client.end();
      } catch (error) {
        console.error(`Error closing connection ${connectionId}:`, error);
      }
    }

    this.connections.clear();
    this.activeConnections.clear();

    // Очищаем временные файлы
    const tempDir = path.join(process.cwd(), '.temp-remote-projects');
    if (fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.error('Error cleaning temp directory:', error);
      }
    }
  }
}

export const sshManager = new SSHManager();
