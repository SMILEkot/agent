import React, { useState, useEffect } from 'react';
import AIAgentSelector from './AIAgentSelector';
import AICredentialsSetup from './AICredentialsSetup';
import SSHConnectionManager from './SSHConnectionManager';

interface Task {
  id: string;
  projectPath: string;
  userMessage: string;
  selectedAgent: string;
  isRemote: boolean;
  sshConnectionId?: string;
  status: 'starting' | 'running' | 'completed' | 'failed';
  progress: number;
  steps: Array<{
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
  }>;
  startTime: Date;
  endTime?: Date;
  logs: string[];
  error?: string;
}

interface SSHConnection {
  id: string;
  host: string;
  port: number;
  username: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastActivity: Date;
  projectPath?: string;
  error?: string;
}

interface ProjectAnalysis {
  projectType: string;
  framework: string;
  packageManager: string;
  dependencies: number;
  devDependencies: number;
  files: {
    total: number;
    components: number;
    styles: number;
    tests: number;
    configs: number;
  };
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    count: number;
  }>;
  recommendations: string[];
}

const MainDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'automation' | 'ssh' | 'ai' | 'analysis'>('automation');
  const [showAISetup, setShowAISetup] = useState(false);
  const [showSSHManager, setShowSSHManager] = useState(false);
  
  // Состояние автоматизации
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [userMessage, setUserMessage] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [projectPath, setProjectPath] = useState('./');
  const [isRemote, setIsRemote] = useState(false);
  const [selectedSSHConnection, setSelectedSSHConnection] = useState('');
  
  // Состояние SSH
  const [sshConnections, setSshConnections] = useState<SSHConnection[]>([]);
  
  // Состояние анализа
  const [projectAnalysis, setProjectAnalysis] = useState<ProjectAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadTasks();
    loadSSHConnections();
  }, []);

  useEffect(() => {
    // Обновляем статус текущей задачи каждые 2 секунды
    let interval: NodeJS.Timeout;
    if (currentTask && (currentTask.status === 'starting' || currentTask.status === 'running')) {
      interval = setInterval(() => {
        updateTaskStatus(currentTask.id);
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentTask]);

  const loadTasks = async () => {
    try {
      const response = await fetch('/api/automation/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const loadSSHConnections = async () => {
    try {
      const response = await fetch('/api/ssh/connections');
      if (response.ok) {
        const data = await response.json();
        setSshConnections(data.connections || []);
      }
    } catch (error) {
      console.error('Failed to load SSH connections:', error);
    }
  };

  const updateTaskStatus = async (taskId: string) => {
    try {
      const response = await fetch(`/api/automation/status?taskId=${taskId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentTask(data.task);
          // Обновляем задачу в списке
          setTasks(prev => prev.map(t => t.id === taskId ? data.task : t));
        }
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const startAutomation = async () => {
    if (!userMessage.trim() || !selectedAgent) {
      alert('Пожалуйста, введите сообщение и выберите AI агента');
      return;
    }

    if (isRemote && !selectedSSHConnection) {
      alert('Пожалуйста, выберите SSH подключение для удаленной работы');
      return;
    }

    try {
      const response = await fetch('/api/automation/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectPath,
          userMessage,
          selectedAgent,
          isRemote,
          sshConnectionId: isRemote ? selectedSSHConnection : undefined
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setCurrentTask(result.task);
        setTasks(prev => [result.task, ...prev]);
        setUserMessage('');
      } else {
        alert(`Ошибка запуска автоматизации: ${result.error}`);
      }
    } catch (error) {
      alert(`Ошибка сети: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const analyzeProject = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/project/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ projectPath })
      });

      const result = await response.json();
      
      if (result.success) {
        setProjectAnalysis(result.analysis);
      } else {
        alert(`Ошибка анализа: ${result.error}`);
      }
    } catch (error) {
      alert(`Ошибка сети: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'running': case 'starting': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'running': case 'starting': return '⏳';
      case 'failed': return '❌';
      default: return '⏸️';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                🤖 AI Agent Desktop
              </h1>
              <span className="text-sm text-gray-500">
                Автоматизация разработки с AI
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAISetup(true)}
                className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
              >
                🧠 AI Настройки
              </button>
              <button
                onClick={() => setShowSSHManager(true)}
                className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              >
                🔗 SSH Подключения
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'automation', name: '🚀 Автоматизация', icon: '🚀' },
              { id: 'analysis', name: '📊 Анализ проекта', icon: '📊' },
              { id: 'ssh', name: '🔗 SSH Подключения', icon: '🔗' },
              { id: 'ai', name: '🧠 AI Агенты', icon: '🧠' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Automation Tab */}
        {activeTab === 'automation' && (
          <div className="space-y-6">
            {/* Quick Start Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                🚀 Быстрый запуск автоматизации
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Путь к проекту
                    </label>
                    <input
                      type="text"
                      value={projectPath}
                      onChange={(e) => setProjectPath(e.target.value)}
                      placeholder="./my-project или /home/user/project"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Что нужно сделать?
                    </label>
                    <textarea
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      placeholder="Опишите, что нужно сделать с проектом..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isRemote}
                        onChange={(e) => setIsRemote(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Удаленный проект (SSH)</span>
                    </label>
                  </div>

                  {isRemote && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SSH Подключение
                      </label>
                      <select
                        value={selectedSSHConnection}
                        onChange={(e) => setSelectedSSHConnection(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Выберите подключение...</option>
                        {sshConnections.filter(conn => conn.status === 'connected').map(conn => (
                          <option key={conn.id} value={conn.id}>
                            {conn.username}@{conn.host}:{conn.port}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <AIAgentSelector
                    selectedAgent={selectedAgent}
                    onAgentSelect={setSelectedAgent}
                    onSetupClick={() => setShowAISetup(true)}
                  />

                  <button
                    onClick={startAutomation}
                    disabled={!userMessage.trim() || !selectedAgent}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    🚀 Запустить автоматизацию
                  </button>
                </div>
              </div>
            </div>

            {/* Current Task */}
            {currentTask && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Текущая задача
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStatusIcon(currentTask.status)}</span>
                    <span className={`text-sm font-medium ${getStatusColor(currentTask.status)}`}>
                      {currentTask.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Прогресс: {currentTask.progress}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${currentTask.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentTask.steps.map((step) => (
                      <div
                        key={step.id}
                        className={`p-3 rounded-lg border ${
                          step.status === 'completed' ? 'bg-green-50 border-green-200' :
                          step.status === 'running' ? 'bg-blue-50 border-blue-200' :
                          step.status === 'failed' ? 'bg-red-50 border-red-200' :
                          'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{getStatusIcon(step.status)}</span>
                          <span className="text-sm font-medium">{step.name}</span>
                        </div>
                        {step.status === 'running' && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div
                                className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${step.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {currentTask.logs.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Логи выполнения:</h4>
                      <div className="bg-gray-900 text-green-400 p-3 rounded-md text-xs font-mono max-h-40 overflow-y-auto">
                        {currentTask.logs.map((log, index) => (
                          <div key={index}>{log}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Task History */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                История задач
              </h3>
              
              {tasks.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Пока нет выполненных задач
                </p>
              ) : (
                <div className="space-y-3">
                  {tasks.slice(0, 10).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm">{getStatusIcon(task.status)}</span>
                          <span className="font-medium text-sm">{task.userMessage}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {task.selectedAgent} • {new Date(task.startTime).toLocaleString()}
                          {task.isRemote && ' • Удаленно'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getStatusColor(task.status)}`}>
                          {task.progress}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  📊 Анализ проекта
                </h2>
                <button
                  onClick={analyzeProject}
                  disabled={isAnalyzing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isAnalyzing ? '⏳ Анализируем...' : '🔍 Анализировать'}
                </button>
              </div>

              {projectAnalysis && (
                <div className="space-y-6">
                  {/* Project Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-800">Тип проекта</h3>
                      <p className="text-blue-600">{projectAnalysis.projectType}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-green-800">Фреймворк</h3>
                      <p className="text-green-600">{projectAnalysis.framework}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-medium text-purple-800">Пакетный менеджер</h3>
                      <p className="text-purple-600">{projectAnalysis.packageManager}</p>
                    </div>
                  </div>

                  {/* File Statistics */}
                  <div>
                    <h3 className="font-medium text-gray-800 mb-3">Статистика файлов</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">{projectAnalysis.files.total}</div>
                        <div className="text-sm text-gray-600">Всего файлов</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{projectAnalysis.files.components}</div>
                        <div className="text-sm text-gray-600">Компоненты</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{projectAnalysis.files.styles}</div>
                        <div className="text-sm text-gray-600">Стили</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{projectAnalysis.files.tests}</div>
                        <div className="text-sm text-gray-600">Тесты</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{projectAnalysis.files.configs}</div>
                        <div className="text-sm text-gray-600">Конфиги</div>
                      </div>
                    </div>
                  </div>

                  {/* Issues */}
                  <div>
                    <h3 className="font-medium text-gray-800 mb-3">Найденные проблемы</h3>
                    <div className="space-y-2">
                      {projectAnalysis.issues.map((issue, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            issue.type === 'error' ? 'bg-red-50 border-red-200' :
                            issue.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                            'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️'} {issue.message}
                            </span>
                            <span className="text-sm text-gray-600">({issue.count})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h3 className="font-medium text-gray-800 mb-3">Рекомендации</h3>
                    <div className="space-y-2">
                      {projectAnalysis.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <span className="text-green-500 mt-1">✅</span>
                          <span className="text-gray-700">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SSH Tab */}
        {activeTab === 'ssh' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  🔗 SSH Подключения
                </h2>
                <button
                  onClick={() => setShowSSHManager(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  ➕ Управление подключениями
                </button>
              </div>

              {sshConnections.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Нет активных SSH подключений</p>
                  <p className="text-sm mt-2">Создайте новое подключение для удаленной работы</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {sshConnections.map((connection) => (
                    <div key={connection.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-800">
                            {connection.username}@{connection.host}:{connection.port}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Статус: <span className={getStatusColor(connection.status)}>{connection.status}</span>
                          </p>
                          {connection.projectPath && (
                            <p className="text-sm text-gray-600">
                              Проект: <code className="bg-gray-100 px-1 rounded">{connection.projectPath}</code>
                            </p>
                          )}
                        </div>
                        <div className="text-2xl">
                          {connection.status === 'connected' ? '🟢' : 
                           connection.status === 'connecting' ? '🟡' : '🔴'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  🧠 AI Агенты
                </h2>
                <button
                  onClick={() => setShowAISetup(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  ⚙️ Настроить агентов
                </button>
              </div>

              <AIAgentSelector
                selectedAgent={selectedAgent}
                onAgentSelect={setSelectedAgent}
                onSetupClick={() => setShowAISetup(true)}
                showDetails={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AICredentialsSetup
        isOpen={showAISetup}
        onClose={() => setShowAISetup(false)}
      />

      <SSHConnectionManager
        isOpen={showSSHManager}
        onClose={() => setShowSSHManager(false)}
        onConnectionChange={setSshConnections}
      />
    </div>
  );
};

export default MainDashboard;
