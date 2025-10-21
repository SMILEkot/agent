import React, { useState, useEffect } from 'react';

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

interface SSHCredentials {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
}

interface SSHConnectionManagerProps {
  onConnectionChange: (connections: SSHConnection[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

const SSHConnectionManager: React.FC<SSHConnectionManagerProps> = ({
  onConnectionChange,
  isOpen,
  onClose
}) => {
  const [connections, setConnections] = useState<SSHConnection[]>([]);
  const [showNewConnectionForm, setShowNewConnectionForm] = useState(false);
  const [credentials, setCredentials] = useState<SSHCredentials>({
    host: '',
    port: 22,
    username: '',
    password: ''
  });
  const [authMethod, setAuthMethod] = useState<'password' | 'key'>('password');
  const [isConnecting, setIsConnecting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadConnections();
    }
  }, [isOpen]);

  const loadConnections = async () => {
    try {
      const response = await fetch('/api/ssh/connections');
      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
        onConnectionChange(data.connections || []);
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/ssh/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const result = await response.json();

      if (result.success) {
        setTestResult({ success: true, message: 'Подключение успешно установлено!' });
        setShowNewConnectionForm(false);
        setCredentials({
          host: '',
          port: 22,
          username: '',
          password: ''
        });
        await loadConnections();
      } else {
        setTestResult({ success: false, message: result.message || 'Ошибка подключения' });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `Ошибка сети: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestConnection = async () => {
    setIsConnecting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/ssh/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `Ошибка тестирования: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/ssh/disconnect/${connectionId}`, {
        method: 'POST'
      });

      if (response.ok) {
        await loadConnections();
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const handleSetupProject = async (connectionId: string, projectPath: string) => {
    try {
      const response = await fetch('/api/ssh/setup-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ connectionId, projectPath })
      });

      const result = await response.json();
      
      if (result.success) {
        await loadConnections();
        alert(`Проект настроен: ${result.message}`);
      } else {
        alert(`Ошибка настройки проекта: ${result.message}`);
      }
    } catch (error) {
      alert(`Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              🔗 SSH Подключения
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Управление SSH подключениями для удаленной работы с проектами
          </p>
        </div>

        <div className="p-6">
          {/* Активные подключения */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">Активные подключения</h3>
              <button
                onClick={() => setShowNewConnectionForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                ➕ Новое подключение
              </button>
            </div>

            {connections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Нет активных SSH подключений</p>
                <p className="text-sm mt-2">Создайте новое подключение для начала работы</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {connections.map((connection) => (
                  <div key={connection.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">{getStatusIcon(connection.status)}</span>
                          <h4 className="font-medium text-gray-800">
                            {connection.username}@{connection.host}:{connection.port}
                          </h4>
                          <span className={`text-sm ${getStatusColor(connection.status)}`}>
                            {connection.status}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Последняя активность: {new Date(connection.lastActivity).toLocaleString()}</p>
                          {connection.projectPath && (
                            <p>Проект: <code className="bg-gray-100 px-1 rounded">{connection.projectPath}</code></p>
                          )}
                          {connection.error && (
                            <p className="text-red-600">Ошибка: {connection.error}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        {connection.status === 'connected' && (
                          <>
                            <button
                              onClick={() => {
                                const projectPath = prompt('Введите путь к проекту на сервере:', '/home/user/project');
                                if (projectPath) {
                                  handleSetupProject(connection.id, projectPath);
                                }
                              }}
                              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              📁 Настроить проект
                            </button>
                            <button
                              onClick={() => handleDisconnect(connection.id)}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              🔌 Отключить
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Форма нового подключения */}
          {showNewConnectionForm && (
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800">Новое SSH подключение</h3>
                <button
                  onClick={() => {
                    setShowNewConnectionForm(false);
                    setTestResult(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Хост
                  </label>
                  <input
                    type="text"
                    placeholder="192.168.1.100 или example.com"
                    value={credentials.host}
                    onChange={(e) => setCredentials({ ...credentials, host: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Порт
                  </label>
                  <input
                    type="number"
                    value={credentials.port}
                    onChange={(e) => setCredentials({ ...credentials, port: parseInt(e.target.value) || 22 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Имя пользователя
                  </label>
                  <input
                    type="text"
                    placeholder="root, ubuntu, user"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Метод аутентификации
                  </label>
                  <select
                    value={authMethod}
                    onChange={(e) => setAuthMethod(e.target.value as 'password' | 'key')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="password">Пароль</option>
                    <option value="key">SSH ключ</option>
                  </select>
                </div>
              </div>

              {authMethod === 'password' ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Пароль
                  </label>
                  <input
                    type="password"
                    value={credentials.password || ''}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Приватный ключ
                    </label>
                    <textarea
                      placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                      value={credentials.privateKey || ''}
                      onChange={(e) => setCredentials({ ...credentials, privateKey: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passphrase (если требуется)
                    </label>
                    <input
                      type="password"
                      value={credentials.passphrase || ''}
                      onChange={(e) => setCredentials({ ...credentials, passphrase: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {testResult && (
                <div className={`mb-4 p-3 rounded-md ${
                  testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  <p className="font-medium">
                    {testResult.success ? '✅ Успешно' : '❌ Ошибка'}
                  </p>
                  <p className="text-sm mt-1">{testResult.message}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleTestConnection}
                  disabled={isConnecting || !credentials.host || !credentials.username}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? '⏳ Тестирование...' : '🧪 Тест подключения'}
                </button>
                
                <button
                  onClick={handleConnect}
                  disabled={isConnecting || !credentials.host || !credentials.username}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? '⏳ Подключение...' : '🔗 Подключиться'}
                </button>
              </div>
            </div>
          )}

          {/* Информация и инструкции */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">💡 Как использовать SSH подключения:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Подключитесь к удаленному серверу через SSH</li>
              <li>• Настройте путь к проекту на сервере</li>
              <li>• Используйте AI автоматизацию для удаленных проектов</li>
              <li>• Все изменения будут применены на удаленном сервере</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">🔒 Безопасность:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Используйте SSH ключи вместо паролей когда возможно</li>
              <li>• Подключения шифруются и защищены</li>
              <li>• Не сохраняйте пароли в браузере</li>
              <li>• Регулярно обновляйте SSH ключи</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SSHConnectionManager;
