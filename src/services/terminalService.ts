// Веб-совместимая версия без node-pty
// import { spawn, ChildProcess } from 'child_process';
// import { platform } from 'os';

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
  // private processes: Map<string, ChildProcess> = new Map();

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

  // Выполнение команды в сессии (веб-совместимая версия)
  async executeCommand(sessionId: string, command: string): Promise<CommandResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Добавляем команду в историю
    session.history.push(command);

    // Веб-совместимая симуляция выполнения команд
    return this.simulateCommand(session, command);
  }

  // Симуляция выполнения команд для веб-версии
  private async simulateCommand(session: TerminalSession, command: string): Promise<CommandResult> {
    const cmd = command.trim().toLowerCase();
    
    // Обработка cd команд
    if (cmd.startsWith('cd ')) {
      this.handleCdCommand(session, command);
      return {
        output: `Changed directory to: ${session.cwd}`,
        exitCode: 0
      };
    }

    // Симуляция популярных команд
    if (cmd === 'pwd') {
      return {
        output: session.cwd,
        exitCode: 0
      };
    }

    if (cmd === 'ls' || cmd === 'dir') {
      return {
        output: `📁 Documents/\n📁 Downloads/\n📁 Pictures/\n📄 README.md\n📄 package.json`,
        exitCode: 0
      };
    }

    if (cmd === 'ls -la') {
      return {
        output: `total 8
drwxr-xr-x  5 user user  160 Oct 21 08:00 .
drwxr-xr-x  3 user user   96 Oct 21 07:30 ..
-rw-r--r--  1 user user 1024 Oct 21 08:00 README.md
-rw-r--r--  1 user user 2048 Oct 21 08:00 package.json
drwxr-xr-x  2 user user   64 Oct 21 07:45 src`,
        exitCode: 0
      };
    }

    if (cmd === 'ps aux' || cmd === 'tasklist') {
      return {
        output: `PID    COMMAND
1234   node server.js
5678   chrome.exe
9012   code.exe
3456   ai-agent-desktop`,
        exitCode: 0
      };
    }

    if (cmd === 'node --version' || cmd === 'node -v') {
      return {
        output: 'v22.19.0',
        exitCode: 0
      };
    }

    if (cmd === 'npm --version') {
      return {
        output: '10.9.0',
        exitCode: 0
      };
    }

    if (cmd === 'git status') {
      return {
        output: `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   src/components/WarpTerminal.tsx

no changes added to commit (use "git add" or "git commit -a")`,
        exitCode: 0
      };
    }

    if (cmd.startsWith('ping ')) {
      const target = cmd.split(' ')[1] || 'google.com';
      return {
        output: `PING ${target} (142.250.191.14): 56 data bytes
64 bytes from 142.250.191.14: icmp_seq=0 ttl=117 time=12.345 ms
64 bytes from 142.250.191.14: icmp_seq=1 ttl=117 time=11.234 ms
64 bytes from 142.250.191.14: icmp_seq=2 ttl=117 time=13.456 ms

--- ${target} ping statistics ---
3 packets transmitted, 3 packets received, 0.0% packet loss`,
        exitCode: 0
      };
    }

    if (cmd === 'whoami') {
      return {
        output: 'user',
        exitCode: 0
      };
    }

    if (cmd === 'date') {
      return {
        output: new Date().toString(),
        exitCode: 0
      };
    }

    if (cmd.startsWith('echo ')) {
      const text = command.slice(5);
      return {
        output: text,
        exitCode: 0
      };
    }

    if (cmd === 'clear' || cmd === 'cls') {
      return {
        output: '\x1b[2J\x1b[H', // ANSI clear screen
        exitCode: 0
      };
    }

    // Для неизвестных команд
    return {
      output: `bash: ${command}: command not found\n\n💡 Это веб-версия терминала с симуляцией команд.\nПоддерживаемые команды: ls, pwd, cd, ps, node -v, npm -v, git status, ping, whoami, date, echo, clear`,
      exitCode: 127
    };
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

  // Получение подходящего shell (веб-версия)
  private getShell(): string {
    // Определяем платформу по user agent
    const isWindows = navigator.userAgent.includes('Windows');
    return isWindows ? 'cmd.exe' : '/bin/bash';
  }

  // Получение аргументов для shell (веб-версия)
  private getShellArgs(command: string): string[] {
    const isWindows = navigator.userAgent.includes('Windows');
    return isWindows ? ['/c', command] : ['-c', command];
  }

  // Завершение процесса (веб-версия - заглушка)
  killProcess(sessionId: string, processId?: string) {
    // В веб-версии процессы не запускаются, поэтому просто логируем
    console.log(`Simulated kill process for session ${sessionId}, process ${processId}`);
  }

  // Очистка сессии
  destroySession(sessionId: string) {
    this.killProcess(sessionId);
    this.sessions.delete(sessionId);
  }

  // Получение информации о системе (веб-версия)
  async getSystemInfo(): Promise<Record<string, any>> {
    const isWindows = navigator.userAgent.includes('Windows');
    const isMac = navigator.userAgent.includes('Mac');
    const isLinux = navigator.userAgent.includes('Linux');
    
    let platform = 'unknown';
    if (isWindows) platform = 'win32';
    else if (isMac) platform = 'darwin';
    else if (isLinux) platform = 'linux';
    
    return {
      platform,
      arch: 'x64',
      hostname: 'localhost',
      uptime: Math.floor(performance.now() / 1000),
      memory: {
        total: 8 * 1024 * 1024 * 1024, // 8GB симуляция
        free: 4 * 1024 * 1024 * 1024   // 4GB свободно
      },
      cpus: navigator.hardwareConcurrency || 4,
      nodeVersion: 'v22.19.0',
      cwd: '/home/user' // Симуляция
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

    const isWindows = navigator.userAgent.includes('Windows');
    const commands = isWindows ? 
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
