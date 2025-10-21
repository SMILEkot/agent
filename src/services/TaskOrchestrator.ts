import { projectAnalyzer, ProjectStructure } from './ProjectAnalyzer';
import { fileEditorEngine, FileEdit, EditResult } from './FileEditorEngine';
import { errorChecker, ErrorCheckResult } from './ErrorChecker';
import { projectRunner, RunResult, TestResult } from './ProjectRunner';
import { aiProviderManager } from './AIProviderManager';
import { AIRequest, AIResponse } from '../types/ai-agents';

export interface AutomationTask {
  id: string;
  type: 'analyze' | 'edit' | 'check' | 'fix' | 'test' | 'run' | 'full_automation';
  description: string;
  projectPath: string;
  userMessage: string;
  selectedAgent: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  steps: TaskStep[];
  results: TaskResults;
}

export interface TaskStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  output?: string;
  error?: string;
}

export interface TaskResults {
  projectStructure?: ProjectStructure;
  aiResponse?: AIResponse;
  edits?: FileEdit[];
  editResults?: EditResult[];
  errorReport?: ErrorCheckResult;
  runResult?: RunResult;
  testResult?: TestResult;
  summary?: string;
}

export class TaskOrchestrator {
  private activeTasks: Map<string, AutomationTask> = new Map();
  private taskHistory: AutomationTask[] = [];

  public async executeFullAutomation(
    projectPath: string,
    userMessage: string,
    selectedAgent: string
  ): Promise<AutomationTask> {
    const taskId = this.generateTaskId();
    
    const task: AutomationTask = {
      id: taskId,
      type: 'full_automation',
      description: `Полная автоматизация: ${userMessage}`,
      projectPath,
      userMessage,
      selectedAgent,
      status: 'pending',
      progress: 0,
      steps: this.createFullAutomationSteps(),
      results: {}
    };

    this.activeTasks.set(taskId, task);
    
    // Запускаем выполнение асинхронно
    this.executeTaskSteps(task).catch(error => {
      console.error('Task execution failed:', error);
      task.status = 'failed';
      task.steps.forEach(step => {
        if (step.status === 'running') {
          step.status = 'failed';
          step.error = error.message;
        }
      });
    });

    return task;
  }

  private createFullAutomationSteps(): TaskStep[] {
    return [
      {
        id: 'analyze',
        name: '🔍 Анализ проекта',
        description: 'Сканирование структуры проекта и определение типа',
        status: 'pending',
        progress: 0
      },
      {
        id: 'ai_planning',
        name: '🤖 AI планирование',
        description: 'Анализ задачи и создание плана действий',
        status: 'pending',
        progress: 0
      },
      {
        id: 'generate_edits',
        name: '✏️ Генерация изменений',
        description: 'Создание плана редактирования файлов',
        status: 'pending',
        progress: 0
      },
      {
        id: 'apply_edits',
        name: '💾 Применение изменений',
        description: 'Редактирование файлов проекта',
        status: 'pending',
        progress: 0
      },
      {
        id: 'check_errors',
        name: '🔍 Проверка ошибок',
        description: 'Анализ кода на наличие ошибок',
        status: 'pending',
        progress: 0
      },
      {
        id: 'fix_errors',
        name: '🛠️ Исправление ошибок',
        description: 'Автоматическое исправление найденных проблем',
        status: 'pending',
        progress: 0
      },
      {
        id: 'test_project',
        name: '🧪 Тестирование',
        description: 'Запуск тестов проекта',
        status: 'pending',
        progress: 0
      },
      {
        id: 'run_project',
        name: '🚀 Запуск проекта',
        description: 'Проверка работоспособности проекта',
        status: 'pending',
        progress: 0
      },
      {
        id: 'finalize',
        name: '✅ Завершение',
        description: 'Создание отчета и финализация',
        status: 'pending',
        progress: 0
      }
    ];
  }

