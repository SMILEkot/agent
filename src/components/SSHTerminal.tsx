import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sshService } from '../services/sshService';
import { SSHConfig } from '../types/electron';

interface SSHTerminalProps {
  className?: string;
}

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: Date;
}

export const SSHTerminal: React.FC<SSHTerminalProps> = ({ className = '' }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentHost, setCurrentHost] = useState('');
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [connectionConfig, setConnectionConfig] = useState<SSHConfig>({
    host: '',
    username: '',
    password: '',
    port: 22,
  });
  const [showConnectionForm, setShowConnectionForm] = useState(true);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Автофокус на терминал
    if (inputRef.current && isConnected) {
      inputRef.current.focus();
    }
  }, [isConnected]);

  useEffect(() => {
    // Автоскролл вниз при добавлении новых строк
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const addLine = (type: TerminalLine['type'], content: string) => {
    setLines(prev => [...prev, {
      type,
      content,
      timestamp: new Date(),
    }]);
  };

  const handleConnect = async () => {
    if (!connectionConfig.host || !connectionConfig.username) {
      addLine('error', 'Пожалуйста, заполните хост и имя пользователя');
      return;
    }

    setIsConnecting(true);
    addLine('system', `Подключение к ${connectionConfig.username}@${connectionConfig.host}:${connectionConfig.port}...`);

    try {
      const result = await sshService.connect(connectionConfig);
      
      if (result.success) {
        setIsConnected(true);
        setCurrentHost(connectionConfig.host);
        setShowConnectionForm(false);
        addLine('system', `✅ Успешно подключен к ${connectionConfig.host}`);
        addLine('system', 'Введите команду или используйте готовые команды ниже:');
      } else {
        addLine('error', `❌ Ошибка подключения: ${result.error}`);
      }
    } catch (error) {
      addLine('error', `❌ Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (currentHost) {
      await sshService.disconnect(currentHost);
      setIsConnected(false);
      setCurrentHost('');
      setShowConnectionForm(true);
      addLine('system', '🔌 Соединение закрыто');
    }
  };

  const executeCommand = async (command: string) => {
    if (!isConnected || !currentHost) {
      addLine('error', 'Нет активного SSH соединения');
      return;
    }

    addLine('input', `$ ${command}`);
    
    try {
      const result = await sshService.execute(currentHost, command);
      
      if (result.success) {
        if (result.stdout) {
          addLine('output', result.stdout);
        }
        if (result.stderr) {
          addLine('error', result.stderr);
        }
      } else {
        addLine('error', `Ошибка выполнения: ${result.error}`);
      }
    } catch (error) {
      addLine('error', `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentInput.trim()) {
      executeCommand(currentInput.trim());
      setCurrentInput('');
    }
  };

  const handleQuickCommand = async (commandType: string) => {
    if (!isConnected || !currentHost) {
      addLine('error', 'Нет активного SSH соединения');
      return;
    }

    addLine('system', `Выполняем: ${commandType}...`);

    try {
      let result;
      switch (commandType) {
        case 'update':
          result = await sshService.updateSystem(currentHost);
          break;
        case 'nodejs':
          result = await sshService.installNodeJS(currentHost);
          break;
        case 'docker':
          result = await sshService.installDocker(currentHost);
          break;
        case 'nginx':
          result = await sshService.installNginx(currentHost);
          break;
        case 'info':
          result = await sshService.getSystemInfo(currentHost);
          break;
        default:
          addLine('error', 'Неизвестная команда');
          return;
      }

      if (result.success) {
        addLine('output', result.stdout || 'Команда выполнена успешно');
      } else {
        addLine('error', `Ошибка: ${result.error}`);
      }
    } catch (error) {
      addLine('error', `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 text-green-400 font-mono ${className}`}>
      {/* Заголовок */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="ml-4 text-white">SSH Terminal</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {isConnected && (
            <span className="text-green-400 text-sm">
              🟢 {currentHost}
            </span>
          )}
          {isConnected && (
            <button
              onClick={handleDisconnect}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Отключить
            </button>
          )}
        </div>
      </div>

      {/* Форма подключения */}
      {showConnectionForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gray-800 border-b border-gray-700"
        >
          <h3 className="text-white mb-4">SSH Подключение</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Хост (IP или домен)"
              value={connectionConfig.host}
              onChange={(e) => setConnectionConfig(prev => ({ ...prev, host: e.target.value }))}
              className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Имя пользователя"
              value={connectionConfig.username}
              onChange={(e) => setConnectionConfig(prev => ({ ...prev, username: e.target.value }))}
              className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Пароль"
              value={connectionConfig.password}
              onChange={(e) => setConnectionConfig(prev => ({ ...prev, password: e.target.value }))}
              className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="number"
              placeholder="Порт (22)"
              value={connectionConfig.port}
              onChange={(e) => setConnectionConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 22 }))}
              className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? 'Подключение...' : 'Подключиться'}
          </button>
        </motion.div>
      )}

      {/* Быстрые команды */}
      {isConnected && (
        <div className="p-4 bg-gray-800 border-b border-gray-700">
          <h4 className="text-white mb-2">Быстрые команды:</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleQuickCommand('info')}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Информация о системе
            </button>
            <button
              onClick={() => handleQuickCommand('update')}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Обновить систему
            </button>
            <button
              onClick={() => handleQuickCommand('nodejs')}
              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
            >
              Установить Node.js
            </button>
            <button
              onClick={() => handleQuickCommand('docker')}
              className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
            >
              Установить Docker
            </button>
            <button
              onClick={() => handleQuickCommand('nginx')}
              className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
            >
              Установить Nginx
            </button>
          </div>
        </div>
      )}

      {/* Терминал */}
      <div 
        ref={terminalRef}
        className="flex-1 p-4 overflow-y-auto space-y-1"
      >
        {lines.map((line, index) => (
          <div key={index} className="flex items-start space-x-2">
            <span className="text-gray-500 text-xs w-20 flex-shrink-0">
              {formatTimestamp(line.timestamp)}
            </span>
            <span className={`flex-1 ${
              line.type === 'input' ? 'text-blue-400' :
              line.type === 'error' ? 'text-red-400' :
              line.type === 'system' ? 'text-yellow-400' :
              'text-green-400'
            }`}>
              {line.content}
            </span>
          </div>
        ))}
      </div>

      {/* Ввод команд */}
      {isConnected && (
        <form onSubmit={handleInputSubmit} className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="text-green-400">$</span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="Введите команду..."
              className="flex-1 bg-transparent text-green-400 outline-none"
              autoComplete="off"
            />
          </div>
        </form>
      )}
    </div>
  );
};
