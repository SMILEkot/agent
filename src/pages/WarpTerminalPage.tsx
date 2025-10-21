import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WarpTerminal from '../components/WarpTerminal';
import { terminalService } from '../services/terminalService';
import { agentService } from '../services/agentService';
import { commandSuggestionService } from '../services/commandSuggestionService';
import { ArrowLeft, Settings, Sparkles, Terminal, Zap } from 'lucide-react';

const WarpTerminalPage: React.FC = () => {
  const navigate = useNavigate();
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Создаем сессию терминала при загрузке
    terminalService.createSession(sessionId);

    return () => {
      // Очищаем сессию при выходе
      terminalService.destroySession(sessionId);
    };
  }, [sessionId]);

  // Обработка выполнения команд
  const handleCommand = async (command: string) => {
    try {
      setIsLoading(true);
      const result = await terminalService.executeCommand(sessionId, command);
      return result;
    } catch (error) {
      return {
        output: `Error: ${error instanceof Error ? error.message : String(error)}`,
        exitCode: 1
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка Agent Mode
  const handleAgentMode = async (query: string) => {
    try {
      setIsLoading(true);
      const result = await agentService.executeTask(sessionId, query);
      return result;
    } catch (error) {
      throw new Error(`Agent Mode error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#0f0f23]">
      {/* Верхняя панель */}
      <div className="flex items-center justify-between p-4 bg-[#1a1a2e] border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white">AI Terminal</h1>
            <div className="px-2 py-1 bg-blue-600/20 rounded-md">
              <span className="text-blue-400 text-xs font-medium">Warp-like</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isLoading && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-600/20 rounded-md">
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
              <span className="text-yellow-400 text-sm">Processing...</span>
            </div>
          )}
          
          <button
            onClick={() => navigate('/settings')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Основной терминал */}
      <div className="flex-1">
        <WarpTerminal
          onCommand={handleCommand}
          onAgentMode={handleAgentMode}
          className="h-full"
        />
      </div>

      {/* Нижняя панель с подсказками */}
      <div className="p-3 bg-[#1a1a2e] border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span><kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Ctrl+I</kbd> Agent Mode</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span><kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">#</kbd> Command Suggestions</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-green-400" />
              <span><kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Ctrl+C</kbd> Cancel</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>Session: {sessionId.slice(-8)}</span>
            <div className="w-2 h-2 bg-green-400 rounded-full" title="Connected" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarpTerminalPage;
