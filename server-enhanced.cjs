const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const os = require('os');
const { spawn } = require('child_process');

// Импорт наших сервисов (в реальности нужно будет адаптировать для CommonJS)
// const { taskOrchestrator } = require('./src/services/TaskOrchestrator');
// const { sshManager } = require('./src/services/SSHManager');
// const { aiProviderManager } = require('./src/services/AIProviderManager');

// Временное хранилище для демонстрации
const tempStorage = {
  tasks: new Map(),
  sshConnections: new Map(),
  aiProviders: new Map()
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API Routes для автоматизации
  if (pathname === '/api/automation/start') {
    handleAutomationStart(req, res);
    return;
  }

  if (pathname === '/api/automation/status') {
    handleAutomationStatus(req, res);
    return;
  }

  if (pathname === '/api/automation/tasks') {
    handleAutomationTasks(req, res);
    return;
  }

  // API Routes для SSH
  if (pathname === '/api/ssh/connections') {
    handleSSHConnections(req, res);
    return;
  }

  if (pathname === '/api/ssh/connect') {
    handleSSHConnect(req, res);
    return;
  }

  if (pathname === '/api/ssh/test') {
    handleSSHTest(req, res);
    return;
  }

  if (pathname.startsWith('/api/ssh/disconnect/')) {
    handleSSHDisconnect(req, res);
    return;
  }

  if (pathname === '/api/ssh/setup-project') {
    handleSSHSetupProject(req, res);
    return;
  }

  // API Routes для AI провайдеров
  if (pathname === '/api/ai/providers') {
    handleAIProviders(req, res);
    return;
  }

  if (pathname === '/api/ai/configure') {
    handleAIConfigure(req, res);
    return;
  }

  if (pathname === '/api/ai/chat') {
    handleAIChat(req, res);
    return;
  }

  // API Routes для анализа проектов
  if (pathname === '/api/project/analyze') {
    handleProjectAnalyze(req, res);
    return;
  }

  if (pathname === '/api/project/structure') {
    handleProjectStructure(req, res);
    return;
  }

  // API Routes для редактирования файлов
  if (pathname === '/api/files/edit') {
    handleFileEdit(req, res);
    return;
  }

  if (pathname === '/api/files/create') {
    handleFileCreate(req, res);
    return;
  }

  if (pathname === '/api/files/backup') {
    handleFileBackup(req, res);
    return;
  }

  // API Routes для проверки ошибок
  if (pathname === '/api/errors/check') {
    handleErrorCheck(req, res);
    return;
  }

  if (pathname === '/api/errors/fix') {
    handleErrorFix(req, res);
    return;
  }

  // API Routes для запуска проектов
  if (pathname === '/api/runner/start') {
    handleRunnerStart(req, res);
    return;
  }

  if (pathname === '/api/runner/test') {
    handleRunnerTest(req, res);
    return;
  }

  if (pathname === '/api/runner/build') {
    handleRunnerBuild(req, res);
    return;
  }

  // Статические файлы
  if (pathname === '/' || pathname === '/index.html') {
    serveFile(res, 'index.html', 'text/html');
    return;
  }

  if (pathname.endsWith('.js')) {
    serveFile(res, pathname.slice(1), 'application/javascript');
    return;
  }

  if (pathname.endsWith('.css')) {
    serveFile(res, pathname.slice(1), 'text/css');
    return;
  }

  if (pathname.endsWith('.json')) {
    serveFile(res, pathname.slice(1), 'application/json');
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Обработчики автоматизации
async function handleAutomationStart(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end('Method Not Allowed');
    return;
  }

  try {
    const body = await getRequestBody(req);
    const { projectPath, userMessage, selectedAgent, isRemote, sshConnectionId } = JSON.parse(body);

    // Создаем новую задачу
    const taskId = generateId();
    const task = {
      id: taskId,
      projectPath,
      userMessage,
      selectedAgent,
      isRemote,
      sshConnectionId,
      status: 'starting',
      progress: 0,
      steps: [
        { id: 'analyze', name: '📊 Анализ проекта', status: 'pending', progress: 0 },
        { id: 'plan', name: '🎯 Планирование', status: 'pending', progress: 0 },
        { id: 'edit', name: '✏️ Редактирование', status: 'pending', progress: 0 },
        { id: 'check', name: '🔍 Проверка ошибок', status: 'pending', progress: 0 },
        { id: 'test', name: '🧪 Тестирование', status: 'pending', progress: 0 },
        { id: 'deploy', name: '🚀 Развертывание', status: 'pending', progress: 0 }
      ],
      startTime: new Date(),
      logs: []
    };

    tempStorage.tasks.set(taskId, task);

    // Запускаем задачу асинхронно
    executeAutomationTask(task);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, taskId, task }));

  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
}