  private async executeTaskSteps(task: AutomationTask): Promise<void> {
    task.status = 'running';
    task.startTime = new Date();

    try {
      for (let i = 0; i < task.steps.length; i++) {
        const step = task.steps[i];
        
        // Обновляем общий прогресс
        task.progress = Math.round((i / task.steps.length) * 100);
        
        await this.executeStep(task, step);
        
        // Если шаг провалился, останавливаем выполнение
        if (step.status === 'failed') {
          task.status = 'failed';
          return;
        }
      }

      task.status = 'completed';
      task.progress = 100;
      task.endTime = new Date();
      
      // Генерируем итоговый отчет
      task.results.summary = this.generateTaskSummary(task);

    } catch (error) {
      task.status = 'failed';
      task.endTime = new Date();
      console.error('Task execution error:', error);
    } finally {
      // Перемещаем задачу в историю
      this.activeTasks.delete(task.id);
      this.taskHistory.push(task);
      
      // Ограничиваем историю
      if (this.taskHistory.length > 50) {
        this.taskHistory = this.taskHistory.slice(-50);
      }
    }
  }

  private async executeStep(task: AutomationTask, step: TaskStep): Promise<void> {
    step.status = 'running';
    step.startTime = new Date();
    step.progress = 0;

    try {
      switch (step.id) {
        case 'analyze':
          await this.executeAnalyzeStep(task, step);
          break;
        case 'ai_planning':
          await this.executeAIPlanningStep(task, step);
          break;
        case 'generate_edits':
          await this.executeGenerateEditsStep(task, step);
          break;
        case 'apply_edits':
          await this.executeApplyEditsStep(task, step);
          break;
        case 'check_errors':
          await this.executeCheckErrorsStep(task, step);
          break;
        case 'fix_errors':
          await this.executeFixErrorsStep(task, step);
          break;
        case 'test_project':
          await this.executeTestProjectStep(task, step);
          break;
        case 'run_project':
          await this.executeRunProjectStep(task, step);
          break;
        case 'finalize':
          await this.executeFinalizeStep(task, step);
          break;
        default:
          throw new Error(`Unknown step: ${step.id}`);
      }

      step.status = 'completed';
      step.progress = 100;
      step.endTime = new Date();

    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Unknown error';
      step.endTime = new Date();
      throw error;
    }
  }

  private async executeAnalyzeStep(task: AutomationTask, step: TaskStep): Promise<void> {
    step.progress = 25;
    step.output = 'Сканирование файлов проекта...';
    
    const projectStructure = await projectAnalyzer.analyzeProject(task.projectPath);
    task.results.projectStructure = projectStructure;
    
    step.progress = 75;
    step.output = 'Анализ структуры проекта...';
    
    const summary = projectAnalyzer.generateProjectSummary(projectStructure);
    
    step.progress = 100;
    step.output = `Проект проанализирован:\n${summary}`;
  }

  private async executeAIPlanningStep(task: AutomationTask, step: TaskStep): Promise<void> {
    if (!task.results.projectStructure) {
      throw new Error('Project structure not available');
    }

    step.progress = 25;
    step.output = 'Отправка запроса AI агенту...';

    const aiRequest: AIRequest = {
      message: task.userMessage,
      selectedAgent: task.selectedAgent,
      context: {
        projectPath: task.projectPath,
        taskType: this.determineTaskType(task.userMessage)
      }
    };

    const aiResponse = await aiProviderManager.sendRequest(aiRequest);
    task.results.aiResponse = aiResponse;

    step.progress = 100;
    step.output = `AI план создан:\n${aiResponse.response}`;
  }

  private async executeGenerateEditsStep(task: AutomationTask, step: TaskStep): Promise<void> {
    if (!task.results.projectStructure) {
      throw new Error('Project structure not available');
    }

    step.progress = 25;
    step.output = 'Анализ требуемых изменений...';

    const edits = await fileEditorEngine.generateCodeEdit(
      task.results.projectStructure,
      task.userMessage,
      [] // Пока без конкретных файлов
    );

    task.results.edits = edits;

    step.progress = 100;
    step.output = `Сгенерировано ${edits.length} изменений файлов`;
  }

