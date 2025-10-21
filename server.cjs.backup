const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const os = require('os');
const { spawn } = require('child_process');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // API endpoints
  if (pathname === '/api/browse') {
    handleBrowse(req, res, parsedUrl.query);
    return;
  }
  
  if (pathname === '/api/chat') {
    handleChat(req, res);
    return;
  }
  
  if (pathname === '/api/terminal') {
    handleTerminal(req, res);
    return;
  }
  
  if (pathname === '/api/ai-agents') {
    handleAIAgents(req, res);
    return;
  }
  
  if (pathname === '/api/ai-chat') {
    handleAIChat(req, res);
    return;
  }
  
  // Static files
  let filePath = '.' + pathname;
  if (filePath === './') {
    filePath = './simple-index.html';
  }
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1><p>File not found: ' + filePath + '</p>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// File browser API
function handleBrowse(req, res, query) {
  const targetPath = query.path || os.homedir();
  
  try {
    const stats = fs.statSync(targetPath);
    
    if (stats.isDirectory()) {
      const items = fs.readdirSync(targetPath).map(item => {
        const itemPath = path.join(targetPath, item);
        try {
          const itemStats = fs.statSync(itemPath);
          return {
            name: item,
            path: itemPath,
            type: itemStats.isDirectory() ? 'directory' : 'file',
            size: itemStats.size,
            modified: itemStats.mtime
          };
        } catch (err) {
          return {
            name: item,
            path: itemPath,
            type: 'unknown',
            size: 0,
            modified: new Date()
          };
        }
      });
      
      // Sort: directories first, then files
      items.sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        currentPath: targetPath,
        parentPath: path.dirname(targetPath),
        items: items
      }));
    } else {
      // File content
      const content = fs.readFileSync(targetPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        type: 'file',
        path: targetPath,
        content: content
      }));
    }
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
}

// Chat API
function handleChat(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const { message, useAI } = JSON.parse(body);
      
      if (useAI) {
        // Умные AI ответы
        const aiResponse = generateSmartResponse(message);
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          response: aiResponse,
          timestamp: new Date().toISOString(),
          type: 'ai'
        }));
      } else {
        // Simple AI responses
        const responses = {
          'привет': 'Привет! Я AI Agent. Чем могу помочь?',
          'как дела': 'Отлично! Готов помочь с вашими задачами.',
          'помощь': 'Я могу помочь с файлами, кодом, вопросами. Просто спросите!',
          'файлы': 'Используйте файловый менеджер слева для навигации по папкам.',
          'папка': 'Выберите папку в файловом менеджере, чтобы просмотреть её содержимое.'
        };
        
        let response = responses[message.toLowerCase()];
        
        if (!response) {
          if (message.includes('файл') || message.includes('папк')) {
            response = 'Для работы с файлами используйте файловый менеджер слева. Вы можете навигировать по папкам и просматривать файлы.';
          } else if (message.includes('код') || message.includes('программ')) {
            response = 'Я могу помочь с анализом кода! Выберите файл в файловом менеджере, и я смогу его проанализировать.';
          } else {
            response = `Понял ваш вопрос: "${message}". Это локальная версия с базовыми ответами. Для полноценного AI подключите OpenAI API.`;
          }
        }
        
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          response: response,
          timestamp: new Date().toISOString(),
          type: 'simple'
        }));
      }
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }
  });
}

// Terminal API
function handleTerminal(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const { command } = JSON.parse(body);
      
      // Безопасность: ограничиваем команды
      const allowedCommands = ['ls', 'pwd', 'whoami', 'date', 'uname', 'df', 'free', 'ps', 'cat', 'head', 'tail', 'wc', 'grep', 'find', 'tree'];
      const cmdParts = command.trim().split(' ');
      const baseCmd = cmdParts[0];
      
      if (!allowedCommands.includes(baseCmd)) {
        res.writeHead(400, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          error: `Команда "${baseCmd}" не разрешена. Доступные команды: ${allowedCommands.join(', ')}` 
        }));
        return;
      }
      
      const child = spawn(baseCmd, cmdParts.slice(1), {
        cwd: process.cwd(),
        env: process.env,
        timeout: 10000 // 10 секунд максимум
      });
      
      let output = '';
      let errorOutput = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      child.on('close', (code) => {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({
          command: command,
          output: output,
          error: errorOutput,
          exitCode: code,
          timestamp: new Date().toISOString()
        }));
      });
      
      child.on('error', (error) => {
        res.writeHead(500, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({
          error: `Ошибка выполнения команды: ${error.message}`
        }));
      });
      
    } catch (error) {
      res.writeHead(400, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }
  });
}

