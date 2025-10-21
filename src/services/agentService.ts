import { aiService } from './aiService';
import { terminalService, CommandResult } from './terminalService';

export interface AgentTask {
  id: string;
  description: string;
  steps: string[];
  currentStep: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: CommandResult[];
  createdAt: Date;
  completedAt?: Date;
}

export interface AgentResponse {
  success: boolean;
  message: string;
  commands?: string[];
  task?: AgentTask;
}

class AgentService {
  private tasks: Map<string, AgentTask> = new Map();

  // Определение платформы для веб-версии
  private getPlatform(): string {
    const isWindows = navigator.userAgent.includes('Windows');
    const isMac = navigator.userAgent.includes('Mac');
    const isLinux = navigator.userAgent.includes('Linux');
    
    if (isWindows) return 'win32';
    if (isMac) return 'darwin';
    if (isLinux) return 'linux';
    return 'unknown';
  }

  // Обработка запроса на естественном языке
  async processNaturalLanguageCommand(
    sessionId: string, 
    userInput: string
  ): Promise<AgentResponse> {
    try {
      // Создаем новую задачу
      const taskId = `task-${Date.now()}`;
      const task: AgentTask = {
        id: taskId,
        description: userInput,
        steps: [],
        currentStep: 0,
        status: 'pending',
        results: [],
        createdAt: new Date()
      };

      this.tasks.set(taskId, task);

      // Анализируем запрос и создаем план выполнения
      const plan = await this.createExecutionPlan(userInput);
      
      if (!plan.success) {
        task.status = 'failed';
        return plan;
      }

      task.steps = plan.commands || [];
      task.status = 'running';

      // Выполняем команды пошагово
      const results = await this.executeTaskSteps(sessionId, task);
      
      task.status = results.success ? 'completed' : 'failed';
      task.completedAt = new Date();

      return {
        success: results.success,
        message: results.message,
        task
      };

    } catch (error) {
      return {
        success: false,
        message: `Ошибка обработки запроса: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      };
    }
  }

  // Создание плана выполнения
  private async createExecutionPlan(userInput: string): Promise<AgentResponse> {
    const systemPrompt = `Ты - AI ассистент для терминала. Твоя задача - разбить пользовательский запрос на последовательность команд терминала.

Правила:
1. Разбей задачу на простые шаги
2. Каждый шаг должен быть выполним одной командой
3. Учитывай платформу: ${this.getPlatform()}
4. Предлагай безопасные команды
5. Объясняй что делает каждая команда

Отвечай в формате JSON:
{
  "success": true,
  "message": "Описание плана",
  "commands": ["команда1", "команда2", ...]
}

Если задача невыполнима или опасна, верни:
{
  "success": false,
  "message": "Причина отказа"
}`;

    const userPrompt = `Пользователь просит: "${userInput}"

Создай план выполнения этой задачи.`;

    try {
      const response = await aiService.generateResponse(systemPrompt, userPrompt);
      
      // Пытаемся распарсить JSON ответ
      try {
        const parsed = JSON.parse(response);
        return parsed;
      } catch {
        // Если не JSON, создаем простой план
        return {
          success: true,
          message: `План выполнения: ${response}`,
          commands: [userInput] // Используем исходный запрос как команду
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Не удалось создать план: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      };
    }
  }

  // Выполнение шагов задачи
  private async executeTaskSteps(sessionId: string, task: AgentTask): Promise<AgentResponse> {
    const results: CommandResult[] = [];
    let allSuccessful = true;

    for (let i = 0; i < task.steps.length; i++) {
      task.currentStep = i;
      const step = task.steps[i];

      try {
        // Получаем команду для выполнения шага
        const command = await this.getCommandForStep(step);
        
        if (command === 'NO_COMMAND') {
          // Шаг не требует выполнения команды
          results.push({
            output: `Шаг выполнен: ${step}`,
            exitCode: 0
          });
          continue;
        }

        // Выполняем команду
        const result = await terminalService.executeCommand(sessionId, command);
        results.push(result);

        // Если команда завершилась с ошибкой, пытаемся исправить
        if (result.exitCode !== 0) {
          const fixedCommand = await this.fixCommand(command, result.output);
          
          if (fixedCommand) {
            const fixedResult = await terminalService.executeCommand(sessionId, fixedCommand);
            results.push(fixedResult);
            
            if (fixedResult.exitCode !== 0) {
              allSuccessful = false;
            }
          } else {
            allSuccessful = false;
          }
        }

      } catch (error) {
        results.push({
          output: `Ошибка выполнения шага "${step}": ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
          exitCode: 1
        });
        allSuccessful = false;
      }
    }

    task.results = results;

    return {
      success: allSuccessful,
      message: allSuccessful 
        ? 'Все шаги выполнены успешно' 
        : 'Некоторые шаги завершились с ошибками'
    };
  }

  // Получение команды для выполнения шага
  private async getCommandForStep(step: string): Promise<string> {
    const systemPrompt = `Ты - эксперт по командам терминала. Твоя задача - преобразовать описание шага в конкретную команду терминала.

Правила:
1. Отвечай ТОЛЬКО командой, без объяснений
2. Если шаг не требует команды, отвечай "NO_COMMAND"
3. Используй безопасные команды
4. Учитывай платформу: ${this.getPlatform()}

Примеры:
Шаг: "Показать содержимое папки" → ls -la (или dir для Windows)
Шаг: "Проверить версию Node.js" → node --version
Шаг: "Создать папку test" → mkdir test
Шаг: "Объяснить результат" → NO_COMMAND`;

    const userPrompt = `Шаг: "${step}"`;

    try {
      const response = await aiService.generateResponse(systemPrompt, userPrompt);
      return response.trim();
    } catch (error) {
      // Fallback - возвращаем исходный шаг как команду
      return step;
    }
  }

  // Исправление команды при ошибке
  private async fixCommand(originalCommand: string, errorOutput: string): Promise<string | null> {
    const systemPrompt = `Ты - эксперт по исправлению ошибок командной строки для платформы ${this.getPlatform()}.

Твоя задача - исправить команду, которая завершилась с ошибкой.

Правила:
1. Анализируй ошибку и предлагай исправление
2. Отвечай ТОЛЬКО исправленной командой
3. Если исправить нельзя, отвечай "CANNOT_FIX"
4. Используй только безопасные команды

Примеры:
Команда: "ls -xyz" Ошибка: "invalid option" → ls -la
Команда: "node -xyz" Ошибка: "bad option" → node --version
Команда: "rm -rf /" Ошибка: любая → CANNOT_FIX`;

    const userPrompt = `Команда: "${originalCommand}"
Ошибка: "${errorOutput}"

Как исправить?`;

    try {
      const response = await aiService.generateResponse(systemPrompt, userPrompt);
      const fixed = response.trim();
      
      return fixed === 'CANNOT_FIX' ? null : fixed;
    } catch (error) {
      return null;
    }
  }

  // Получение задачи по ID
  getTask(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId);
  }

  // Получение всех задач
  getAllTasks(): AgentTask[] {
    return Array.from(this.tasks.values());
  }

  // Очистка завершенных задач
  clearCompletedTasks(): void {
    for (const [id, task] of this.tasks.entries()) {
      if (task.status === 'completed' || task.status === 'failed') {
        this.tasks.delete(id);
      }
    }
  }
}

export const agentService = new AgentService();

