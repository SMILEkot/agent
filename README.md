# 🤖 AI Agent Desktop App

> **Chat with AI to manage files and code** - A modern desktop application powered by Electron, React, and AI

![AI Agent](https://img.shields.io/badge/AI-Agent-blue?style=for-the-badge&logo=openai)
![Electron](https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

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

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ 
- **npm** or **yarn**
- **AI API Key** (OpenAI or Anthropic)

### Installation

```bash
# Clone the repository
git clone https://github.com/SMILEkot/agent.git
cd agent

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open in a new Electron window automatically!

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

## 🛠 Development

### Available Scripts

- `npm run dev` - Start development (React + Electron)
- `npm run dev:react` - Start only React dev server
- `npm run build` - Build for production
- `npm run dist` - Create distributable packages
- `npm run lint` - Run ESLint

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

## 🎨 Tech Stack

- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Desktop**: Electron 28
- **State Management**: Zustand
- **Code Editor**: Monaco Editor (VS Code engine)
- **Syntax Highlighting**: Prism.js
- **AI Integration**: OpenAI API + Anthropic API
- **Build Tool**: Vite
- **Animations**: Framer Motion

## 📦 Building for Production

### Create distributable packages:

```bash
# Build for current platform
npm run dist

# Build for specific platforms
npm run dist:win    # Windows
npm run dist:mac    # macOS
npm run dist:linux  # Linux
```

Built packages will be in the `release/` directory.

## 🔒 Security

- **Secure IPC** - All file operations go through secure Electron IPC
- **API Key Protection** - Keys stored securely in Electron's safe storage
- **Sandboxed Renderer** - React app runs in sandboxed environment
- **No Node.js in Renderer** - Clean separation of concerns

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

**Made with ❤️ by [SMILEkot](https://github.com/SMILEkot)**

*Transform your development workflow with AI-powered file management!* 🚀