// Smart AI response generator
// AI Provider Manager (simplified server version)
class ServerAIManager {
  constructor() {
    this.credentials = {};
    this.loadCredentials();
  }

  loadCredentials() {
    // В реальном приложении загружаем из переменных окружения
    this.credentials = {
      openai: process.env.OPENAI_API_KEY,
      google: process.env.GOOGLE_AI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      cohere: process.env.COHERE_API_KEY,
      huggingface: process.env.HUGGINGFACE_API_KEY
    };
  }

  async callAI(request) {
    // Пока что возвращаем умные локальные ответы
    // В будущем здесь будет реальный вызов AI API
    return this.generateSmartResponse(request);
  }

  generateSmartResponse(request) {
    const message = request.message.toLowerCase();
    const context = request.context || {};
    
    // Анализ типа задачи
    let taskType = 'general';
    if (message.includes('файл') || message.includes('папк') || message.includes('код')) {
      taskType = 'code';
    } else if (message.includes('дизайн') || message.includes('стиль') || message.includes('css')) {
      taskType = 'design';
    } else if (message.includes('ошибк') || message.includes('баг') || message.includes('не работает')) {
      taskType = 'debug';
    } else if (message.includes('анализ') || message.includes('проверь') || message.includes('посмотри')) {
      taskType = 'analyze';
    } else if (message.includes('тест')) {
      taskType = 'test';
    }

    // Генерируем ответ с действиями
    const responses = {
      code: {
        response: `Анализирую ваш запрос о коде: "${request.message}". 

🤖 Автоматический план работы:
1. 📁 Выбрать папку с проектом в файловом менеджере
2. 🔍 Проанализировать структуру проекта
3. ✏️ Найти нужные файлы и внести изменения
4. ✅ Проверить код на ошибки
5. 🚀 Протестировать результат

Выберите папку проекта, и я начну автоматическую обработку!`,
        actions: [
          {
            type: 'analyze_project',
            target: context.projectPath || 'Выберите папку проекта',
            description: 'Анализ структуры проекта и поиск файлов для редактирования'
          }
        ]
      },
      design: {
        response: `Готов помочь с дизайном: "${request.message}".

🎨 План автоматических действий:
1. 🎨 Найти CSS файлы и компоненты
2. 📐 Проанализировать текущий дизайн
3. ✨ Применить новые стили
4. 📱 Проверить адаптивность
5. 🎯 Оптимизировать для разных устройств

Укажите папку проекта для начала работы!`,
        actions: [
          {
            type: 'find_design_files',
            target: 'CSS, SCSS, styled-components',
            description: 'Поиск файлов стилей для редактирования'
          }
        ]
      },
      debug: {
        response: `Начинаю отладку: "${request.message}".

🐛 Автоматический процесс отладки:
1. 🔍 Анализ кода на ошибки
2. 📋 Проверка логов и консоли
3. 🛠️ Исправление найденных проблем
4. ✅ Тестирование исправлений
5. 📊 Отчет о проделанной работе

Покажите проблемный код или выберите папку проекта!`,
        actions: [
          {
            type: 'run_error_check',
            target: 'ESLint, TypeScript, консоль браузера',
            description: 'Автоматическая проверка на ошибки'
          }
        ]
      },
      analyze: {
        response: `Провожу анализ: "${request.message}".

📊 Этапы автоматического анализа:
1. 📊 Сканирование структуры проекта
2. 🔍 Анализ качества кода
3. 📈 Оценка производительности
4. 🔒 Проверка безопасности
5. 💡 Рекомендации по улучшению

Выберите папку для полного анализа проекта!`,
        actions: [
          {
            type: 'full_project_scan',
            target: context.projectPath || 'Весь проект',
            description: 'Комплексный анализ проекта с рекомендациями'
          }
        ]
      },
      test: {
        response: `Создаю тесты: "${request.message}".

🧪 Автоматическое создание тестов:
1. 📝 Анализ функций и компонентов
2. 🧪 Генерация unit тестов
3. 🔄 Создание интеграционных тестов
4. ▶️ Запуск тестов
5. 📊 Отчет о покрытии

Укажите файлы или папку для создания тестов!`,
        actions: [
          {
            type: 'generate_tests',
            target: 'Функции и компоненты',
            description: 'Автоматическая генерация тестов'
          }
        ]
      },
      general: {
        response: `Понял ваш запрос: "${request.message}".

🤖 AI Agent готов к автоматической работе:
• 💻 Анализ и редактирование кода
• 🎨 Работа с дизайном и стилями  
• 🐛 Поиск и исправление ошибок
• 🧪 Создание и запуск тестов
• 🔍 Анализ проектов
• 🚀 Автоматическое развертывание

Просто выберите папку проекта и опишите, что нужно сделать!`,
        actions: [
          {
            type: 'await_project_selection',
            target: 'Файловый менеджер',
            description: 'Ожидание выбора проекта для работы'
          }
        ]
      }
    };

    const result = responses[taskType] || responses.general;
    
    return {
      response: result.response,
      actions: result.actions,
      confidence: 0.9,
      timestamp: new Date().toISOString(),
      agentUsed: request.selectedAgent || 'local-smart',
      taskType: taskType
    };
  }
}

