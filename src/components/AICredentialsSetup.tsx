import React, { useState, useEffect } from 'react';

interface AICredentialsSetupProps {
  onCredentialsChange: (credentials: any) => void;
  isOpen: boolean;
  onClose: () => void;
}

const AICredentialsSetup: React.FC<AICredentialsSetupProps> = ({
  onCredentialsChange,
  isOpen,
  onClose
}) => {
  const [credentials, setCredentials] = useState({
    openai: '',
    google: '',
    anthropic: '',
    cohere: '',
    huggingface: ''
  });

  const [showKeys, setShowKeys] = useState({
    openai: false,
    google: false,
    anthropic: false,
    cohere: false,
    huggingface: false
  });

  useEffect(() => {
    // Загружаем сохраненные ключи
    const saved = localStorage.getItem('ai_credentials');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCredentials(parsed);
      } catch (e) {
        console.warn('Failed to parse saved credentials');
      }
    }
  }, []);

  const handleCredentialChange = (provider: string, value: string) => {
    const newCredentials = { ...credentials, [provider]: value };
    setCredentials(newCredentials);
    localStorage.setItem('ai_credentials', JSON.stringify(newCredentials));
    onCredentialsChange(newCredentials);
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider as keyof typeof prev] }));
  };

  const providers = [
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'GPT-3.5 Turbo для кода и общих задач',
      getKeyUrl: 'https://platform.openai.com/api-keys',
      freeInfo: 'Бесплатный tier: $5 кредитов при регистрации'
    },
    {
      id: 'google',
      name: 'Google AI',
      description: 'Gemini 1.5 Flash - быстрый и бесплатный',
      getKeyUrl: 'https://makersuite.google.com/app/apikey',
      freeInfo: 'Полностью бесплатный с лимитами'
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      description: 'Claude 3 Haiku для анализа кода',
      getKeyUrl: 'https://console.anthropic.com/',
      freeInfo: 'Бесплатный tier: $5 кредитов при регистрации'
    },
    {
      id: 'cohere',
      name: 'Cohere',
      description: 'Command для рефакторинга и оптимизации',
      getKeyUrl: 'https://dashboard.cohere.ai/api-keys',
      freeInfo: 'Бесплатный tier с лимитами'
    },
    {
      id: 'huggingface',
      name: 'Hugging Face',
      description: 'Code Llama и другие open-source модели',
      getKeyUrl: 'https://huggingface.co/settings/tokens',
      freeInfo: 'Бесплатный Inference API'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              🔑 Настройка API ключей
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Добавьте API ключи для активации AI агентов. Все ключи хранятся локально в браузере.
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {providers.map((provider) => (
              <div key={provider.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-800">{provider.name}</h3>
                    <p className="text-sm text-gray-600">{provider.description}</p>
                    <p className="text-xs text-green-600 mt-1">💰 {provider.freeInfo}</p>
                  </div>
                  <a
                    href={provider.getKeyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    Получить ключ →
                  </a>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type={showKeys[provider.id as keyof typeof showKeys] ? 'text' : 'password'}
                      placeholder={`Введите ${provider.name} API ключ`}
                      value={credentials[provider.id as keyof typeof credentials]}
                      onChange={(e) => handleCredentialChange(provider.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => toggleShowKey(provider.id)}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700"
                    title={showKeys[provider.id as keyof typeof showKeys] ? 'Скрыть' : 'Показать'}
                  >
                    {showKeys[provider.id as keyof typeof showKeys] ? '🙈' : '👁️'}
                  </button>
                  <div className="w-4 h-4">
                    {credentials[provider.id as keyof typeof credentials] && (
                      <span className="text-green-500" title="API ключ добавлен">✅</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">💡 Рекомендации по получению ключей:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Google AI</strong> - самый простой, полностью бесплатный</li>
              <li>• <strong>OpenAI</strong> - лучшее качество, $5 бесплатных кредитов</li>
              <li>• <strong>Hugging Face</strong> - бесплатный для open-source моделей</li>
              <li>• <strong>Cohere</strong> - хорош для текстовых задач</li>
              <li>• <strong>Anthropic</strong> - отличный для анализа кода</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">🔒 Безопасность:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Ключи хранятся только в вашем браузере (localStorage)</li>
              <li>• Ключи не передаются на сторонние серверы</li>
              <li>• Вы можете удалить ключи в любое время</li>
              <li>• Используйте ключи только с ограниченными правами</li>
            </ul>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => {
                localStorage.removeItem('ai_credentials');
                setCredentials({
                  openai: '',
                  google: '',
                  anthropic: '',
                  cohere: '',
                  huggingface: ''
                });
                onCredentialsChange({});
              }}
              className="px-4 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50"
            >
              🗑️ Очистить все ключи
            </button>
            
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Готово
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICredentialsSetup;
