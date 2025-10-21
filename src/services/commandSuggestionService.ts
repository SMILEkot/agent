import { aiService } from './aiService';
import { terminalService } from './terminalService';
import { platform } from 'os';

export interface CommandSuggestion {
  command: string;
  description: string;
  confidence: number;
  category: 'file' | 'system' | 'network' | 'development' | 'git' | 'other';
  examples?: string[];
  warning?: string;
}

export interface SuggestionContext {
  currentDirectory: string;
  recentCommands: string[];
  systemInfo: any;
}

class CommandSuggestionService {
  private suggestionCache: Map<string, CommandSuggestion[]> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 минут

  // Получение предложений команд по описанию
  async getSuggestions(
    sessionId: string, 
    description: string, 
    limit: number = 5
  ): Promise<CommandSuggestion[]> {
    const cacheKey = `${description.toLowerCase()}-${limit}`;
    
    // Проверяем кэш
    if (this.suggestionCache.has(cacheKey)) {
      return this.suggestionCache.get(cacheKey)!;
    }

    try {
      // Получаем контекст
      const context = await this.getContext(sessionId);
      
      // Получаем предложения от AI
      const aiSuggestions = await this.getAISuggestions(description, context, limit);
      
      // Добавляем быстрые предложения
      const quickSuggestions = this.getQuickSuggestions(description);
      
      // Объединяем и сортируем по релевантности
      const allSuggestions = [...aiSuggestions, ...quickSuggestions]
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, limit);

      // Кэшируем результат
      this.suggestionCache.set(cacheKey, allSuggestions);
      setTimeout(() => {
        this.suggestionCache.delete(cacheKey);
      }, this.cacheTimeout);

      return allSuggestions;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      // Возвращаем только быстрые предложения при ошибке
      return this.getQuickSuggestions(description).slice(0, limit);
    }
  }

  // Получение контекста для предложений
  private async getContext(sessionId: string): Promise<SuggestionContext> {
    const session = terminalService.getSession(sessionId);
    const systemInfo = await terminalService.getSystemInfo();
    const recentCommands = terminalService.getHistory(sessionId).slice(-10);

    return {
      currentDirectory: session?.cwd || process.cwd(),
      recentCommands,
      systemInfo
    };
  }

  // Получение предложений от AI
  private async getAISuggestions(
    description: string, 
    context: SuggestionContext, 
    limit: number
  ): Promise<CommandSuggestion[]> {
    const systemPrompt = `Ты - эксперт по командной строке для платформы ${platform()}.

Твоя задача - предложить команды для выполнения описанной задачи.

Контекст:
- Платформа: ${platform()}
- Текущая директория: ${context.currentDirectory}
- Последние команды: ${context.recentCommands.join(', ')}

Правила:
1. Предложи ${limit} наиболее подходящих команд
2. Отсортируй по релевантности (самые подходящие первыми)
3. Укажи категорию: file, system, network, development, git, other
4. Оцени уверенность от 0 до 100
5. Добавь предупреждения для опасных команд

Формат ответа (JSON):
[
  {
    "command": "команда",
    "description": "описание что делает",
    "confidence": 95,
    "category": "file",
    "examples": ["пример 1", "пример 2"],
    "warning": "предупреждение если нужно"
  }
]

Описание задачи: ${description}`;

    try {
      const response = await aiService.sendMessage([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: description }
      ]);

      // Пытаемся распарсить JSON ответ
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        return suggestions.map((s: any) => ({
          command: s.command || '',
          description: s.description || '',
          confidence: Math.min(100, Math.max(0, s.confidence || 50)),
          category: s.category || 'other',
          examples: s.examples || [],
          warning: s.warning
        }));
      }

      // Если JSON не найден, пытаемся извлечь команды из текста
      return this.parseTextSuggestions(response);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      return [];
    }
  }

  // Парсинг предложений из текста (fallback)
  private parseTextSuggestions(text: string): CommandSuggestion[] {
    const lines = text.split('\n').filter(line => line.trim());
    const suggestions: CommandSuggestion[] = [];

    for (const line of lines) {
      // Ищем строки с командами
      const commandMatch = line.match(/^[\d\.\-\*\s]*([a-zA-Z][^\s]*(?:\s+[^\s]+)*)/);
      if (commandMatch) {
        const command = commandMatch[1].trim();
        if (command && !command.includes('команда') && !command.includes('example')) {
          suggestions.push({
            command,
            description: `Выполнить: ${command}`,
            confidence: 70,
            category: this.categorizeCommand(command)
          });
        }
      }
    }

    return suggestions.slice(0, 3);
  }

  // Быстрые предложения без AI
  private getQuickSuggestions(description: string): CommandSuggestion[] {
    const desc = description.toLowerCase();
    const suggestions: CommandSuggestion[] = [];
    const isWindows = platform() === 'win32';

    // Файловые операции
    if (desc.includes('файл') || desc.includes('папк') || desc.includes('директор')) {
      if (desc.includes('показать') || desc.includes('список') || desc.includes('содержим')) {
        suggestions.push({
          command: isWindows ? 'dir' : 'ls -la',
          description: 'Показать содержимое текущей папки',
          confidence: 90,
          category: 'file'
        });
      }
      
      if (desc.includes('создать') || desc.includes('новый')) {
        if (desc.includes('папк') || desc.includes('директор')) {
          suggestions.push({
            command: 'mkdir новая_папка',
            description: 'Создать новую папку',
            confidence: 85,
            category: 'file'
          });
        } else {
          suggestions.push({
            command: isWindows ? 'echo. > новый_файл.txt' : 'touch новый_файл.txt',
            description: 'Создать новый файл',
            confidence: 85,
            category: 'file'
          });
        }
      }

      if (desc.includes('удалить') || desc.includes('удали')) {
        suggestions.push({
          command: isWindows ? 'del файл.txt' : 'rm файл.txt',
          description: 'Удалить файл',
          confidence: 80,
          category: 'file',
          warning: 'Будьте осторожны! Удаленные файлы восстановить сложно.'
        });
      }

      if (desc.includes('копир')) {
        suggestions.push({
          command: isWindows ? 'copy источник.txt назначение.txt' : 'cp источник.txt назначение.txt',
          description: 'Копировать файл',
          confidence: 80,
          category: 'file'
        });
      }
    }

    // Системная информация
    if (desc.includes('процесс') || desc.includes('запущен')) {
      suggestions.push({
        command: isWindows ? 'tasklist' : 'ps aux',
        description: 'Показать запущенные процессы',
        confidence: 90,
        category: 'system'
      });
    }

    if (desc.includes('память') || desc.includes('ram')) {
      suggestions.push({
        command: isWindows ? 'systeminfo | findstr "Memory"' : 'free -h',
        description: 'Показать информацию о памяти',
        confidence: 85,
        category: 'system'
      });
    }

    if (desc.includes('диск') || desc.includes('место') || desc.includes('свободн')) {
      suggestions.push({
        command: isWindows ? 'dir' : 'df -h',
        description: 'Показать использование дискового пространства',
        confidence: 85,
        category: 'system'
      });
    }

    // Сетевые команды
    if (desc.includes('пинг') || desc.includes('ping') || desc.includes('доступност')) {
      suggestions.push({
        command: 'ping google.com',
        description: 'Проверить доступность сервера',
        confidence: 90,
        category: 'network'
      });
    }

    if (desc.includes('ip') || desc.includes('адрес') || desc.includes('сеть')) {
      suggestions.push({
        command: isWindows ? 'ipconfig' : 'ifconfig',
        description: 'Показать сетевые настройки',
        confidence: 85,
        category: 'network'
      });
    }

    // Разработка
    if (desc.includes('node') || desc.includes('npm')) {
      if (desc.includes('версия')) {
        suggestions.push({
          command: 'node --version',
          description: 'Показать версию Node.js',
          confidence: 95,
          category: 'development'
        });
      }
      
      if (desc.includes('установ') || desc.includes('install')) {
        suggestions.push({
          command: 'npm install пакет',
          description: 'Установить npm пакет',
          confidence: 90,
          category: 'development'
        });
      }
    }

    // Git команды
    if (desc.includes('git')) {
      if (desc.includes('статус') || desc.includes('status')) {
        suggestions.push({
          command: 'git status',
          description: 'Показать статус git репозитория',
          confidence: 95,
          category: 'git'
        });
      }
      
      if (desc.includes('коммит') || desc.includes('commit')) {
        suggestions.push({
          command: 'git add . && git commit -m "сообщение"',
          description: 'Добавить все файлы и создать коммит',
          confidence: 85,
          category: 'git'
        });
      }
    }

    return suggestions;
  }

  // Категоризация команды
  private categorizeCommand(command: string): CommandSuggestion['category'] {
    const cmd = command.toLowerCase();
    
    if (cmd.match(/^(ls|dir|cd|mkdir|rmdir|rm|del|cp|copy|mv|move|cat|type|find|grep)(\s|$)/)) {
      return 'file';
    }
    
    if (cmd.match(/^(ps|tasklist|kill|taskkill|top|htop|systeminfo|free|df|du)(\s|$)/)) {
      return 'system';
    }
    
    if (cmd.match(/^(ping|curl|wget|ssh|scp|netstat|ifconfig|ipconfig)(\s|$)/)) {
      return 'network';
    }
    
    if (cmd.match(/^(node|npm|yarn|python|pip|java|mvn|gradle|docker)(\s|$)/)) {
      return 'development';
    }
    
    if (cmd.match(/^git(\s|$)/)) {
      return 'git';
    }
    
    return 'other';
  }

  // Объяснение ошибки
  async explainError(command: string, errorOutput: string): Promise<string> {
    const systemPrompt = `Ты - эксперт по командной строке для платформы ${platform()}.

Твоя задача - объяснить ошибку простым языком и предложить решение.

Правила:
1. Объясни что пошло не так
2. Предложи как исправить
3. Дай альтернативные варианты если есть
4. Используй простой русский язык

Команда: ${command}
Ошибка: ${errorOutput}`;

    try {
      const response = await aiService.sendMessage([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Объясни ошибку команды: ${command}\n\nВывод ошибки:\n${errorOutput}` }
      ]);

      return response;
    } catch (error) {
      console.error('Error explaining error:', error);
      return `Произошла ошибка при выполнении команды "${command}". Проверьте правильность написания команды и наличие необходимых прав доступа.`;
    }
  }

  // Очистка кэша
  clearCache() {
    this.suggestionCache.clear();
  }

  // Получение статистики использования
  getUsageStats(): { totalSuggestions: number; cacheSize: number } {
    return {
      totalSuggestions: Array.from(this.suggestionCache.values())
        .reduce((total, suggestions) => total + suggestions.length, 0),
      cacheSize: this.suggestionCache.size
    };
  }
}

// Экспортируем синглтон
export const commandSuggestionService = new CommandSuggestionService();
export default commandSuggestionService;