  private async executeApplyEditsStep(task: AutomationTask, step: TaskStep): Promise<void> {
    if (!task.results.edits || task.results.edits.length === 0) {
      step.status = 'skipped';
      step.output = 'Нет изменений для применения';
      return;
    }

    step.progress = 25;
    step.output = 'Применение изменений к файлам...';

    const editResults = await fileEditorEngine.executeEdits(
      task.projectPath,
      task.results.edits
    );

    task.results.editResults = editResults;

    const successCount = editResults.filter(r => r.success).length;
    const failCount = editResults.filter(r => !r.success).length;

    step.progress = 100;
    step.output = `Изменения применены: ${successCount} успешно, ${failCount} с ошибками`;

    if (failCount > 0) {
      const errors = editResults.filter(r => !r.success).map(r => r.error).join(', ');
      step.output += `\nОшибки: ${errors}`;
    }
  }

  private async executeCheckErrorsStep(task: AutomationTask, step: TaskStep): Promise<void> {
    if (!task.results.projectStructure) {
      throw new Error('Project structure not available');
    }

    step.progress = 25;
    step.output = 'Проверка кода на ошибки...';

    // Обновляем структуру проекта после изменений
    const updatedStructure = await projectAnalyzer.analyzeProject(task.projectPath);
    task.results.projectStructure = updatedStructure;

    step.progress = 50;
    step.output = 'Анализ ошибок и предупреждений...';

    const errorReport = await errorChecker.checkProject(updatedStructure);
    task.results.errorReport = errorReport;

    step.progress = 100;
    const summary = errorChecker.generateErrorSummary(errorReport);
    step.output = `Проверка завершена:\n${summary}`;
  }

  private async executeFixErrorsStep(task: AutomationTask, step: TaskStep): Promise<void> {
    if (!task.results.errorReport || !task.results.projectStructure) {
      step.status = 'skipped';
      step.output = 'Нет ошибок для исправления';
      return;
    }

    const { errorReport, projectStructure } = task.results;

    if (errorReport.fixableErrors.length === 0) {
      step.status = 'skipped';
      step.output = 'Нет автоматически исправимых ошибок';
      return;
    }

    step.progress = 25;
    step.output = 'Генерация исправлений...';

    const fixes = await errorChecker.generateErrorFixes(projectStructure, errorReport);

    step.progress = 50;
    step.output = 'Применение исправлений...';

    const fixResults = await fileEditorEngine.executeEdits(task.projectPath, fixes);

    const successCount = fixResults.filter(r => r.success).length;
    const failCount = fixResults.filter(r => !r.success).length;

    step.progress = 100;
    step.output = `Исправления применены: ${successCount} успешно, ${failCount} с ошибками`;
  }

  private async executeTestProjectStep(task: AutomationTask, step: TaskStep): Promise<void> {
    if (!task.results.projectStructure) {
      throw new Error('Project structure not available');
    }

    step.progress = 25;
    step.output = 'Проверка наличия тестов...';

    const testResult = await projectRunner.testProject(task.results.projectStructure);
    task.results.testResult = testResult;

    step.progress = 100;
    
    if (testResult.totalTests === 0) {
      step.output = 'Тесты не найдены или не настроены';
    } else {
      const summary = projectRunner.generateRunSummary(
        { success: testResult.success, command: 'test', output: '', duration: testResult.duration },
        testResult
      );
      step.output = summary;
    }
  }

  private async executeRunProjectStep(task: AutomationTask, step: TaskStep): Promise<void> {
    if (!task.results.projectStructure) {
      throw new Error('Project structure not available');
    }

    step.progress = 25;
    step.output = 'Запуск проекта...';

    const runResult = await projectRunner.runProject(task.results.projectStructure);
    task.results.runResult = runResult;

    step.progress = 100;
    
    const summary = projectRunner.generateRunSummary(runResult, task.results.testResult);
    step.output = summary;
  }

  private async executeFinalizeStep(task: AutomationTask, step: TaskStep): Promise<void> {
    step.progress = 50;
    step.output = 'Создание итогового отчета...';

    const summary = this.generateTaskSummary(task);
    task.results.summary = summary;

    step.progress = 100;
    step.output = 'Автоматизация завершена успешно!';
  }

