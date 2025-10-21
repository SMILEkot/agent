import { spawn, exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { ProjectStructure } from './ProjectAnalyzer';

export interface RunResult {
  success: boolean;
  command: string;
  output: string;
  error?: string;
  exitCode?: number;
  duration: number;
  port?: number;
  url?: string;
}

export interface TestResult {
  success: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  coverage?: number;
  output: string;
  duration: number;
}

export class ProjectRunner {
  private runningProcesses: Map<string, any> = new Map();

  public async runProject(projectStructure: ProjectStructure): Promise<RunResult> {
    const startTime = Date.now();
    
    try {
      // Определяем команду запуска
      const runCommand = this.determineRunCommand(projectStructure);
      
      if (!runCommand) {
        return {
          success: false,
          command: 'unknown',
          output: '',
          error: 'Не удалось определить команду запуска для проекта',
          duration: Date.now() - startTime
        };
      }

      // Устанавливаем зависимости если нужно
      const installResult = await this.installDependencies(projectStructure);
      if (!installResult.success) {
        return {
          success: false,
          command: runCommand.command,
          output: installResult.output,
          error: `Ошибка установки зависимостей: ${installResult.error}`,
          duration: Date.now() - startTime
        };
      }

      // Запускаем проект
      const result = await this.executeCommand(
        projectStructure.rootPath,
        runCommand.command,
        runCommand.timeout || 30000
      );

      // Определяем порт и URL если проект запустился
      let port: number | undefined;
      let url: string | undefined;
      
      if (result.success) {
        port = this.extractPort(result.output);
        if (port) {
          url = `http://localhost:${port}`;
          
          // Проверяем доступность
          const isAccessible = await this.checkServerAccessibility(url);
          if (!isAccessible) {
            result.success = false;
            result.error = `Сервер запустился, но недоступен по адресу ${url}`;
          }
        }
      }

      return {
        ...result,
        command: runCommand.command,
        duration: Date.now() - startTime,
        port,
        url
      };

    } catch (error) {
      return {
        success: false,
        command: 'unknown',
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  public async testProject(projectStructure: ProjectStructure): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Определяем команду тестирования
      const testCommand = this.determineTestCommand(projectStructure);
      
      if (!testCommand) {
        return {
          success: false,
          totalTests: 0,
          passedTests: 0,
          failedTests: 0,
          output: 'Тесты не найдены или не настроены',
          duration: Date.now() - startTime
        };
      }

      // Запускаем тесты
      const result = await this.executeCommand(
        projectStructure.rootPath,
        testCommand,
        60000 // 1 минута на тесты
      );

      // Парсим результаты тестов
      const testStats = this.parseTestResults(result.output);

      return {
        success: result.success && testStats.failedTests === 0,
        totalTests: testStats.totalTests,
        passedTests: testStats.passedTests,
        failedTests: testStats.failedTests,
        coverage: testStats.coverage,
        output: result.output,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        output: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  public async buildProject(projectStructure: ProjectStructure): Promise<RunResult> {
    const startTime = Date.now();
    
    try {
      // Определяем команду сборки
      const buildCommand = this.determineBuildCommand(projectStructure);
      
      if (!buildCommand) {
        return {
          success: false,
          command: 'unknown',
          output: '',
          error: 'Команда сборки не найдена',
          duration: Date.now() - startTime
        };
      }

      // Запускаем сборку
      const result = await this.executeCommand(
        projectStructure.rootPath,
        buildCommand,
        120000 // 2 минуты на сборку
      );

      return {
        ...result,
        command: buildCommand,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        command: 'unknown',
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  private determineRunCommand(projectStructure: ProjectStructure): { command: string; timeout?: number } | null {
    const { scripts, projectType, packageManager } = projectStructure;
    
    // Проверяем npm scripts
    if (scripts.dev) {
      return { command: `${packageManager} run dev`, timeout: 30000 };
    }
    
    if (scripts.start) {
      return { command: `${packageManager} start`, timeout: 30000 };
    }
    
    if (scripts.serve) {
      return { command: `${packageManager} run serve`, timeout: 30000 };
    }

    // Определяем по типу проекта
    switch (projectType) {
      case 'react':
        if (scripts['react-scripts']) {
          return { command: `${packageManager} start`, timeout: 45000 };
        }
        break;
        
      case 'vue':
        return { command: `${packageManager} run serve`, timeout: 30000 };
        
      case 'angular':
        return { command: 'ng serve', timeout: 45000 };
        
      case 'node':
        // Ищем главный файл
        const mainFiles = ['index.js', 'server.js', 'app.js', 'main.js'];
        for (const mainFile of mainFiles) {
          if (projectStructure.files.some(f => f.name === mainFile)) {
            return { command: `node ${mainFile}`, timeout: 10000 };
          }
        }
        break;
        
      case 'static':
        // Для статических сайтов используем простой HTTP сервер
        return { command: 'npx http-server -p 8080', timeout: 5000 };
    }
    
    return null;
  }

  private determineTestCommand(projectStructure: ProjectStructure): string | null {
    const { scripts, projectType, packageManager } = projectStructure;
    
    // Проверяем npm scripts
    if (scripts.test && scripts.test !== 'echo "Error: no test specified" && exit 1') {
      return `${packageManager} test`;
    }
    
    if (scripts['test:unit']) {
      return `${packageManager} run test:unit`;
    }
    
    // Определяем по наличию тестовых файлов и фреймворков
    const hasJestConfig = projectStructure.files.some(f => 
      f.name.includes('jest.config') || f.name === 'jest.json'
    );
    
    const hasCypressConfig = projectStructure.files.some(f => 
      f.name.includes('cypress.config')
    );
    
    const hasTestFiles = projectStructure.testFiles.length > 0;
    
    if (hasJestConfig || (hasTestFiles && projectType === 'react')) {
      return `${packageManager} test -- --watchAll=false`;
    }
    
    if (hasCypressConfig) {
      return `${packageManager} run cypress:run`;
    }
    
    return null;
  }

  private determineBuildCommand(projectStructure: ProjectStructure): string | null {
    const { scripts, projectType, packageManager } = projectStructure;
    
    // Проверяем npm scripts
    if (scripts.build) {
      return `${packageManager} run build`;
    }
    
    // Определяем по типу проекта
    switch (projectType) {
      case 'react':
        return `${packageManager} run build`;
        
      case 'vue':
        return `${packageManager} run build`;
        
      case 'angular':
        return 'ng build';
        
      case 'node':
        // Для Node.js проектов сборка может не требоваться
        if (projectStructure.files.some(f => f.extension === '.ts')) {
          return 'tsc'; // TypeScript compilation
        }
        return null;
    }
    
    return null;
  }

  private async installDependencies(projectStructure: ProjectStructure): Promise<RunResult> {
    const startTime = Date.now();
    const { packageManager, rootPath } = projectStructure;
    
    // Проверяем, нужна ли установка
    const nodeModulesExists = fs.existsSync(path.join(rootPath, 'node_modules'));
    const packageJsonExists = projectStructure.files.some(f => f.name === 'package.json');
    
    if (!packageJsonExists) {
      return {
        success: true,
        command: 'skip',
        output: 'package.json не найден, пропускаем установку зависимостей',
        duration: Date.now() - startTime
      };
    }
    
    if (nodeModulesExists) {
      return {
        success: true,
        command: 'skip',
        output: 'node_modules уже существует, пропускаем установку',
        duration: Date.now() - startTime
      };
    }
    
    // Устанавливаем зависимости
    const installCommand = packageManager === 'yarn' ? 'yarn install' : 
                          packageManager === 'pnpm' ? 'pnpm install' : 
                          'npm install';
    
    const result = await this.executeCommand(rootPath, installCommand, 120000); // 2 минуты
    
    return {
      ...result,
      command: installCommand,
      duration: Date.now() - startTime
    };
  }

  private async executeCommand(cwd: string, command: string, timeout: number): Promise<RunResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let output = '';
      let error = '';
      
      const child = exec(command, { cwd, timeout }, (err, stdout, stderr) => {
        const duration = Date.now() - startTime;
        
        if (err) {
          resolve({
            success: false,
            command,
            output: stdout || output,
            error: err.message || stderr || error,
            exitCode: err.code,
            duration
          });
        } else {
          resolve({
            success: true,
            command,
            output: stdout || output,
            duration
          });
        }
      });
      
      if (child.stdout) {
        child.stdout.on('data', (data) => {
          output += data.toString();
        });
      }
      
      if (child.stderr) {
        child.stderr.on('data', (data) => {
          error += data.toString();
        });
      }
      
      // Сохраняем процесс для возможной остановки
      this.runningProcesses.set(command, child);
      
      child.on('exit', () => {
        this.runningProcesses.delete(command);
      });
    });
  }

  private extractPort(output: string): number | undefined {
    // Ищем порт в выводе
    const portPatterns = [
      /localhost:(\d+)/,
      /port\s+(\d+)/i,
      /running\s+on\s+.*:(\d+)/i,
      /server\s+started\s+on\s+.*:(\d+)/i,
      /listening\s+on\s+.*:(\d+)/i
    ];
    
    for (const pattern of portPatterns) {
      const match = output.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    
    // Стандартные порты для разных типов проектов
    if (output.includes('react-scripts')) return 3000;
    if (output.includes('vue-cli')) return 8080;
    if (output.includes('angular')) return 4200;
    if (output.includes('next')) return 3000;
    
    return undefined;
  }

  private async checkServerAccessibility(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 5000);
      
      // Простая проверка доступности через fetch или http
      const checkUrl = async () => {
        try {
          const response = await fetch(url);
          clearTimeout(timeout);
          resolve(response.ok);
        } catch (error) {
          clearTimeout(timeout);
          resolve(false);
        }
      };
      
      // Ждем немного перед проверкой
      setTimeout(checkUrl, 2000);
    });
  }

  private parseTestResults(output: string): {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    coverage?: number;
  } {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let coverage: number | undefined;
    
    // Jest output parsing
    const jestSummary = output.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
    if (jestSummary) {
      failedTests = parseInt(jestSummary[1], 10);
      passedTests = parseInt(jestSummary[2], 10);
      totalTests = parseInt(jestSummary[3], 10);
    } else {
      // Альтернативный формат Jest
      const jestAlt = output.match(/(\d+)\s+passing/);
      if (jestAlt) {
        passedTests = parseInt(jestAlt[1], 10);
        totalTests = passedTests;
      }
      
      const jestFailed = output.match(/(\d+)\s+failing/);
      if (jestFailed) {
        failedTests = parseInt(jestFailed[1], 10);
        totalTests += failedTests;
      }
    }
    
    // Coverage parsing
    const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)/);
    if (coverageMatch) {
      coverage = parseFloat(coverageMatch[1]);
    }
    
    return { totalTests, passedTests, failedTests, coverage };
  }

  public async stopProject(command: string): Promise<boolean> {
    const process = this.runningProcesses.get(command);
    if (process) {
      try {
        process.kill('SIGTERM');
        this.runningProcesses.delete(command);
        return true;
      } catch (error) {
        console.error('Failed to stop process:', error);
        return false;
      }
    }
    return false;
  }

  public getRunningProcesses(): string[] {
    return Array.from(this.runningProcesses.keys());
  }

  public async checkProjectHealth(projectStructure: ProjectStructure): Promise<{
    canRun: boolean;
    canTest: boolean;
    canBuild: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Проверяем возможность запуска
    const runCommand = this.determineRunCommand(projectStructure);
    const canRun = !!runCommand;
    
    if (!canRun) {
      issues.push('Не найдена команда запуска проекта');
      recommendations.push('Добавьте скрипт "start" или "dev" в package.json');
    }
    
    // Проверяем возможность тестирования
    const testCommand = this.determineTestCommand(projectStructure);
    const canTest = !!testCommand;
    
    if (!canTest) {
      issues.push('Тесты не настроены');
      recommendations.push('Добавьте тестовый фреймворк (Jest, Cypress) и скрипт "test"');
    }
    
    // Проверяем возможность сборки
    const buildCommand = this.determineBuildCommand(projectStructure);
    const canBuild = !!buildCommand;
    
    if (!canBuild && projectStructure.projectType !== 'node') {
      issues.push('Не найдена команда сборки');
      recommendations.push('Добавьте скрипт "build" в package.json');
    }
    
    // Проверяем зависимости
    const hasPackageJson = projectStructure.files.some(f => f.name === 'package.json');
    if (!hasPackageJson) {
      issues.push('Отсутствует package.json');
      recommendations.push('Создайте package.json с помощью "npm init"');
    }
    
    const hasNodeModules = fs.existsSync(path.join(projectStructure.rootPath, 'node_modules'));
    if (hasPackageJson && !hasNodeModules) {
      issues.push('Зависимости не установлены');
      recommendations.push('Выполните "npm install" для установки зависимостей');
    }
    
    return {
      canRun,
      canTest,
      canBuild,
      issues,
      recommendations
    };
  }

  public generateRunSummary(runResult: RunResult, testResult?: TestResult): string {
    let summary = `🚀 Результат запуска проекта:
• Команда: ${runResult.command}
• Статус: ${runResult.success ? '✅ Успешно' : '❌ Ошибка'}
• Время: ${(runResult.duration / 1000).toFixed(1)}с`;

    if (runResult.url) {
      summary += `\n• URL: ${runResult.url}`;
    }

    if (runResult.error) {
      summary += `\n• Ошибка: ${runResult.error}`;
    }

    if (testResult) {
      summary += `\n\n🧪 Результат тестирования:
• Всего тестов: ${testResult.totalTests}
• Прошло: ${testResult.passedTests}
• Провалилось: ${testResult.failedTests}
• Статус: ${testResult.success ? '✅ Все тесты прошли' : '❌ Есть проваленные тесты'}`;

      if (testResult.coverage) {
        summary += `\n• Покрытие: ${testResult.coverage}%`;
      }
    }

    return summary;
  }
}

export const projectRunner = new ProjectRunner();
