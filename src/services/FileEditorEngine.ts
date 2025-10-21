import * as fs from 'fs';
import * as path from 'path';
import { ProjectStructure, ProjectFile } from './ProjectAnalyzer';

export interface FileEdit {
  type: 'create' | 'update' | 'delete' | 'rename';
  filePath: string;
  content?: string;
  newPath?: string;
  backup?: string;
  description: string;
}

export interface EditResult {
  success: boolean;
  filePath: string;
  action: string;
  error?: string;
  backupPath?: string;
}

export class FileEditorEngine {
  private backupDir: string = '.ai-backups';

  public async executeEdits(projectPath: string, edits: FileEdit[]): Promise<EditResult[]> {
    const results: EditResult[] = [];
    
    // Создаем папку для бэкапов
    await this.ensureBackupDir(projectPath);
    
    for (const edit of edits) {
      try {
        const result = await this.executeEdit(projectPath, edit);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          filePath: edit.filePath,
          action: edit.type,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }

  private async executeEdit(projectPath: string, edit: FileEdit): Promise<EditResult> {
    const fullPath = path.join(projectPath, edit.filePath);
    
    switch (edit.type) {
      case 'create':
        return this.createFile(fullPath, edit.content || '', edit.description);
      
      case 'update':
        return this.updateFile(projectPath, fullPath, edit.content || '', edit.description);
      
      case 'delete':
        return this.deleteFile(projectPath, fullPath, edit.description);
      
      case 'rename':
        return this.renameFile(fullPath, path.join(projectPath, edit.newPath || ''), edit.description);
      
      default:
        throw new Error(`Unknown edit type: ${edit.type}`);
    }
  }

  private async createFile(filePath: string, content: string, description: string): Promise<EditResult> {
    if (fs.existsSync(filePath)) {
      throw new Error(`File already exists: ${filePath}`);
    }
    
    // Создаем директории если нужно
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    
    return {
      success: true,
      filePath,
      action: `Created: ${description}`
    };
  }

  private async updateFile(projectPath: string, filePath: string, content: string, description: string): Promise<EditResult> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    
    // Создаем бэкап
    const backupPath = await this.createBackup(projectPath, filePath);
    
    fs.writeFileSync(filePath, content, 'utf8');
    
    return {
      success: true,
      filePath,
      action: `Updated: ${description}`,
      backupPath
    };
  }

  private async deleteFile(projectPath: string, filePath: string, description: string): Promise<EditResult> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    
    // Создаем бэкап перед удалением
    const backupPath = await this.createBackup(projectPath, filePath);
    
    fs.unlinkSync(filePath);
    
    return {
      success: true,
      filePath,
      action: `Deleted: ${description}`,
      backupPath
    };
  }

  private async renameFile(oldPath: string, newPath: string, description: string): Promise<EditResult> {
    if (!fs.existsSync(oldPath)) {
      throw new Error(`File does not exist: ${oldPath}`);
    }
    
    if (fs.existsSync(newPath)) {
      throw new Error(`Target file already exists: ${newPath}`);
    }
    
    // Создаем директории если нужно
    const dir = path.dirname(newPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.renameSync(oldPath, newPath);
    
    return {
      success: true,
      filePath: newPath,
      action: `Renamed: ${description}`
    };
  }

  private async ensureBackupDir(projectPath: string): Promise<void> {
    const backupPath = path.join(projectPath, this.backupDir);
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }
  }

