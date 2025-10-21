import * as fs from 'fs';
import * as path from 'path';
import { ProjectStructure, ProjectFile } from './ProjectAnalyzer';
import { FileEdit } from './FileEditorEngine';

export interface ErrorReport {
  file: string;
  line?: number;
  column?: number;
  type: 'syntax' | 'type' | 'lint' | 'runtime' | 'security' | 'performance';
  severity: 'error' | 'warning' | 'info';
  message: string;
  rule?: string;
  fixable: boolean;
  suggestedFix?: string;
}

export interface ErrorCheckResult {
  totalErrors: number;
  totalWarnings: number;
  errorsByFile: Record<string, ErrorReport[]>;
  fixableErrors: ErrorReport[];
  criticalErrors: ErrorReport[];
}

export class ErrorChecker {
  private lintRules = {
    javascript: [
      { pattern: /console\.log\(/g, message: 'Remove console.log statements', severity: 'warning' as const, fixable: true },
      { pattern: /debugger;/g, message: 'Remove debugger statements', severity: 'error' as const, fixable: true },
      { pattern: /var\s+/g, message: 'Use let or const instead of var', severity: 'warning' as const, fixable: true },
      { pattern: /==\s*(?!null)/g, message: 'Use === instead of ==', severity: 'warning' as const, fixable: true },
      { pattern: /!=\s*(?!null)/g, message: 'Use !== instead of !=', severity: 'warning' as const, fixable: true },
    ],
    css: [
      { pattern: /!important/g, message: 'Avoid using !important', severity: 'warning' as const, fixable: false },
      { pattern: /#[0-9a-fA-F]{3,6}(?![0-9a-fA-F])/g, message: 'Consider using CSS variables for colors', severity: 'info' as const, fixable: false },
      { pattern: /font-size:\s*\d+px/g, message: 'Consider using rem or em instead of px for font-size', severity: 'info' as const, fixable: true },
    ],
    html: [
      { pattern: /<img(?![^>]*alt=)/g, message: 'Images should have alt attributes', severity: 'warning' as const, fixable: true },
      { pattern: /<a(?![^>]*href=)/g, message: 'Links should have href attributes', severity: 'error' as const, fixable: false },
    ]
  };

  public async checkProject(projectStructure: ProjectStructure): Promise<ErrorCheckResult> {
    const result: ErrorCheckResult = {
      totalErrors: 0,
      totalWarnings: 0,
      errorsByFile: {},
      fixableErrors: [],
      criticalErrors: []
    };

    // Проверяем каждый файл
    for (const file of projectStructure.files) {
      if (this.shouldCheckFile(file)) {
        const errors = await this.checkFile(projectStructure.rootPath, file);
        
        if (errors.length > 0) {
          result.errorsByFile[file.path] = errors;
          
          for (const error of errors) {
            if (error.severity === 'error') {
              result.totalErrors++;
              result.criticalErrors.push(error);
            } else if (error.severity === 'warning') {
              result.totalWarnings++;
            }
            
            if (error.fixable) {
              result.fixableErrors.push(error);
            }
          }
        }
      }
    }

    // Проверяем структуру проекта
    const structuralErrors = this.checkProjectStructure(projectStructure);
    if (structuralErrors.length > 0) {
      result.errorsByFile['_project_structure'] = structuralErrors;
      result.totalWarnings += structuralErrors.length;
    }

    return result;
  }

  private shouldCheckFile(file: ProjectFile): boolean {
    const checkableExtensions = ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.html', '.vue', '.json'];
    return checkableExtensions.includes(file.extension) && file.size < 1024 * 1024; // 1MB limit
  }

  private async checkFile(projectPath: string, file: ProjectFile): Promise<ErrorReport[]> {
    const errors: ErrorReport[] = [];
    
    try {
      const content = fs.readFileSync(path.join(projectPath, file.path), 'utf8');
      file.content = content;
      
      // Проверяем синтаксис
      errors.push(...this.checkSyntax(file));
      
      // Проверяем стиль кода
      errors.push(...this.checkCodeStyle(file));
      
      // Проверяем безопасность
      errors.push(...this.checkSecurity(file));
      
      // Проверяем производительность
      errors.push(...this.checkPerformance(file));
      
    } catch (error) {
      errors.push({
        file: file.path,
        type: 'syntax',
        severity: 'error',
        message: `Failed to read file: ${error}`,
        fixable: false
      });
    }
    
    return errors;
  }

  private checkSyntax(file: ProjectFile): ErrorReport[] {
    const errors: ErrorReport[] = [];
    const content = file.content || '';
    
    if (file.extension === '.json') {
      try {
        JSON.parse(content);
      } catch (error) {
        errors.push({
          file: file.path,
          type: 'syntax',
          severity: 'error',
          message: `Invalid JSON: ${error}`,
          fixable: false
        });
      }
    }
    
    // Проверяем парные скобки
    const brackets = { '(': ')', '[': ']', '{': '}' };
    const stack: string[] = [];
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      
      if (Object.keys(brackets).includes(char)) {
        stack.push(char);
      } else if (Object.values(brackets).includes(char)) {
        const lastOpen = stack.pop();
        if (!lastOpen || brackets[lastOpen as keyof typeof brackets] !== char) {
          const line = content.substring(0, i).split('\n').length;
          errors.push({
            file: file.path,
            line,
            type: 'syntax',
            severity: 'error',
            message: `Mismatched bracket: ${char}`,
            fixable: false
          });
        }
      }
    }
    
    if (stack.length > 0) {
      errors.push({
        file: file.path,
        type: 'syntax',
        severity: 'error',
        message: `Unclosed brackets: ${stack.join(', ')}`,
        fixable: false
      });
    }
    
    return errors;
  }

  private checkCodeStyle(file: ProjectFile): ErrorReport[] {
    const errors: ErrorReport[] = [];
    const content = file.content || '';
    
    // Определяем правила для типа файла
    let rules: typeof this.lintRules.javascript = [];
    
    if (['.js', '.jsx', '.ts', '.tsx'].includes(file.extension)) {
      rules = this.lintRules.javascript;
    } else if (['.css', '.scss'].includes(file.extension)) {
      rules = this.lintRules.css;
    } else if (file.extension === '.html') {
      rules = this.lintRules.html;
    }
    
    // Применяем правила
    for (const rule of rules) {
      const matches = Array.from(content.matchAll(rule.pattern));
      
      for (const match of matches) {
        const line = content.substring(0, match.index).split('\n').length;
        const column = match.index! - content.lastIndexOf('\n', match.index! - 1);
        
        errors.push({
          file: file.path,
          line,
          column,
          type: 'lint',
          severity: rule.severity,
          message: rule.message,
          fixable: rule.fixable,
          suggestedFix: this.generateFix(match[0], rule)
        });
      }
    }
    
    return errors;
  }

  private checkSecurity(file: ProjectFile): ErrorReport[] {
    const errors: ErrorReport[] = [];
    const content = file.content || '';
    
    // Проверяем на потенциальные уязвимости
    const securityPatterns = [
      {
        pattern: /eval\s*\(/g,
        message: 'Avoid using eval() - potential security risk',
        severity: 'error' as const
      },
      {
        pattern: /innerHTML\s*=/g,
        message: 'Using innerHTML can lead to XSS vulnerabilities',
        severity: 'warning' as const
      },
      {
        pattern: /document\.write\s*\(/g,
        message: 'Avoid using document.write()',
        severity: 'warning' as const
      },
      {
        pattern: /password\s*[:=]\s*["'][^"']*["']/gi,
        message: 'Hardcoded password detected',
        severity: 'error' as const
      },
      {
        pattern: /api[_-]?key\s*[:=]\s*["'][^"']*["']/gi,
        message: 'Hardcoded API key detected',
        severity: 'error' as const
      }
    ];
    
    for (const pattern of securityPatterns) {
      const matches = Array.from(content.matchAll(pattern.pattern));
      
      for (const match of matches) {
        const line = content.substring(0, match.index).split('\n').length;
        
        errors.push({
          file: file.path,
          line,
          type: 'security',
          severity: pattern.severity,
          message: pattern.message,
          fixable: false
        });
      }
    }
    
    return errors;
  }

  private checkPerformance(file: ProjectFile): ErrorReport[] {
    const errors: ErrorReport[] = [];
    const content = file.content || '';
    
    // Проверяем на проблемы производительности
    const performancePatterns = [
      {
        pattern: /for\s*\([^)]*\.length[^)]*\)/g,
        message: 'Cache array length in loops for better performance',
        severity: 'info' as const
      },
      {
        pattern: /document\.getElementById\s*\([^)]*\)/g,
        message: 'Consider caching DOM queries',
        severity: 'info' as const
      },
      {
        pattern: /setInterval\s*\(/g,
        message: 'Be careful with setInterval - can cause memory leaks',
        severity: 'warning' as const
      }
    ];
    
    for (const pattern of performancePatterns) {
      const matches = Array.from(content.matchAll(pattern.pattern));
      
      for (const match of matches) {
        const line = content.substring(0, match.index).split('\n').length;
        
        errors.push({
          file: file.path,
          line,
          type: 'performance',
          severity: pattern.severity,
          message: pattern.message,
          fixable: false
        });
      }
    }
    
    return errors;
  }

  private checkProjectStructure(projectStructure: ProjectStructure): ErrorReport[] {
    const errors: ErrorReport[] = [];
    
    // Проверяем наличие важных файлов
    const requiredFiles = ['package.json'];
    const recommendedFiles = ['README.md', '.gitignore'];
    
    for (const requiredFile of requiredFiles) {
      if (!projectStructure.files.some(f => f.name === requiredFile)) {
        errors.push({
          file: '_project_structure',
          type: 'lint',
          severity: 'error',
          message: `Missing required file: ${requiredFile}`,
          fixable: true,
          suggestedFix: `Create ${requiredFile}`
        });
      }
    }
    
    for (const recommendedFile of recommendedFiles) {
      if (!projectStructure.files.some(f => f.name === recommendedFile)) {
        errors.push({
          file: '_project_structure',
          type: 'lint',
          severity: 'warning',
          message: `Missing recommended file: ${recommendedFile}`,
          fixable: true,
          suggestedFix: `Create ${recommendedFile}`
        });
      }
    }
    
    // Проверяем структуру папок
    if (projectStructure.projectType === 'react' && !projectStructure.directories.some(d => d.includes('src'))) {
      errors.push({
        file: '_project_structure',
        type: 'lint',
        severity: 'warning',
        message: 'React projects should have a src directory',
        fixable: true,
        suggestedFix: 'Create src directory'
      });
    }
    
    return errors;
  }

  private generateFix(match: string, rule: any): string {
    // Генерируем предложения по исправлению
    if (match.includes('console.log')) {
      return 'Remove this line or replace with proper logging';
    }
    
    if (match.includes('debugger')) {
      return 'Remove this debugger statement';
    }
    
    if (match.startsWith('var ')) {
      return match.replace('var ', 'const ');
    }
    
    if (match.includes('==')) {
      return match.replace('==', '===');
    }
    
    if (match.includes('!=')) {
      return match.replace('!=', '!==');
    }
    
    if (match.includes('font-size') && match.includes('px')) {
      const pxValue = match.match(/(\d+)px/)?.[1];
      if (pxValue) {
        const remValue = (parseInt(pxValue) / 16).toFixed(2);
        return match.replace(`${pxValue}px`, `${remValue}rem`);
      }
    }
    
    return 'Manual fix required';
  }

  public async generateErrorFixes(
    projectStructure: ProjectStructure,
    errorReport: ErrorCheckResult
  ): Promise<FileEdit[]> {
    const fixes: FileEdit[] = [];
    
    // Генерируем исправления для каждого файла
    for (const [filePath, errors] of Object.entries(errorReport.errorsByFile)) {
      if (filePath === '_project_structure') {
        // Исправления структуры проекта
        fixes.push(...this.generateStructuralFixes(projectStructure, errors));
      } else {
        // Исправления файлов
        const fixableErrors = errors.filter(e => e.fixable);
        if (fixableErrors.length > 0) {
          const file = projectStructure.files.find(f => f.path === filePath);
          if (file) {
            const fixedContent = this.applyFixes(file, fixableErrors);
            
            fixes.push({
              type: 'update',
              filePath: file.path,
              content: fixedContent,
              description: `Исправлено ${fixableErrors.length} ошибок`
            });
          }
        }
      }
    }
    
    return fixes;
  }

  private generateStructuralFixes(projectStructure: ProjectStructure, errors: ErrorReport[]): FileEdit[] {
    const fixes: FileEdit[] = [];
    
    for (const error of errors) {
      if (error.message.includes('Missing required file: package.json')) {
        fixes.push({
          type: 'create',
          filePath: 'package.json',
          content: this.generatePackageJson(projectStructure),
          description: 'Создан package.json'
        });
      }
      
      if (error.message.includes('Missing recommended file: README.md')) {
        fixes.push({
          type: 'create',
          filePath: 'README.md',
          content: this.generateReadme(projectStructure),
          description: 'Создан README.md'
        });
      }
      
      if (error.message.includes('Missing recommended file: .gitignore')) {
        fixes.push({
          type: 'create',
          filePath: '.gitignore',
          content: this.generateGitignore(projectStructure),
          description: 'Создан .gitignore'
        });
      }
    }
    
    return fixes;
  }

  private applyFixes(file: ProjectFile, errors: ErrorReport[]): string {
    let content = file.content || '';
    
    // Применяем исправления в обратном порядке (чтобы не сбить позиции)
    const sortedErrors = errors.sort((a, b) => (b.line || 0) - (a.line || 0));
    
    for (const error of sortedErrors) {
      if (error.suggestedFix && error.suggestedFix !== 'Manual fix required') {
        // Применяем автоматические исправления
        content = this.applyAutomaticFix(content, error);
      }
    }
    
    return content;
  }

  private applyAutomaticFix(content: string, error: ErrorReport): string {
    if (error.message.includes('Remove console.log')) {
      return content.replace(/console\.log\([^)]*\);?\s*\n?/g, '');
    }
    
    if (error.message.includes('Remove debugger')) {
      return content.replace(/debugger;\s*\n?/g, '');
    }
    
    if (error.message.includes('Use let or const instead of var')) {
      return content.replace(/var\s+/g, 'const ');
    }
    
    if (error.message.includes('Use === instead of ==')) {
      return content.replace(/==\s*(?!null)/g, '=== ');
    }
    
    if (error.message.includes('Use !== instead of !=')) {
      return content.replace(/!=\s*(?!null)/g, '!== ');
    }
    
    return content;
  }