const serverAI = new ServerAIManager();

// Handle AI Agents API
function handleAIAgents(req, res) {
  setCORSHeaders(res);
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.method === 'GET') {
    // Возвращаем список доступных AI агентов
    const agents = [
      {
        id: 'openai-gpt35',
        name: 'GPT-3.5 Turbo',
        provider: 'OpenAI',
        description: 'Быстрый и эффективный для кода и общих задач',
        capabilities: [
          { type: 'code', description: 'Написание и рефакторинг кода', strength: 4 },
          { type: 'debugging', description: 'Поиск и исправление ошибок', strength: 4 },
          { type: 'analysis', description: 'Анализ архитектуры проекта', strength: 3 },
          { type: 'general', description: 'Общие вопросы разработки', strength: 4 }
        ],
        isEnabled: true,
        isFree: true,
        model: 'gpt-3.5-turbo',
        maxTokens: 4096,
        temperature: 0.7
      },
      {
        id: 'google-gemini-flash',
        name: 'Gemini 1.5 Flash',
        provider: 'Google',
        description: 'Быстрый и бесплатный для большинства задач',
        capabilities: [
          { type: 'code', description: 'Современные фреймворки и языки', strength: 4 },
          { type: 'analysis', description: 'Анализ больших кодовых баз', strength: 4 },
          { type: 'design', description: 'UI/UX рекомендации', strength: 3 },
          { type: 'general', description: 'Универсальный помощник', strength: 4 }
        ],
        isEnabled: false,
        isFree: true,
        model: 'gemini-1.5-flash',
        maxTokens: 8192,
        temperature: 0.6
      },
      {
        id: 'huggingface-codellama',
        name: 'Code Llama',
        provider: 'Hugging Face',
        description: 'Специализируется на коде и программировании',
        capabilities: [
          { type: 'code', description: 'Генерация и завершение кода', strength: 5 },
          { type: 'debugging', description: 'Исправление синтаксических ошибок', strength: 4 },
          { type: 'analysis', description: 'Понимание структуры кода', strength: 4 },
          { type: 'testing', description: 'Генерация тестов', strength: 3 }
        ],
        isEnabled: false,
        isFree: true,
        model: 'codellama/CodeLlama-7b-Instruct-hf',
        maxTokens: 2048,
        temperature: 0.3
      }
    ];
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ agents }));
    return;
  }
  
  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}

// Handle AI Chat API
function handleAIChat(req, res) {
  setCORSHeaders(res);
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { message, selectedAgent, context } = data;
        
        if (!message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Message is required' }));
          return;
        }
        
        const request = {
          message,
          selectedAgent: selectedAgent || 'local-smart',
          context: context || {}
        };
        
        // Используем новый AI Manager
        const aiResponse = await serverAI.callAI(request);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(aiResponse));
        
      } catch (error) {
        console.error('AI Chat Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Internal server error',
          response: 'Извините, произошла ошибка при обработке запроса. Попробуйте еще раз.',
          timestamp: new Date().toISOString(),
          type: 'error'
        }));
      }
    });
    return;
  }
  
  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}

function generateSmartResponse(message) {
  const request = {
    message: message,
    selectedAgent: 'local-smart',
    context: {}
  };
  
  const result = serverAI.generateSmartResponse(request);
  return result.response;
}

const PORT = 3001;
server.listen(PORT, () => {
  console.log('✅ Сервер запущен на http://localhost:' + PORT);
  console.log('🌐 Откройте браузер и перейдите по этому адресу');
  console.log('💡 Для остановки нажмите Ctrl+C');
  console.log('📁 Файловый менеджер: можно выбирать папки на компьютере');
});

// Обработка закрытия
process.on('SIGINT', () => {
  console.log('\n👋 Сервер остановлен');
  process.exit(0);
});
