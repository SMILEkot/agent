import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Play, Copy, RotateCcw, Sparkles } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

interface CommandBlock {
  id: string;
  command: string;
  output: string;
  exitCode: number;
  timestamp: Date;
  isRunning: boolean;
}

interface SimpleWebTerminalProps {
  className?: string;
}

export const SimpleWebTerminal: React.FC<SimpleWebTerminalProps> = ({ className = '' }) => {
  const [commandBlocks, setCommandBlocks] = useState<CommandBlock[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [agentInput, setAgentInput] = useState('');
  const [currentDirectory, setCurrentDirectory] = useState('/home/user');
  const inputRef = useRef<HTMLInputElement>(null);
  const agentInputRef = useRef<HTMLTextAreaElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Фокус на input при загрузке
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Автоскролл вниз при добавлении новых блоков
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandBlocks]);

  // Симуляция выполнения команд
  const simulateCommand = async (command: string): Promise<{ output: string; exitCode: number; newCwd?: string }> => {
    const cmd = command.trim().toLowerCase();
    
    // Обработка cd команд
    if (cmd.startsWith('cd ')) {
      const path = command.slice(3).trim();
      let newCwd = currentDirectory;
      
      if (path === '..') {
        const parts = currentDirectory.split('/').filter(p => p);
        parts.pop();
        newCwd = '/' + parts.join('/');
        if (newCwd === '/') newCwd = '/home/user';
      } else if (path.startsWith('/')) {
        newCwd = path;
      } else {
        newCwd = currentDirectory === '/' ? `/${path}` : `${currentDirectory}/${path}`;
      }
      
      return {
        output: `Changed directory to: ${newCwd}`,
        exitCode: 0,
        newCwd
      };
    }

    // Симуляция популярных команд
    if (cmd === 'pwd') {
      return { output: currentDirectory, exitCode: 0 };
    }

    if (cmd === 'ls' || cmd === 'dir') {
      return {
        output: `📁 Documents/\n📁 Downloads/\n📁 Pictures/\n📄 README.md\n📄 package.json\n📄 src/`,
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
      return { output: 'v22.19.0', exitCode: 0 };
    }

    if (cmd === 'npm --version') {
      return { output: '10.9.0', exitCode: 0 };
    }

    if (cmd === 'git status') {
      return {
        output: `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   src/components/SimpleWebTerminal.tsx

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
      return { output: 'user', exitCode: 0 };
    }

    if (cmd === 'date') {
      return { output: new Date().toString(), exitCode: 0 };
    }

    if (cmd.startsWith('echo ')) {
      const text = command.slice(5);
      return { output: text, exitCode: 0 };
    }

    if (cmd === 'clear' || cmd === 'cls') {
      setCommandBlocks([]);
      return { output: '', exitCode: 0 };
    }

    if (cmd === 'help') {
      return {
        output: `Доступные команды:
📁 Навигация: ls, pwd, cd <path>
🔧 Система: ps aux, whoami, date
🌐 Сеть: ping <host>
💻 Разработка: node -v, npm -v, git status
📝 Утилиты: echo <text>, clear, help

🤖 AI режим: Ctrl+I для команд естественным языком`,
        exitCode: 0
      };
    }

    // Для неизвестных команд
    return {
      output: `bash: ${command}: command not found

💡 Это веб-версия терминала с симуляцией команд.
Введите 'help' для списка доступных команд.`,
      exitCode: 127
    };
  };

  // Выполнение команды
  const executeCommand = async (command: string) => {
    if (!command.trim()) return;

    const blockId = uuidv4();
    const newBlock: CommandBlock = {
      id: blockId,
      command,
      output: '',
      exitCode: 0,
      timestamp: new Date(),
      isRunning: true
    };

    setCommandBlocks(prev => [...prev, newBlock]);
    setCurrentCommand('');

    // Симуляция задержки выполнения
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const result = await simulateCommand(command);
      
      setCommandBlocks(prev => prev.map(block => 
        block.id === blockId 
          ? { ...block, output: result.output, exitCode: result.exitCode, isRunning: false }
          : block
      ));

      // Обновляем текущую директорию если команда cd
      if (result.newCwd) {
        setCurrentDirectory(result.newCwd);
      }

    } catch (error) {
      setCommandBlocks(prev => prev.map(block => 
        block.id === blockId 
          ? { 
              ...block, 
              output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
              exitCode: 1, 
              isRunning: false 
            }
          : block
      ));
    }
  };

  // Обработка нажатий клавиш
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCommand(currentCommand);
    } else if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      setIsAgentMode(true);
      setTimeout(() => agentInputRef.current?.focus(), 100);
    } else if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      setCurrentCommand('');
    }
  };

  // Обработка Agent Mode
  const handleAgentSubmit = async () => {
    if (!agentInput.trim()) return;

    // Простая обработка естественного языка
    let command = agentInput.toLowerCase();
    
    if (command.includes('покажи файлы') || command.includes('список файлов')) {
      command = 'ls -la';
    } else if (command.includes('текущая папка') || command.includes('где я')) {
      command = 'pwd';
    } else if (command.includes('процессы') || command.includes('запущенные программы')) {
      command = 'ps aux';
    } else if (command.includes('версия node')) {
      command = 'node -v';
    } else if (command.includes('статус git')) {
      command = 'git status';
    } else if (command.includes('очистить') || command.includes('очисти экран')) {
      command = 'clear';
    } else {
      // Если не распознали, выполняем как есть
      command = agentInput;
    }

    setIsAgentMode(false);
    setAgentInput('');
    await executeCommand(command);
    inputRef.current?.focus();
  };

  // Копирование команды
  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
  };

  // Копирование вывода
  const copyOutput = (output: string) => {
    navigator.clipboard.writeText(output);
  };

  // Повтор команды
  const repeatCommand = (command: string) => {
    setCurrentCommand(command);
    inputRef.current?.focus();
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 text-green-400 font-mono ${className}`}>
      {/* Заголовок */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5" />
          <span className="font-semibold">AI Terminal (Web)</span>
        </div>
        <div className="text-sm text-gray-400">
          Ctrl+I для AI режима
        </div>
      </div>

      {/* Терминал */}
      <div 
        ref={terminalRef}
        className="flex-1 p-4 overflow-y-auto space-y-4"
      >
        {/* Приветствие */}
        {commandBlocks.length === 0 && (
          <div className="text-gray-400 text-sm">
            <p>🚀 Добро пожаловать в AI Terminal (Web версия)!</p>
            <p>💡 Введите 'help' для списка команд или Ctrl+I для AI режима</p>
            <p>📁 Текущая директория: {currentDirectory}</p>
          </div>
        )}

        {/* Блоки команд */}
        {commandBlocks.map((block) => (
          <div key={block.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            {/* Заголовок блока */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-blue-400">$</span>
                <span className="text-white">{block.command}</span>
                {block.isRunning && (
                  <div className="animate-spin w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full"></div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">
                  {format(block.timestamp, 'HH:mm:ss')}
                </span>
                <button
                  onClick={() => copyCommand(block.command)}
                  className="p-1 hover:bg-gray-700 rounded"
                  title="Копировать команду"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={() => repeatCommand(block.command)}
                  className="p-1 hover:bg-gray-700 rounded"
                  title="Повторить команду"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Вывод команды */}
            {block.output && (
              <div className="relative">
                <pre className={`text-sm whitespace-pre-wrap ${
                  block.exitCode === 0 ? 'text-green-300' : 'text-red-300'
                }`}>
                  {block.output}
                </pre>
                <button
                  onClick={() => copyOutput(block.output)}
                  className="absolute top-1 right-1 p-1 hover:bg-gray-700 rounded opacity-50 hover:opacity-100"
                  title="Копировать вывод"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Код выхода */}
            {!block.isRunning && (
              <div className="mt-2 text-xs text-gray-500">
                Exit code: {block.exitCode}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Agent Mode Modal */}
      {isAgentMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">AI Agent Mode</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Опишите что вы хотите сделать естественным языком:
            </p>
            <textarea
              ref={agentInputRef}
              value={agentInput}
              onChange={(e) => setAgentInput(e.target.value)}
              placeholder="Например: покажи все файлы в папке"
              className="w-full h-24 bg-gray-900 border border-gray-600 rounded p-3 text-white resize-none focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault();
                  handleAgentSubmit();
                } else if (e.key === 'Escape') {
                  setIsAgentMode(false);
                  setAgentInput('');
                }
              }}
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-xs text-gray-500">
                Ctrl+Enter для выполнения, Esc для отмены
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsAgentMode(false);
                    setAgentInput('');
                  }}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                >
                  Отмена
                </button>
                <button
                  onClick={handleAgentSubmit}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm flex items-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  Выполнить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Поле ввода */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-blue-400">$</span>
          <span className="text-gray-400">{currentDirectory}</span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите команду... (Ctrl+I для AI режима)"
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500"
          />
        </div>
      </div>
    </div>
  );
};

