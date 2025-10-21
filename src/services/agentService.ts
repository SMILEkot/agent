import { aiService } from './aiService';
import { terminalService, CommandResult } from './terminalService';
import { platform } from 'os';

export interface AgentTask {
  id: string;
  query: string;
  steps: AgentStep[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  error?: string;
}

export interface AgentStep {
  id: string;
  description: string;
  command?: string;
  output?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  timestamp: Date;
}

class AgentService {
  private tasks: Map<string, AgentTask> = new Map();

  // Выполнение задачи в Agent Mode
  async executeTask(sessionId: string, query: string): Promise<string> {
    const taskId = `task-${Date.now()}`;
    
    const task: AgentTask = {
      id: taskId,
      query,
      steps: [],
      status: 'pending'
    };

    this.tasks.set(taskId, task);

    try {
      task.status = 'running';
      
      // Анализируем запрос и определяем план действий
      const plan = await this.analyzePlan(query);
      
      // Выполняем план пошагово
      const result = await this.executePlan(sessionId, task, plan);
      
      task.status = 'completed';
      task.result = result;
      
      return result;
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  // Анализ запроса и создание плана
  private async analyzePlan(query: string): Promise<string[]> {
    const systemPrompt = `Ты - AI агент терминала, который помогает пользователям выполнять задачи через командную строку.

Твоя задача - проанализировать запрос пользователя и создать пошаговый план выполнения.

Правила:
1. Разбей задачу на простые шаги
2. Каждый шаг должен быть выполним одной командой
3. Учитывай платформу: ${platform()}
4. Предлагай безопасные команды
5. Объясняй что делает каждая команда

Формат ответа - список шагов, каждый с новой строки, начинающийся с "STEP:".

Пример:
STEP: Проверить текущую директорию
STEP: Создать новую папку
STEP: Перейти в созданную папку

Запрос пользователя: ${query}`;

    try {
      const response = await aiService.sendMessage([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ]);

      // Извлекаем шаги из ответа
      const steps = response.split('\n')
        .filter(line => line.startsWith('STEP:'))
        .map(line => line.replace('STEP:', '').trim());

      return steps.length > 0 ? steps : [query];
    } catch (error) {
      console.error('Error analyzing plan:', error);
      // Fallback - возвращаем исходный запрос как единственный шаг
      return [query];
    }
  }

  // Выполнение плана
  private async executePlan(sessionId: string, task: AgentTask, plan: string[]): Promise<string> {
    let finalResult = '';
    
    for (let i = 0; i < plan.length; i++) {
      const stepDescription = plan[i];
      const stepId = `step-${i}`;
      
      const step: AgentStep = {
        id: stepId,
        description: stepDescription,
        status: 'pending',
        timestamp: new Date()
      };
      
      task.steps.push(step);
      step.status = 'running';

      try {
        // Получаем команду для выполнения шага
        const command = await this.getCommandForStep(stepDescription);
        step.command = command;

        if (command) {
          // Выполняем команду
          const result = await terminalService.executeCommand(sessionId, command);
          step.output = result.output;
          
          if (result.exitCode === 0) {
            step.status = 'completed';
            finalResult += `✅ ${stepDescription}\n`;
            if (result.output) {
              finalResult += `${result.output}\n\n`;
            }
          } else {
            // Пытаемся исправить ошибку
            const fixedCommand = await this.fixCommand(command, result.output);
            if (fixedCommand && fixedCommand !== command) {
              const fixedResult = await terminalService.executeCommand(sessionId, fixedCommand);
              step.command = fixedCommand;
              step.output = fixedResult.output;
              
              if (fixedResult.exitCode === 0) {
                step.status = 'completed';
                finalResult += `✅ ${stepDescription} (исправлено)\n`;
                if (fixedResult.output) {
                  finalResult += `${fixedResult.output}\n\n`;
                }
              } else {
                step.status = 'failed';
                finalResult += `❌ ${stepDescription}: ${fixedResult.output}\n\n`;
              }
            } else {
              step.status = 'failed';
              finalResult += `❌ ${stepDescription}: ${result.output}\n\n`;
            }
          }
        } else {
          // Если команда не нужна, просто отмечаем как выполненное
          step.status = 'completed';
          finalResult += `ℹ️ ${stepDescription}\n\n`;
        }
      } catch (error) {
        step.status = 'failed';
        step.output = error instanceof Error ? error.message : String(error);
        finalResult += `❌ ${stepDescription}: ${step.output}\n\n`;
      }
    }

    return finalResult.trim();
  }

  // Получение команды для выполнения шага
  private async getCommandForStep(stepDescription: string): Promise<string | null> {
    const systemPrompt = `Ты - эксперт по командной строке для платформы ${platform()}.

Твоя задача - предложить ОДНУ команду для выполнения описанного шага.

Правила:
1. Отвечай ТОЛЬКО командой, без объяснений
2. Если шаг не требует команды, отвечай "NO_COMMAND"
3. Используй безопасные команды
4. Учитывай платформу: ${platform()}

Примеры:
Шаг: "Показать содержимое папки" → ls -la (или dir для Windows)
Шаг: "Создать папку test" → mkdir test
Шаг: "Проверить версию Node.js" → node --version

Шаг: ${stepDescription}`;

    try {
      const response = await aiService.sendMessage([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: stepDescription }
      ]);

      const command = response.trim();
      return command === 'NO_COMMAND' ? null : command;
    } catch (error) {
      console.error('Error getting command for step:', error);
      return null;
    }
  }

  // Исправление команды при ошибке
  private async fixCommand(originalCommand: string, errorOutput: string): Promise<string | null> {
    const systemPrompt = `Ты - эксперт по исправлению ошибок командной строки для платформы ${platform()}.

Твоя задача - исправить команду, которая завершилась с ошибкой.

Правила:
1. Проанализируй ошибку
2. Предложи исправленную команду
3. Если исправить нельзя, отвечай "CANNOT_FIX"
4. Отвечай ТОЛЬКО исправленной командой

Исходная команда: ${originalCommand}
Ошибка: ${errorOutput}`;

    try {
      const response = await aiService.sendMessage([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Исправь команду: ${originalCommand}\nОшибка: ${errorOutput}` }
      ]);

      const fixedCommand = response.trim();
      return fixedCommand === 'CANNOT_FIX' ? null : fixedCommand;
    } catch (error) {
      console.error('Error fixing command:', error);
      return null;
    }
  }

  // Получение задачи
  getTask(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId);
  }

  // Получение всех задач
  getAllTasks(): AgentTask[] {
    return Array.from(this.tasks.values());
  }

  // Очистка завершенных задач
  clearCompletedTasks() {
    for (const [id, task] of this.tasks.entries()) {
      if (task.status === 'completed' || task.status === 'failed') {
        this.tasks.delete(id);
      }
    }
  }

  // Отмена задачи
  cancelTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task && task.status === 'running') {
      task.status = 'failed';
      task.error = 'Cancelled by user';
    }
  }

  // Быстрые команды для типовых задач
  async getQuickCommand(description: string): Promise<string | null> {
    const quickCommands: Record<string, string> = {
      // Файловая система
      'показать файлы': platform() === 'win32' ? 'dir' : 'ls -la',
      'текущая папка': 'pwd',
      'создать папку': 'mkdir',
      'удалить файл': platform() === 'win32' ? 'del' : 'rm',
      
      // Система
      'процессы': platform() === 'win32' ? 'tasklist' : 'ps aux',
      'память': platform() === 'win32' ? 'systeminfo' : 'free -h',
      'диск': platform() === 'win32' ? 'dir' : 'df -h',
      
      // Разработка
      'версия node': 'node --version',
      'версия npm': 'npm --version',
      'git статус': 'git status',
      'установить пакет': 'npm install',
      
      // Сеть
      'пинг': 'ping google.com',
      'ip адрес': platform() === 'win32' ? 'ipconfig' : 'ifconfig',
      'порты': platform() === 'win32' ? 'netstat -an' : 'netstat -tulpn'
    };

    const lowerDesc = description.toLowerCase();
    
    for (const [key, command] of Object.entries(quickCommands)) {
      if (lowerDesc.includes(key)) {
        return command;
      }
    }

    return null;
  }
}

// Экспортируем синглтон
export const agentService = new AgentService();
export default agentService;