  private generatePackageJson(projectStructure: ProjectStructure): string {
    const packageJson = {
      name: path.basename(projectStructure.rootPath),
      version: '1.0.0',
      description: 'Автоматически сгенерированный package.json',
      main: 'index.js',
      scripts: {
        start: 'node index.js',
        test: 'echo "Error: no test specified" && exit 1'
      },
      keywords: [],
      author: '',
      license: 'ISC'
    };
    
    // Добавляем зависимости на основе типа проекта
    if (projectStructure.projectType === 'react') {
      packageJson.scripts = {
        start: 'react-scripts start',
        build: 'react-scripts build',
        test: 'react-scripts test',
        eject: 'react-scripts eject'
      };
    }
    
    return JSON.stringify(packageJson, null, 2);
  }

  private generateReadme(projectStructure: ProjectStructure): string {
    return `# ${path.basename(projectStructure.rootPath)}

Проект создан автоматически AI Agent.

## Описание

${projectStructure.framework} проект с автоматически сгенерированной структурой.

## Установка

\`\`\`bash
npm install
\`\`\`

## Запуск

\`\`\`bash
npm start
\`\`\`

## Структура проекта

- Тип: ${projectStructure.projectType}
- Фреймворк: ${projectStructure.framework}
- Файлов: ${projectStructure.totalFiles}
- Компонентов: ${projectStructure.componentFiles.length}
- Стилей: ${projectStructure.styleFiles.length}

## Автоматически сгенерировано

Этот README был создан автоматически AI Agent на основе анализа структуры проекта.
`;
  }

