import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { Sparkles, Play, Copy, RotateCcw } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';

interface CommandBlock {
  id: string;
  command: string;
  output: string;
  timestamp: Date;
  exitCode: number;
  isRunning: boolean;
}

interface WarpTerminalProps {
  onCommand?: (command: string) => Promise<{ output: string; exitCode: number }>;
  onAgentMode?: (query: string) => Promise<string>;
  className?: string;
}

export const WarpTerminal: React.FC<WarpTerminalProps> = ({
  onCommand,
  onAgentMode,
  className = ''
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  
  const [blocks, setBlocks] = useState<CommandBlock[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Создаем терминал с современной темой
    terminal.current = new Terminal({
      theme: {
        background: '#0f0f23',
        foreground: '#e4e4e7',
        cursor: '#3b82f6',
        selection: '#3b82f640',
        black: '#27272a',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#f4f4f5',
        brightBlack: '#52525b',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#facc15',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#ffffff'
      },
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 14,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 1000,
      tabStopWidth: 4
    });

    // Добавляем аддоны
    fitAddon.current = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    const searchAddon = new SearchAddon();

    terminal.current.loadAddon(fitAddon.current);
    terminal.current.loadAddon(webLinksAddon);
    terminal.current.loadAddon(searchAddon);

    // Открываем терминал
    terminal.current.open(terminalRef.current);
    fitAddon.current.fit();

    // Показываем приветствие
    showWelcome();

    // Обработка ввода
    terminal.current.onData(handleTerminalInput);

    // Обработка изменения размера
    const handleResize = () => {
      if (fitAddon.current) {
        fitAddon.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (terminal.current) {
        terminal.current.dispose();
      }
    };
  }, []);

  const showWelcome = () => {
    if (!terminal.current) return;

    terminal.current.writeln('\x1b[36m╭─────────────────────────────────────────────────────────────╮\x1b[0m');
    terminal.current.writeln('\x1b[36m│\x1b[0m \x1b[1;32m🚀 AI Agent Terminal - Warp-like Experience\x1b[0m              \x1b[36m│\x1b[0m');
    terminal.current.writeln('\x1b[36m├─────────────────────────────────────────────────────────────┤\x1b[0m');
    terminal.current.writeln('\x1b[36m│\x1b[0m \x1b[33m💡 Подсказки:\x1b[0m                                            \x1b[36m│\x1b[0m');
    terminal.current.writeln('\x1b[36m│\x1b[0m   \x1b[32m#\x1b[0m + описание → AI предложит команду                  \x1b[36m│\x1b[0m');
    terminal.current.writeln('\x1b[36m│\x1b[0m   \x1b[32mCtrl+I\x1b[0m → Agent Mode (естественный язык)           \x1b[36m│\x1b[0m');
    terminal.current.writeln('\x1b[36m│\x1b[0m   \x1b[32mCtrl+C\x1b[0m → Выход из Agent Mode                      \x1b[36m│\x1b[0m');
    terminal.current.writeln('\x1b[36m╰─────────────────────────────────────────────────────────────╯\x1b[0m');
    terminal.current.writeln('');
    showPrompt();
  };

  const showPrompt = () => {
    if (!terminal.current) return;
    
    const promptSymbol = isAgentMode ? '\x1b[35m✨\x1b[0m' : '\x1b[32m$\x1b[0m';
    const promptText = isAgentMode ? 'agent' : 'terminal';
    
    terminal.current.write(`\x1b[36m[\x1b[0m\x1b[1m${promptText}\x1b[0m\x1b[36m]\x1b[0m ${promptSymbol} `);
  };

  const handleTerminalInput = (data: string) => {
    if (!terminal.current) return;

    // Обработка специальных клавиш
    if (data === '\r') { // Enter
      handleEnter();
      return;
    }

    if (data === '\u0003') { // Ctrl+C
      if (isAgentMode) {
        setIsAgentMode(false);
        terminal.current.writeln('\n\x1b[33mВыход из Agent Mode\x1b[0m');
        setCurrentInput('');
        showPrompt();
        return;
      }
    }

    if (data === '\u0009') { // Ctrl+I
      setIsAgentMode(!isAgentMode);
      const mode = !isAgentMode ? 'Agent Mode' : 'Terminal Mode';
      terminal.current.writeln(`\n\x1b[33mПереключение в ${mode}\x1b[0m`);
      setCurrentInput('');
      showPrompt();
      return;
    }

    if (data === '\u007f') { // Backspace
      if (currentInput.length > 0) {
        setCurrentInput(prev => prev.slice(0, -1));
        terminal.current.write('\b \b');
      }
      return;
    }

    // Обычный ввод
    if (data >= ' ' && data <= '~') {
      setCurrentInput(prev => prev + data);
      terminal.current.write(data);
    }
  };

  const handleEnter = async () => {
    if (!terminal.current || !currentInput.trim()) {
      terminal.current?.writeln('');
      showPrompt();
      return;
    }

    terminal.current.writeln('');

    if (isAgentMode) {
      await handleAgentCommand(currentInput.trim());
    } else if (currentInput.startsWith('#')) {
      await handleCommandSuggestion(currentInput.slice(1).trim());
    } else {
      await handleRegularCommand(currentInput.trim());
    }

    setCurrentInput('');
    showPrompt();
  };

  const handleAgentCommand = async (query: string) => {
    if (!terminal.current || !onAgentMode) return;

    setIsLoading(true);
    
    try {
      terminal.current.writeln(`\x1b[35m🤖 Agent Mode: ${query}\x1b[0m`);
      terminal.current.writeln('\x1b[33m⏳ Обрабатываю запрос...\x1b[0m');
      
      const response = await onAgentMode(query);
      
      terminal.current.writeln(`\x1b[32m✅ ${response}\x1b[0m`);
    } catch (error) {
      terminal.current.writeln(`\x1b[31m❌ Ошибка: ${error}\x1b[0m`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommandSuggestion = async (description: string) => {
    if (!terminal.current) return;

    terminal.current.writeln(`\x1b[33m💡 Ищу команду для: ${description}\x1b[0m`);
    
    // Здесь будет логика AI Command Suggestions
    // Пока заглушка
    const suggestions = [
      'ls -la',
      'ps aux | grep node',
      'docker ps',
      'git status'
    ];
    
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    terminal.current.writeln(`\x1b[32m💡 Предлагаю: \x1b[1m${randomSuggestion}\x1b[0m`);
    terminal.current.writeln('\x1b[36mНажмите Enter для выполнения или введите другую команду\x1b[0m');
  };

  const handleRegularCommand = async (command: string) => {
    if (!terminal.current || !onCommand) return;

    const block: CommandBlock = {
      id: uuidv4(),
      command,
      output: '',
      timestamp: new Date(),
      exitCode: 0,
      isRunning: true
    };

    setBlocks(prev => [...prev, block]);

    try {
      terminal.current.writeln(`\x1b[36m⚡ Выполняю: ${command}\x1b[0m`);
      
      const result = await onCommand(command);
      
      block.output = result.output;
      block.exitCode = result.exitCode;
      block.isRunning = false;

      if (result.exitCode === 0) {
        terminal.current.writeln(`\x1b[32m✅ Команда выполнена успешно\x1b[0m`);
      } else {
        terminal.current.writeln(`\x1b[31m❌ Команда завершилась с ошибкой (код: ${result.exitCode})\x1b[0m`);
      }

      if (result.output) {
        terminal.current.writeln(result.output);
      }

      setBlocks(prev => prev.map(b => b.id === block.id ? block : b));
    } catch (error) {
      terminal.current.writeln(`\x1b[31m❌ Ошибка выполнения: ${error}\x1b[0m`);
      block.isRunning = false;
      block.exitCode = 1;
      setBlocks(prev => prev.map(b => b.id === block.id ? block : b));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={`flex flex-col h-full bg-[#0f0f23] ${className}`}>
      {/* Заголовок терминала */}
      <div className="flex items-center justify-between p-3 bg-[#1a1a2e] border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-gray-300 text-sm font-medium">AI Terminal</span>
          {isAgentMode && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-purple-600/20 rounded-md">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span className="text-purple-400 text-xs">Agent Mode</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAgentMode(!isAgentMode)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Toggle Agent Mode (Ctrl+I)"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Основной терминал */}
      <div className="flex-1 relative">
        <div
          ref={terminalRef}
          className="absolute inset-0 p-4"
          style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
        />
      </div>

      {/* Блоки команд (боковая панель) */}
      {blocks.length > 0 && (
        <div className="w-80 bg-[#1a1a2e] border-l border-gray-700 p-4 overflow-y-auto">
          <h3 className="text-white font-medium mb-3">Command History</h3>
          <div className="space-y-2">
            {blocks.slice(-10).map((block) => (
              <div
                key={block.id}
                className="p-3 bg-[#0f0f23] rounded-lg border border-gray-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">
                    {format(block.timestamp, 'HH:mm:ss')}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => copyToClipboard(block.command)}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                      title="Copy command"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {block.isRunning && (
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                    )}
                    {!block.isRunning && (
                      <div className={`w-3 h-3 rounded-full ${
                        block.exitCode === 0 ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-300 font-mono">
                  {block.command}
                </div>
                {block.output && (
                  <div className="mt-2 text-xs text-gray-400 max-h-20 overflow-y-auto">
                    {block.output.slice(0, 200)}
                    {block.output.length > 200 && '...'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WarpTerminal;