  private async createBackup(projectPath: string, filePath: string): Promise<string> {
    const relativePath = path.relative(projectPath, filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `${relativePath.replace(/[/\\]/g, '_')}_${timestamp}`;
    const backupPath = path.join(projectPath, this.backupDir, backupFileName);
    
    // Создаем директории для бэкапа если нужно
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  }

  public async generateCodeEdit(
    projectStructure: ProjectStructure,
    taskDescription: string,
    targetFiles: string[]
  ): Promise<FileEdit[]> {
    const edits: FileEdit[] = [];
    
    // Анализируем задачу и генерируем соответствующие правки
    const taskType = this.analyzeTaskType(taskDescription);
    
    switch (taskType) {
      case 'design':
        edits.push(...await this.generateDesignEdits(projectStructure, taskDescription, targetFiles));
        break;
      
      case 'component':
        edits.push(...await this.generateComponentEdits(projectStructure, taskDescription, targetFiles));
        break;
      
      case 'config':
        edits.push(...await this.generateConfigEdits(projectStructure, taskDescription, targetFiles));
        break;
      
      case 'refactor':
        edits.push(...await this.generateRefactorEdits(projectStructure, taskDescription, targetFiles));
        break;
      
      default:
        edits.push(...await this.generateGenericEdits(projectStructure, taskDescription, targetFiles));
    }
    
    return edits;
  }

  private analyzeTaskType(taskDescription: string): string {
    const lower = taskDescription.toLowerCase();
    
    if (lower.includes('дизайн') || lower.includes('стиль') || lower.includes('css') || lower.includes('цвет')) {
      return 'design';
    }
    
    if (lower.includes('компонент') || lower.includes('component') || lower.includes('создай') || lower.includes('добавь')) {
      return 'component';
    }
    
    if (lower.includes('конфиг') || lower.includes('настрой') || lower.includes('package.json') || lower.includes('webpack')) {
      return 'config';
    }
    
    if (lower.includes('рефактор') || lower.includes('переписать') || lower.includes('оптимизир') || lower.includes('улучш')) {
      return 'refactor';
    }
    
    return 'generic';
  }

  private async generateDesignEdits(
    structure: ProjectStructure,
    taskDescription: string,
    targetFiles: string[]
  ): Promise<FileEdit[]> {
    const edits: FileEdit[] = [];
    
    // Находим CSS файлы для редактирования
    const cssFiles = structure.styleFiles.filter(f => 
      targetFiles.length === 0 || targetFiles.some(target => f.path.includes(target))
    );
    
    for (const cssFile of cssFiles) {
      // Генерируем новые стили на основе задачи
      const newStyles = this.generateCSSChanges(taskDescription, cssFile);
      
      edits.push({
        type: 'update',
        filePath: cssFile.path,
        content: newStyles,
        description: `Обновлены стили: ${taskDescription}`
      });
    }
    
    // Если CSS файлов нет, создаем новый
    if (cssFiles.length === 0) {
      const newCSSPath = this.suggestCSSFilePath(structure);
      const newStyles = this.generateNewCSS(taskDescription, structure);
      
      edits.push({
        type: 'create',
        filePath: newCSSPath,
        content: newStyles,
        description: `Создан новый файл стилей: ${taskDescription}`
      });
    }
    
    return edits;
  }

  private async generateComponentEdits(
    structure: ProjectStructure,
    taskDescription: string,
    targetFiles: string[]
  ): Promise<FileEdit[]> {
    const edits: FileEdit[] = [];
    
    // Генерируем новый компонент
    const componentName = this.extractComponentName(taskDescription);
    const componentPath = this.suggestComponentPath(structure, componentName);
    const componentCode = this.generateComponentCode(structure, componentName, taskDescription);
    
    edits.push({
      type: 'create',
      filePath: componentPath,
      content: componentCode,
      description: `Создан новый компонент: ${componentName}`
    });
    
    // Обновляем импорты в главном файле
    const mainFile = this.findMainFile(structure);
    if (mainFile) {
      const updatedMainFile = this.addComponentImport(mainFile, componentName, componentPath);
      
      edits.push({
        type: 'update',
        filePath: mainFile.path,
        content: updatedMainFile,
        description: `Добавлен импорт компонента ${componentName}`
      });
    }
    
    return edits;
  }

  private async generateConfigEdits(
    structure: ProjectStructure,
    taskDescription: string,
    targetFiles: string[]
  ): Promise<FileEdit[]> {
    const edits: FileEdit[] = [];
    
    // Обновляем package.json если нужно
    if (taskDescription.includes('зависимост') || taskDescription.includes('пакет')) {
      const packageJson = structure.configFiles.find(f => f.name === 'package.json');
      if (packageJson) {
        const updatedPackageJson = this.updatePackageJson(packageJson, taskDescription);
        
        edits.push({
          type: 'update',
          filePath: packageJson.path,
          content: updatedPackageJson,
          description: `Обновлен package.json: ${taskDescription}`
        });
      }
    }
    
    return edits;
  }

  private async generateRefactorEdits(
    structure: ProjectStructure,
    taskDescription: string,
    targetFiles: string[]
  ): Promise<FileEdit[]> {
    const edits: FileEdit[] = [];
    
    // Рефакторим указанные файлы
    const filesToRefactor = structure.files.filter(f => 
      targetFiles.some(target => f.path.includes(target))
    );
    
    for (const file of filesToRefactor) {
      const refactoredCode = this.refactorCode(file, taskDescription);
      
      edits.push({
        type: 'update',
        filePath: file.path,
        content: refactoredCode,
        description: `Рефакторинг: ${taskDescription}`
      });
    }
    
    return edits;
  }

  private async generateGenericEdits(
    structure: ProjectStructure,
    taskDescription: string,
    targetFiles: string[]
  ): Promise<FileEdit[]> {
    const edits: FileEdit[] = [];
    
    // Общие правки на основе анализа задачи
    if (targetFiles.length > 0) {
      for (const targetFile of targetFiles) {
        const file = structure.files.find(f => f.path.includes(targetFile));
        if (file) {
          const updatedContent = this.applyGenericChanges(file, taskDescription);
          
          edits.push({
            type: 'update',
            filePath: file.path,
            content: updatedContent,
            description: `Обновлен файл: ${taskDescription}`
          });
        }
      }
    }
    
    return edits;
  }

  // Вспомогательные методы для генерации кода
  private generateCSSChanges(taskDescription: string, cssFile: ProjectFile): string {
    // Базовая генерация CSS изменений
    let newCSS = cssFile.content || '';
    
    if (taskDescription.includes('цвет') || taskDescription.includes('color')) {
      newCSS += '\n\n/* Обновленные цвета */\n';
      newCSS += ':root {\n  --primary-color: #3b82f6;\n  --secondary-color: #64748b;\n}\n';
    }
    
    if (taskDescription.includes('адаптив') || taskDescription.includes('responsive')) {
      newCSS += '\n\n/* Адаптивные стили */\n';
      newCSS += '@media (max-width: 768px) {\n  .container { padding: 1rem; }\n}\n';
    }
    
    return newCSS;
  }

  private generateNewCSS(taskDescription: string, structure: ProjectStructure): string {
    return `/* Автоматически сгенерированные стили */
/* Задача: ${taskDescription} */

:root {
  --primary-color: #3b82f6;
  --secondary-color: #64748b;
  --background-color: #ffffff;
  --text-color: #1f2937;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--text-color);
  background-color: var(--background-color);
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Адаптивные стили */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
}
`;
  }

  private generateComponentCode(structure: ProjectStructure, componentName: string, taskDescription: string): string {
    const isTypeScript = structure.files.some(f => f.extension === '.tsx' || f.extension === '.ts');
    const extension = isTypeScript ? 'tsx' : 'jsx';
    
    if (structure.projectType === 'react') {
      return `import React from 'react';

interface ${componentName}Props {
  // Добавьте пропсы здесь
}

const ${componentName}: React.FC<${componentName}Props> = () => {
  return (
    <div className="${componentName.toLowerCase()}">
      <h2>${componentName}</h2>
      <p>Компонент создан автоматически для: ${taskDescription}</p>
    </div>
  );
};

export default ${componentName};
`;
    }
    
    return `// ${componentName} компонент
// Создан автоматически для: ${taskDescription}

function ${componentName}() {
  return {
    template: \`
      <div class="${componentName.toLowerCase()}">
        <h2>${componentName}</h2>
        <p>Компонент создан автоматически</p>
      </div>
    \`
  };
}

export default ${componentName};
`;
  }

  private extractComponentName(taskDescription: string): string {
    // Простая логика извлечения имени компонента
    const words = taskDescription.split(' ');
    const componentWord = words.find(word => 
      word.includes('компонент') || word.includes('Component')
    );
    
    if (componentWord) {
      const index = words.indexOf(componentWord);
      if (index > 0) {
        return words[index - 1].charAt(0).toUpperCase() + words[index - 1].slice(1);
      }
    }
    
    return 'NewComponent';
  }

  private suggestComponentPath(structure: ProjectStructure, componentName: string): string {
    const hasComponentsDir = structure.directories.some(dir => dir.includes('components'));
    
    if (hasComponentsDir) {
      const extension = structure.files.some(f => f.extension === '.tsx') ? 'tsx' : 'jsx';
      return `src/components/${componentName}.${extension}`;
    }
    
    return `${componentName}.jsx`;
  }

  private suggestCSSFilePath(structure: ProjectStructure): string {
    const hasSrcDir = structure.directories.some(dir => dir === 'src');
    
    if (hasSrcDir) {
      return 'src/styles/generated.css';
    }
    
    return 'styles.css';
  }

  private findMainFile(structure: ProjectStructure): ProjectFile | null {
    // Ищем главный файл приложения
    const mainFiles = ['App.jsx', 'App.tsx', 'index.jsx', 'index.tsx', 'main.jsx', 'main.tsx'];
    
    for (const mainFileName of mainFiles) {
      const mainFile = structure.files.find(f => f.name === mainFileName);
      if (mainFile) {
        return mainFile;
      }
    }
    
    return null;
  }

  private addComponentImport(mainFile: ProjectFile, componentName: string, componentPath: string): string {
    let content = mainFile.content || '';
    
    // Добавляем импорт
    const importLine = `import ${componentName} from './${componentPath}';`;
    
    if (!content.includes(importLine)) {
      const lines = content.split('\n');
      const lastImportIndex = lines.findLastIndex(line => line.startsWith('import'));
      
      if (lastImportIndex >= 0) {
        lines.splice(lastImportIndex + 1, 0, importLine);
      } else {
        lines.unshift(importLine);
      }
      
      content = lines.join('\n');
    }
    
    return content;
  }

  private updatePackageJson(packageJsonFile: ProjectFile, taskDescription: string): string {
    try {
      const packageJson = JSON.parse(packageJsonFile.content || '{}');
      
      // Добавляем зависимости на основе задачи
      if (taskDescription.includes('tailwind')) {
        packageJson.devDependencies = packageJson.devDependencies || {};
        packageJson.devDependencies.tailwindcss = '^3.3.0';
        packageJson.devDependencies.autoprefixer = '^10.4.14';
        packageJson.devDependencies.postcss = '^8.4.24';
      }
      
      return JSON.stringify(packageJson, null, 2);
    } catch (error) {
      return packageJsonFile.content || '{}';
    }
  }

  private refactorCode(file: ProjectFile, taskDescription: string): string {
    let content = file.content || '';
    
    // Базовый рефакторинг
    if (taskDescription.includes('оптимизир')) {
      // Удаляем лишние пробелы и пустые строки
      content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
      content = content.replace(/\s+$/gm, '');
    }
    
    return content;
  }

  private applyGenericChanges(file: ProjectFile, taskDescription: string): string {
    let content = file.content || '';
    
    // Добавляем комментарий о изменении
    const comment = file.extension === '.css' 
      ? `/* Обновлено: ${taskDescription} */\n`
      : `// Обновлено: ${taskDescription}\n`;
    
    if (!content.includes(comment)) {
      content = comment + content;
    }
    
    return content;
  }
}

export const fileEditorEngine = new FileEditorEngine();
