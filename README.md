# 🤖 AI Agent

> **Chat with AI to manage files and code** - Современное веб-приложение для работы с ИИ

![AI Agent](https://img.shields.io/badge/AI-Agent-blue?style=for-the-badge&logo=openai)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

## ✨ Features

### 🤖 **AI Chat Interface**
- **Natural Language Commands** - Talk to AI like you would to a human developer
- **Multiple AI Providers** - Support for OpenAI (GPT-3.5, GPT-4) and Anthropic (Claude 3)
- **Message History** - Full conversation history with Markdown support
- **Real-time Responses** - Streaming responses with typing indicators

### 📁 **Smart File Manager**
- **Tree View** - Navigate your project structure intuitively
- **File Operations** - Create, edit, delete, and rename files through AI commands
- **File Type Recognition** - Color-coded files by type with appropriate icons
- **Real-time Updates** - File system watching for instant updates

### 📝 **Integrated Code Editor**
- **Syntax Highlighting** - Support for 20+ programming languages
- **Edit Mode** - Direct file editing with save functionality
- **File Information** - Line count, character count, and file stats
- **Monaco Editor** - VS Code-like editing experience

### ⚡ **AI-Powered File Operations**
- **"Create a React component called Button"** - AI creates the file with proper structure
- **"Edit package.json to add lodash"** - AI modifies files intelligently
- **"Show me the contents of App.tsx"** - AI displays and explains code
- **"Delete old unused files"** - AI helps clean up your project

### 🎯 **Multiple View Modes**
1. **Split View** - Files, editor, and chat simultaneously
2. **Chat Only** - Focus on AI conversation
3. **Files Only** - File browser mode
4. **Editor Only** - Code editing mode

## 🚀 Быстрый запуск на Windows

### Первый запуск:

1. **Скачайте проект** и распакуйте в любую папку
2. **Дважды кликните на `setup.bat`** - это установит все необходимые зависимости
3. **Дважды кликните на `start.bat`** - это запустит приложение

Приложение откроется в браузере по адресу: `http://localhost:5173`

### Ежедневное использование:

- **`start.bat`** - Запуск приложения одной кнопкой ✨

### Требования:
- **Windows 7/10/11**
- **Node.js** (будет предложено установить при первом запуске)
- **Современный браузер** (Chrome, Firefox, Edge)

### 🔧 Configuration

1. **Open Settings** (⚙️ in sidebar)
2. **Go to AI Configuration**
3. **Choose your AI provider:**
   - **OpenAI**: Get API key from [platform.openai.com](https://platform.openai.com/api-keys)
   - **Anthropic**: Get API key from [console.anthropic.com](https://console.anthropic.com/)
4. **Select model and configure parameters**
5. **Start chatting with your AI agent!**

## 💬 Example Commands

```
🤖 "Create a new React component called UserProfile with TypeScript"
🤖 "Add a new dependency 'axios' to package.json"
🤖 "Show me all TypeScript files in the src folder"
🤖 "Create a utils folder with a helper function for date formatting"
🤖 "Edit the main App component to include routing"
🤖 "Delete all .log files from the project"
```

## 🛠️ Доступные скрипты

| Файл | Описание |
|------|----------|
| `setup.bat` | 🔧 Первоначальная настройка (запустить один раз) |
| `start.bat` | 🚀 Запуск приложения в режиме разработки |
| `build.bat` | 🔨 Сборка для продакшена |
| `serve.bat` | 📦 Запуск собранной версии |

### Команды npm:

- `npm run dev` - Запуск в режиме разработки
- `npm run build` - Сборка для продакшена
- `npm run preview` - Запуск собранной версии
- `npm run lint` - Проверка кода

### Project Structure

```
agent/
├── src/
│   ├── components/          # React components
│   │   ├── AIChat.tsx      # AI chat interface
│   │   ├── FileManager.tsx # File tree browser
│   │   ├── CodeEditor.tsx  # Code editor with syntax highlighting
│   │   └── ...
│   ├── pages/              # Application pages
│   │   ├── AIAgent.tsx     # Main AI agent page
│   │   ├── Settings.tsx    # Configuration page
│   │   └── ...
│   ├── services/           # Business logic
│   │   ├── aiService.ts    # AI API integration
│   │   ├── fileService.ts  # File system operations
│   │   └── ...
│   ├── store/              # State management (Zustand)
│   ├── types/              # TypeScript definitions
│   └── electron/           # Electron main process
│       ├── main.ts         # Main Electron process
│       └── preload.ts      # Preload script
├── assets/                 # App icons and resources
└── dist/                   # Built files
```

## 🎨 Технологии

- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Сборщик**: Vite
- **Состояние**: Zustand
- **Редактор**: Monaco Editor (движок VS Code)
- **Подсветка**: React Syntax Highlighter
- **AI**: OpenAI API + Anthropic API
- **Анимации**: Framer Motion

## 🐛 Решение проблем

### Приложение не запускается:
1. Убедитесь, что установлен Node.js
2. Запустите `setup.bat` от имени администратора
3. Проверьте подключение к интернету

### Ошибки при установке:
```bash
npm cache clean --force
npm install
```

### Порт занят:
Если порт 5173 занят, приложение автоматически выберет другой порт.

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте, что все файлы `.bat` находятся в корневой папке проекта
2. Убедитесь, что установлена последняя версия Node.js
3. Попробуйте запустить от имени администратора

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for GPT models
- **Anthropic** for Claude models
- **Electron** team for the desktop framework
- **React** team for the UI library
- **Monaco Editor** for the code editing experience

---

**Приятного использования! 🎉**

*Создано с ❤️ для удобной работы с AI!* 🚀
