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
function generateSmartResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  // Контекстные ответы
  if (lowerMessage.includes("файл") || lowerMessage.includes("папк")) {
    return "Для работы с файлами используйте файловый менеджер. Я могу помочь проанализировать код, найти ошибки или объяснить структуру проекта.";
  }
  
  if (lowerMessage.includes("код") || lowerMessage.includes("программ")) {
    return "Я могу помочь с анализом кода! Покажите мне файл через файловый менеджер, и я объясню его структуру, найду потенциальные проблемы или предложу улучшения.";
  }
  
  if (lowerMessage.includes("терминал") || lowerMessage.includes("команд")) {
    return "Используйте вкладку Terminal для выполнения команд. Доступны безопасные команды: ls, pwd, whoami, date, uname, df, free, ps, cat, head, tail, wc, grep, find, tree.";
  }
  
  if (lowerMessage.includes("помощь") || lowerMessage.includes("help")) {
    return "Я AI Agent! Могу помочь с:\n• 📁 Анализом файлов и кода\n• 💻 Выполнением команд в терминале\n• 🔍 Поиском и объяснением информации\n• 🛠️ Решением технических задач\n\nЧто вас интересует?";
  }
  
  if (lowerMessage.includes("привет") || lowerMessage.includes("hello")) {
    return "Привет! Я AI Agent - ваш помощник для работы с файлами и кодом. Чем могу помочь?";
  }
  
  // Общие ответы
  const responses = [
    `Интересный вопрос о "${message}". Я готов помочь с анализом файлов, выполнением команд или объяснением технических концепций.`,
    `Понял ваш запрос: "${message}". Используйте файловый менеджер и терминал для практической работы, а я помогу с анализом.`,
    `"${message}" - хорошая тема! Я могу помочь найти информацию, проанализировать код или выполнить команды. Что конкретно нужно?`,
    `Спасибо за вопрос о "${message}". Как AI Agent, я специализируюсь на работе с файлами, кодом и системными задачах. Чем помочь?`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
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