  private generateGitignore(projectStructure: ProjectStructure): string {
    let gitignore = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
/build
/dist

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs
*.log

# AI Backups
.ai-backups/
`;

    if (projectStructure.projectType === 'react') {
      gitignore += `
# React specific
.eslintcache
`;
    }

    if (projectStructure.projectType === 'node') {
      gitignore += `
# Node specific
coverage/
.nyc_output
`;
    }

    return gitignore;
  }

  public generateErrorSummary(errorReport: ErrorCheckResult): string {
    const { totalErrors, totalWarnings, fixableErrors, criticalErrors } = errorReport;
    
    let summary = `🔍 Анализ ошибок завершен:
• Ошибок: ${totalErrors}
• Предупреждений: ${totalWarnings}
• Исправимых автоматически: ${fixableErrors.length}
• Критических: ${criticalErrors.length}

`;

    if (criticalErrors.length > 0) {
      summary += `🚨 Критические ошибки:
${criticalErrors.slice(0, 5).map(e => `• ${e.file}: ${e.message}`).join('\n')}
${criticalErrors.length > 5 ? `... и еще ${criticalErrors.length - 5}` : ''}

`;
    }

    if (fixableErrors.length > 0) {
      summary += `✅ Автоматически исправимые:
${fixableErrors.slice(0, 5).map(e => `• ${e.file}: ${e.message}`).join('\n')}
${fixableErrors.length > 5 ? `... и еще ${fixableErrors.length - 5}` : ''}

`;
    }

    return summary;
  }
}

export const errorChecker = new ErrorChecker();