  private determineTaskType(message: string): 'code' | 'design' | 'debug' | 'analyze' | 'test' {
    const lower = message.toLowerCase();
    
    if (lower.includes('дизайн') || lower.includes('стиль') || lower.includes('css')) {
      return 'design';
    }
    
    if (lower.includes('ошибк') || lower.includes('баг') || lower.includes('исправ')) {
      return 'debug';
    }
    
    if (lower.includes('тест') || lower.includes('проверь')) {
      return 'test';
    }
    
    if (lower.includes('анализ') || lower.includes('посмотри') || lower.includes('изучи')) {
      return 'analyze';
    }
    
    return 'code';
  }

  private generateTaskSummary(task: AutomationTask): string {
    const { results } = task;
    const duration = task.endTime && task.startTime ? 
      Math.round((task.endTime.getTime() - task.startTime.getTime()) / 1000) : 0;

    let summary = `🤖 Автоматизация завершена
📋 Задача: ${task.userMessage}
⏱️ Время выполнения: ${duration}с
🎯 Статус: ${task.status === 'completed' ? '✅ Успешно' : '❌ С ошибками'}

`;

    if (results.projectStructure) {
      summary += `📊 Анализ проекта:
• Тип: ${results.projectStructure.projectType} (${results.projectStructure.framework})
• Файлов: ${results.projectStructure.totalFiles}
• Компонентов: ${results.projectStructure.componentFiles.length}
• Стилей: ${results.projectStructure.styleFiles.length}

`;
    }

    if (results.editResults) {
      const successEdits = results.editResults.filter(r => r.success).length;
      const failedEdits = results.editResults.filter(r => !r.success).length;
      
      summary += `✏️ Редактирование файлов:
• Успешно: ${successEdits}
• С ошибками: ${failedEdits}

`;
    }

    if (results.errorReport) {
      summary += `🔍 Проверка ошибок:
• Ошибок: ${results.errorReport.totalErrors}
• Предупреждений: ${results.errorReport.totalWarnings}
• Исправлено автоматически: ${results.errorReport.fixableErrors.length}

`;
    }

    if (results.testResult) {
      summary += `🧪 Тестирование:
• Всего тестов: ${results.testResult.totalTests}
• Прошло: ${results.testResult.passedTests}
• Провалилось: ${results.testResult.failedTests}

`;
    }

    if (results.runResult) {
      summary += `🚀 Запуск проекта:
• Статус: ${results.runResult.success ? '✅ Успешно' : '❌ Ошибка'}
• Команда: ${results.runResult.command}`;
      
      if (results.runResult.url) {
        summary += `\n• URL: ${results.runResult.url}`;
      }
    }

    return summary;
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Публичные методы для управления задачами
  public getActiveTask(taskId: string): AutomationTask | undefined {
    return this.activeTasks.get(taskId);
  }

  public getAllActiveTasks(): AutomationTask[] {
    return Array.from(this.activeTasks.values());
  }

  public getTaskHistory(): AutomationTask[] {
    return [...this.taskHistory];
  }

  public async cancelTask(taskId: string): Promise<boolean> {
    const task = this.activeTasks.get(taskId);
    if (task) {
      task.status = 'cancelled';
      task.endTime = new Date();
      
      // Отменяем все pending шаги
      task.steps.forEach(step => {
        if (step.status === 'pending' || step.status === 'running') {
          step.status = 'cancelled';
        }
      });
      
      this.activeTasks.delete(taskId);
      this.taskHistory.push(task);
      
      return true;
    }
    return false;
  }

  public getTaskProgress(taskId: string): {
    progress: number;
    currentStep?: string;
    status: string;
  } | null {
    const task = this.activeTasks.get(taskId);
    if (!task) return null;

    const currentStep = task.steps.find(s => s.status === 'running');
    
    return {
      progress: task.progress,
      currentStep: currentStep?.name,
      status: task.status
    };
  }
}

export const taskOrchestrator = new TaskOrchestrator();
