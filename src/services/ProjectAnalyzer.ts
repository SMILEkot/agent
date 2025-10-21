import * as fs from 'fs';
import * as path from 'path';

export interface ProjectFile {
  path: string;
  name: string;
  extension: string;
  size: number;
  type: 'component' | 'style' | 'config' | 'test' | 'asset' | 'script' | 'other';
  framework?: string;
  language?: string;
  content?: string;
}

export interface ProjectStructure {
  rootPath: string;
  projectType: 'react' | 'vue' | 'angular' | 'node' | 'static' | 'unknown';
  framework: string;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'unknown';
  files: ProjectFile[];
  directories: string[];
  configFiles: ProjectFile[];
  componentFiles: ProjectFile[];
  styleFiles: ProjectFile[];
  testFiles: ProjectFile[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  totalFiles: number;
  totalSize: number;
}

export class ProjectAnalyzer {
  private ignoredDirs = [
    'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', 
    'coverage', '.nyc_output', 'tmp', 'temp', '.cache', '.vscode', '.idea'
  ];

  private ignoredFiles = [
    '.DS_Store', 'Thumbs.db', '*.log', '*.tmp', '*.temp'
  ];

  public async analyzeProject(projectPath: string): Promise<ProjectStructure> {
    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project path does not exist: ${projectPath}`);
    }

    const structure: ProjectStructure = {
      rootPath: projectPath,
      projectType: 'unknown',
      framework: 'unknown',
      packageManager: 'unknown',
      files: [],
      directories: [],
      configFiles: [],
      componentFiles: [],
      styleFiles: [],
      testFiles: [],
      dependencies: {},
      devDependencies: {},
      scripts: {},
      totalFiles: 0,
      totalSize: 0
    };

    // Анализируем package.json если есть
    await this.analyzePackageJson(projectPath, structure);
    
    // Сканируем файлы и папки
    await this.scanDirectory(projectPath, structure, '');
    
    // Определяем тип проекта
    this.determineProjectType(structure);
    
    // Классифицируем файлы
    this.classifyFiles(structure);
    
    return structure;
  }

  private async analyzePackageJson(projectPath: string, structure: ProjectStructure): Promise<void> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        structure.dependencies = packageJson.dependencies || {};
        structure.devDependencies = packageJson.devDependencies || {};
        structure.scripts = packageJson.scripts || {};
        
        // Определяем package manager
        if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) {
          structure.packageManager = 'yarn';
        } else if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) {
          structure.packageManager = 'pnpm';
        } else if (fs.existsSync(path.join(projectPath, 'package-lock.json'))) {
          structure.packageManager = 'npm';
        }
        
      } catch (error) {
        console.warn('Failed to parse package.json:', error);
      }
    }
  }

  private async scanDirectory(dirPath: string, structure: ProjectStructure, relativePath: string): Promise<void> {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const relativeItemPath = path.join(relativePath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!this.ignoredDirs.includes(item)) {
            structure.directories.push(relativeItemPath);
            await this.scanDirectory(fullPath, structure, relativeItemPath);
          }
        } else if (stat.isFile()) {
          if (!this.shouldIgnoreFile(item)) {
            const file: ProjectFile = {
              path: relativeItemPath,
              name: item,
              extension: path.extname(item),
              size: stat.size,
              type: 'other'
            };
            
            // Определяем язык программирования
            file.language = this.detectLanguage(file.extension);
            
            structure.files.push(file);
            structure.totalFiles++;
            structure.totalSize += stat.size;
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${dirPath}:`, error);
    }
  }

  private shouldIgnoreFile(filename: string): boolean {
    return this.ignoredFiles.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(filename);
      }
      return filename === pattern;
    });
  }

  private detectLanguage(extension: string): string {
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.vue': 'vue',
      '.py': 'python',
      '.java': 'java',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.less': 'less',
      '.json': 'json',
      '.xml': 'xml',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.md': 'markdown',
      '.sh': 'bash',
      '.sql': 'sql'
    };
    
    return languageMap[extension.toLowerCase()] || 'unknown';
  }

  private determineProjectType(structure: ProjectStructure): void {
    const { dependencies, devDependencies, files } = structure;
    const allDeps = { ...dependencies, ...devDependencies };
    
    // React проект
    if (allDeps.react || allDeps['@types/react'] || files.some(f => f.name === 'App.jsx' || f.name === 'App.tsx')) {
      structure.projectType = 'react';
      structure.framework = this.detectReactFramework(allDeps);
      return;
    }
    
    // Vue проект
    if (allDeps.vue || files.some(f => f.extension === '.vue')) {
      structure.projectType = 'vue';
      structure.framework = this.detectVueFramework(allDeps);
      return;
    }
    
    // Angular проект
    if (allDeps['@angular/core'] || files.some(f => f.name === 'angular.json')) {
      structure.projectType = 'angular';
      structure.framework = 'Angular';
      return;
    }
    
    // Node.js проект
    if (allDeps.express || allDeps.fastify || allDeps.koa || structure.scripts.start) {
      structure.projectType = 'node';
      structure.framework = this.detectNodeFramework(allDeps);
      return;
    }
    
    // Статический сайт
    if (files.some(f => f.name === 'index.html')) {
      structure.projectType = 'static';
      structure.framework = 'Static HTML';
      return;
    }
  }

  private detectReactFramework(deps: Record<string, string>): string {
    if (deps.next) return 'Next.js';
    if (deps.gatsby) return 'Gatsby';
    if (deps['react-scripts']) return 'Create React App';
    if (deps.vite) return 'Vite + React';
    return 'React';
  }

  private detectVueFramework(deps: Record<string, string>): string {
    if (deps.nuxt) return 'Nuxt.js';
    if (deps['@vue/cli-service']) return 'Vue CLI';
    if (deps.vite) return 'Vite + Vue';
    return 'Vue.js';
  }

  private detectNodeFramework(deps: Record<string, string>): string {
    if (deps.express) return 'Express.js';
    if (deps.fastify) return 'Fastify';
    if (deps.koa) return 'Koa.js';
    if (deps.nestjs) return 'NestJS';
    return 'Node.js';
  }

  private classifyFiles(structure: ProjectStructure): void {
    for (const file of structure.files) {
      file.type = this.classifyFile(file);
      
      // Распределяем по категориям
      switch (file.type) {
        case 'config':
          structure.configFiles.push(file);
          break;
        case 'component':
          structure.componentFiles.push(file);
          break;
        case 'style':
          structure.styleFiles.push(file);
          break;
        case 'test':
          structure.testFiles.push(file);
          break;
      }
    }
  }

  private classifyFile(file: ProjectFile): ProjectFile['type'] {
    const { name, extension, path: filePath } = file;
    const lowerName = name.toLowerCase();
    const lowerPath = filePath.toLowerCase();
    
    // Конфигурационные файлы
    const configFiles = [
      'package.json', 'tsconfig.json', 'webpack.config.js', 'vite.config.js',
      'next.config.js', 'nuxt.config.js', 'vue.config.js', 'angular.json',
      '.eslintrc', '.prettierrc', 'babel.config.js', 'tailwind.config.js',
      'postcss.config.js', 'jest.config.js', 'cypress.config.js'
    ];
    
    if (configFiles.some(config => lowerName.includes(config.toLowerCase())) ||
        lowerName.startsWith('.env') || extension === '.config') {
      return 'config';
    }
    
    // Тестовые файлы
    if (lowerName.includes('test') || lowerName.includes('spec') || 
        lowerPath.includes('/test/') || lowerPath.includes('/__tests__/') ||
        extension === '.test.js' || extension === '.spec.js') {
      return 'test';
    }
    
    // Компоненты
    const componentExtensions = ['.jsx', '.tsx', '.vue', '.svelte'];
    if (componentExtensions.includes(extension) || 
        (extension === '.js' && lowerPath.includes('/component'))) {
      return 'component';
    }
    
    // Стили
    const styleExtensions = ['.css', '.scss', '.sass', '.less', '.styl'];
    if (styleExtensions.includes(extension)) {
      return 'style';
    }
    
    // Ассеты
    const assetExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
    if (assetExtensions.includes(extension)) {
      return 'asset';
    }
    
    // Скрипты
    const scriptExtensions = ['.js', '.ts', '.py', '.sh', '.bat'];
    if (scriptExtensions.includes(extension)) {
      return 'script';
    }
    
    return 'other';
  }

  public async getFileContent(projectPath: string, filePath: string): Promise<string> {
    const fullPath = path.join(projectPath, filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    
    const stat = fs.statSync(fullPath);
    if (stat.size > 1024 * 1024) { // 1MB limit
      throw new Error(`File too large: ${filePath}`);
    }
    
    return fs.readFileSync(fullPath, 'utf8');
  }

  public generateProjectSummary(structure: ProjectStructure): string {
    const { projectType, framework, totalFiles, totalSize, packageManager } = structure;
    
    return `
📊 Анализ проекта:
• Тип: ${projectType} (${framework})
• Файлов: ${totalFiles}
• Размер: ${(totalSize / 1024).toFixed(1)} KB
• Пакетный менеджер: ${packageManager}
• Компонентов: ${structure.componentFiles.length}
• Стилей: ${structure.styleFiles.length}
• Тестов: ${structure.testFiles.length}
• Конфигураций: ${structure.configFiles.length}

🔍 Основные зависимости:
${Object.keys(structure.dependencies).slice(0, 5).map(dep => `• ${dep}`).join('\n')}

📁 Структура:
${structure.directories.slice(0, 10).map(dir => `• ${dir}`).join('\n')}
    `.trim();
  }
}

export const projectAnalyzer = new ProjectAnalyzer();