async function handleAutomationStatus(req, res) {
  const query = url.parse(req.url, true).query;
  const taskId = query.taskId;

  if (!taskId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Task ID required' }));
    return;
  }

  const task = tempStorage.tasks.get(taskId);
  if (!task) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Task not found' }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, task }));
}

async function handleAutomationTasks(req, res) {
  const tasks = Array.from(tempStorage.tasks.values());
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, tasks }));
}

// Обработчики SSH
async function handleSSHConnections(req, res) {
  const connections = Array.from(tempStorage.sshConnections.values());
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, connections }));
}

async function handleSSHConnect(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end('Method Not Allowed');
    return;
  }

  try {
    const body = await getRequestBody(req);
    const credentials = JSON.parse(body);

    // Симуляция SSH подключения
    const connectionId = generateId();
    const connection = {
      id: connectionId,
      host: credentials.host,
      port: credentials.port,
      username: credentials.username,
      status: 'connected',
      lastActivity: new Date(),
      projectPath: null
    };

    tempStorage.sshConnections.set(connectionId, connection);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: true, 
      message: 'SSH подключение установлено',
      connection 
    }));

  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
}

async function handleSSHTest(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end('Method Not Allowed');
    return;
  }

  try {
    const body = await getRequestBody(req);
    const credentials = JSON.parse(body);

    // Симуляция тестирования SSH подключения
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: true, 
      message: `SSH подключение к ${credentials.host} успешно протестировано`,
      details: {
        output: `Connected to ${credentials.host}\nUser: ${credentials.username}\nWorking directory: /home/${credentials.username}`,
        duration: 1000
      }
    }));

  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
}

async function handleSSHDisconnect(req, res) {
  const connectionId = req.url.split('/').pop();
  
  if (tempStorage.sshConnections.has(connectionId)) {
    tempStorage.sshConnections.delete(connectionId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Подключение закрыто' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Connection not found' }));
  }
}

async function handleSSHSetupProject(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end('Method Not Allowed');
    return;
  }

  try {
    const body = await getRequestBody(req);
    const { connectionId, projectPath } = JSON.parse(body);

    const connection = tempStorage.sshConnections.get(connectionId);
    if (!connection) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Connection not found' }));
      return;
    }

    // Обновляем путь к проекту
    connection.projectPath = projectPath;
    connection.lastActivity = new Date();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: true, 
      message: `Проект настроен в ${projectPath}. Найдены файлы: package.json, src/, public/`
    }));

  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
}

// Обработчики AI
async function handleAIProviders(req, res) {
  const providers = [
    { id: 'openai', name: 'OpenAI GPT', status: 'available', configured: false },
    { id: 'google', name: 'Google Gemini', status: 'available', configured: false },
    { id: 'anthropic', name: 'Anthropic Claude', status: 'available', configured: false },
    { id: 'cohere', name: 'Cohere', status: 'available', configured: false },
    { id: 'huggingface', name: 'Hugging Face', status: 'available', configured: false },
    { id: 'ollama', name: 'Ollama (Local)', status: 'available', configured: false }
  ];

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, providers }));
}

async function handleAIConfigure(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end('Method Not Allowed');
    return;
  }

  try {
    const body = await getRequestBody(req);
    const { providerId, apiKey, config } = JSON.parse(body);

    // Сохраняем конфигурацию (в реальности нужно шифровать)
    tempStorage.aiProviders.set(providerId, { apiKey, config, configured: true });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: true, 
      message: `AI провайдер ${providerId} настроен` 
    }));

  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
}

