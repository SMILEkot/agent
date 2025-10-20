// Конфигурация AI без необходимости настройки пользователем
export const AI_CONFIG = {
  // Используем бесплатный API или встроенный ключ
  provider: 'openai' as const,
  
  // Встроенный API ключ (в реальном приложении должен быть зашифрован)
  // Для демо используем ограниченный ключ или локальную модель
  apiKey: process.env.VITE_OPENAI_API_KEY || 'demo-key',
  
  // Настройки модели
  model: 'gpt-3.5-turbo',
  maxTokens: 2000,
  temperature: 0.7,
  
  // Системный промпт для AI агента
  systemPrompt: `Ты - AI помощник для разработчиков. Ты помогаешь с:

1. Управлением файлами и кодом
2. Анализом проектов
3. Написанием и редактированием кода
4. Настройкой серверов Ubuntu через SSH
5. Решением технических проблем

Отвечай кратко и по делу. Если нужно выполнить операцию с файлами или SSH, опиши что именно нужно сделать.

Доступные возможности:
- Чтение и запись файлов
- Просмотр структуры проекта
- SSH подключение к серверам
- Выполнение команд на удаленных серверах
- Установка ПО на Ubuntu (Node.js, Docker, Nginx)

Всегда предлагай конкретные решения и команды.`,

  // Fallback конфигурации
  fallbacks: [
    {
      provider: 'ollama' as const,
      baseUrl: 'http://localhost:11434',
      model: 'llama2',
    },
    {
      provider: 'local' as const,
      model: 'basic-assistant',
    }
  ]
};

// Проверка доступности AI сервисов
export async function checkAIAvailability(): Promise<{
  provider: string;
  available: boolean;
  model: string;
}> {
  // Проверяем OpenAI
  if (AI_CONFIG.apiKey && AI_CONFIG.apiKey !== 'demo-key') {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
        },
      });
      
      if (response.ok) {
        return {
          provider: 'openai',
          available: true,
          model: AI_CONFIG.model,
        };
      }
    } catch (error) {
      console.log('OpenAI недоступен, проверяем альтернативы...');
    }
  }

  // Проверяем Ollama
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (response.ok) {
      const data = await response.json();
      const models = data.models || [];
      if (models.length > 0) {
        return {
          provider: 'ollama',
          available: true,
          model: models[0].name,
        };
      }
    }
  } catch (error) {
    console.log('Ollama недоступен...');
  }

  // Используем базовый ассистент
  return {
    provider: 'local',
    available: true,
    model: 'basic-assistant',
  };
}
