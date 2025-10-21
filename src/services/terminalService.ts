import { spawn, ChildProcess } from 'child_process';
import { platform } from 'os';

export interface CommandResult {
  output: string;
  exitCode: number;
}

export interface TerminalSession {
  id: string;
  cwd: string;
  env: Record<string, string>;
  history: string[];
}

class TerminalService {
  private sessions: Map<string, TerminalSession> = new Map();
  private processes: Map<string, ChildProcess> = new Map();

  // Создание новой сессии терминала
  createSession(id: string, initialCwd?: string): TerminalSession {
    const session: TerminalSession = {
      id,
      cwd: initialCwd || process.cwd(),
      env: { ...process.env },
      history: []
    };

    this.sessions.set(id, session);
    return session;
  }

  // Получение сессии
  getSession(id: string): TerminalSession | undefined {
    return this.sessions.get(id);
  }

  // Выполнение команды в сессии
  async executeCommand(sessionId: string, command: string): Promise<CommandResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Добавляем команду в историю
    session.history.push(command);

    return new Promise((resolve) => {
      let output = '';
      let errorOutput = '';

      // Определяем shell в зависимости от платформы
      const shell = this.getShell();
      const shellArgs = this.getShellArgs(command);

      const childProcess = spawn(shell, shellArgs, {
        cwd: session.cwd,
        env: session.env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.processes.set(`${sessionId}-${Date.now()}`, childProcess);

      childProcess.stdout?.on('data', (data) => {
        output += data.toString();
      });

      childProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      childProcess.on('close', (code) => {
        const exitCode = code || 0;
        const finalOutput = output + (errorOutput ? `\nSTDERR:\n${errorOutput}` : '');
        
        // Обновляем рабочую директорию если команда cd
        if (command.trim().startsWith('cd ')) {
          this.handleCdCommand(session, command);
        }

        resolve({
          output: finalOutput,
          exitCode
        });
      });

      childProcess.on('error', (error) => {
        resolve({
          output: `Error: ${error.message}`,
          exitCode: 1
        });
      });
    });
  }

  // Обработка команды cd
  private handleCdCommand(session: TerminalSession, command: string) {
    const cdMatch = command.trim().match(/^cd\s+(.+)$/);
    if (cdMatch) {
      const targetDir = cdMatch[1].trim();
      
      // Обработка специальных случаев
      if (targetDir === '~') {
        session.cwd = process.env.HOME || process.env.USERPROFILE || session.cwd;
      } else if (targetDir === '..') {
        const path = require('path');
        session.cwd = path.dirname(session.cwd);
      } else if (targetDir.startsWith('/') || targetDir.match(/^[A-Z]:/)) {
        // Абсолютный путь
        session.cwd = targetDir;
      } else {
        // Относительный путь
        const path = require('path');
        session.cwd = path.join(session.cwd, targetDir);
      }
    }
  }

  // Получение подходящего shell
  private getShell(): string {
    const os = platform();
    
    if (os === 'win32') {
      return process.env.COMSPEC || 'cmd.exe';
    } else {
      return process.env.SHELL || '/bin/bash';
    }
  }

  // Получение аргументов для shell
  private getShellArgs(command: string): string[] {
    const os = platform();
    
    if (os === 'win32') {
      return ['/c', command];
    } else {
      return ['-c', command];
    }
  }

  // Завершение процесса
  killProcess(sessionId: string, processId?: string) {
    if (processId) {
      const process = this.processes.get(processId);
      if (process) {
        process.kill();
        this.processes.delete(processId);
      }
    } else {
      // Завершаем все процессы сессии
      for (const [id, process] of this.processes.entries()) {
        if (id.startsWith(sessionId)) {
          process.kill();
          this.processes.delete(id);
        }
      }
    }
  }

  // Очистка сессии
  destroySession(sessionId: string) {
    this.killProcess(sessionId);
    this.sessions.delete(sessionId);
  }

  // Получение информации о системе
  async getSystemInfo(): Promise<Record<string, any>> {
    const os = require('os');
    
    return {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem()
      },
      cpus: os.cpus().length,
      nodeVersion: process.version,
      cwd: process.cwd()
    };
  }

  // Автодополнение команд
  async getCommandSuggestions(sessionId: string, partial: string): Promise<string[]> {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    // Базовые команды для разных платформ
    const commonCommands = [
      'ls', 'cd', 'pwd', 'mkdir', 'rmdir', 'rm', 'cp', 'mv', 'cat', 'grep',
      'find', 'ps', 'kill', 'top', 'df', 'du', 'chmod', 'chown', 'tar', 'zip',
      'git', 'npm', 'node', 'python', 'docker', 'curl', 'wget'
    ];

    const windowsCommands = [
      'dir', 'cd', 'md', 'rd', 'del', 'copy', 'move', 'type', 'findstr',
      'tasklist', 'taskkill', 'systeminfo', 'ipconfig', 'ping', 'netstat'
    ];

    const commands = platform() === 'win32' ? 
      [...commonCommands, ...windowsCommands] : 
      commonCommands;

    // Фильтруем команды по частичному вводу
    return commands
      .filter(cmd => cmd.startsWith(partial.toLowerCase()))
      .slice(0, 10);
  }

  // Получение истории команд
  getHistory(sessionId: string): string[] {
    const session = this.sessions.get(sessionId);
    return session ? [...session.history] : [];
  }

  // Очистка истории
  clearHistory(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.history = [];
    }
  }
}

// Экспортируем синглтон
export const terminalService = new TerminalService();
export default terminalService;