async function handleAIChat(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end('Method Not Allowed');
    return;
  }

  try {
    const body = await getRequestBody(req);
    const { message, providerId, context } = JSON.parse(body);

    // Симуляция AI ответа
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = {
      message: `AI ответ от ${providerId}: Я проанализировал ваш запрос "${message}" и готов помочь с автоматизацией разработки.`,
      suggestions: [
        'Проанализировать структуру проекта',
        'Исправить найденные ошибки',
        'Оптимизировать производительность',
        'Добавить тесты'
      ],
      confidence: 0.95
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, response }));

  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
}

// Обработчики анализа проектов
async function handleProjectAnalyze(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end('Method Not Allowed');
    return;
  }

  try {
    const body = await getRequestBody(req);
    const { projectPath } = JSON.parse(body);

    // Симуляция анализа проекта
    await new Promise(resolve => setTimeout(resolve, 2000));

    const analysis = {
      projectType: 'React Application',
      framework: 'React 18.2.0',
      packageManager: 'npm',
      dependencies: 25,
      devDependencies: 15,
      files: {
        total: 156,
        components: 23,
        styles: 12,
        tests: 8,
        configs: 5
      },
      issues: [
        { type: 'warning', message: 'Устаревшие зависимости найдены', count: 3 },
        { type: 'error', message: 'Отсутствуют тесты для компонентов', count: 15 },
        { type: 'info', message: 'Рекомендуется оптимизация bundle', count: 1 }
      ],
      recommendations: [
        'Обновить зависимости до последних версий',
        'Добавить unit тесты для компонентов',
        'Настроить code splitting для оптимизации',
        'Добавить ESLint и Prettier конфигурацию'
      ]
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, analysis }));

  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
}

async function handleProjectStructure(req, res) {
  const query = url.parse(req.url, true).query;
  const projectPath = query.path || '.';

  try {
    // Симуляция получения структуры проекта
    const structure = {
      name: path.basename(projectPath),
      type: 'directory',
      children: [
        {
          name: 'src',
          type: 'directory',
          children: [
            { name: 'components', type: 'directory' },
            { name: 'services', type: 'directory' },
            { name: 'types', type: 'directory' },
            { name: 'App.tsx', type: 'file' },
            { name: 'index.tsx', type: 'file' }
          ]
        },
        {
          name: 'public',
          type: 'directory',
          children: [
            { name: 'index.html', type: 'file' },
            { name: 'favicon.ico', type: 'file' }
          ]
        },
        { name: 'package.json', type: 'file' },
        { name: 'tsconfig.json', type: 'file' },
        { name: 'README.md', type: 'file' }
      ]
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, structure }));

  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
}

// Вспомогательные функции
async function executeAutomationTask(task) {
  try {
    // Симуляция выполнения задачи
    for (let i = 0; i < task.steps.length; i++) {
      const step = task.steps[i];
      
      // Обновляем статус шага
      step.status = 'running';
      task.logs.push(`Начинаем выполнение: ${step.name}`);
      
      // Симулируем работу
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      
      // Обновляем прогресс
      step.progress = 100;
      step.status = 'completed';
      task.progress = Math.round(((i + 1) / task.steps.length) * 100);
      task.logs.push(`Завершено: ${step.name}`);
    }

    task.status = 'completed';
    task.endTime = new Date();
    task.logs.push('Автоматизация завершена успешно!');

  } catch (error) {
    task.status = 'failed';
    task.error = error.message;
    task.logs.push(`Ошибка: ${error.message}`);
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', reject);
  });
}

function serveFile(res, filePath, contentType) {
  const fullPath = path.join(__dirname, filePath);
  
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Enhanced AI Agent Server запущен на порту ${PORT}`);
  console.log(`📊 Доступные API endpoints:`);
  console.log(`   • Автоматизация: /api/automation/*`);
  console.log(`   • SSH: /api/ssh/*`);
  console.log(`   • AI: /api/ai/*`);
  console.log(`   • Проекты: /api/project/*`);
  console.log(`   • Файлы: /api/files/*`);
  console.log(`   • Ошибки: /api/errors/*`);
  console.log(`   • Запуск: /api/runner/*`);
  console.log(`🌐 Откройте http://localhost:${PORT} для доступа к интерфейсу`);
});

module.exports = server;
