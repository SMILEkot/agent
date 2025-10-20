import { FileNode, FileOperation } from '../types/ai'

class FileService {
  private isElectron(): boolean {
    return typeof window !== 'undefined' && window.electronAPI !== undefined
  }

  async getFileTree(path: string = ''): Promise<FileNode[]> {
    if (this.isElectron()) {
      return await window.electronAPI.readDirectory(path)
    } else {
      // Mock data for web version
      return this.getMockFileTree()
    }
  }

  async readFile(path: string): Promise<string> {
    if (this.isElectron()) {
      return await window.electronAPI.readFile(path)
    } else {
      // Mock data for web version
      return this.getMockFileContent(path)
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (this.isElectron()) {
      await window.electronAPI.writeFile(path, content)
    } else {
      console.log('Mock: Writing file', path, content)
    }
  }

  async deleteFile(path: string): Promise<void> {
    if (this.isElectron()) {
      await window.electronAPI.deleteFile(path)
    } else {
      console.log('Mock: Deleting file', path)
    }
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    if (this.isElectron()) {
      await window.electronAPI.renameFile(oldPath, newPath)
    } else {
      console.log('Mock: Renaming file', oldPath, 'to', newPath)
    }
  }

  async createDirectory(path: string): Promise<void> {
    if (this.isElectron()) {
      await window.electronAPI.createDirectory(path)
    } else {
      console.log('Mock: Creating directory', path)
    }
  }

  async executeOperation(operation: FileOperation): Promise<void> {
    switch (operation.type) {
      case 'create':
        if (operation.content !== undefined) {
          await this.writeFile(operation.path, operation.content)
        }
        break
      case 'edit':
        if (operation.content !== undefined) {
          await this.writeFile(operation.path, operation.content)
        }
        break
      case 'delete':
        await this.deleteFile(operation.path)
        break
      case 'rename':
        if (operation.newPath) {
          await this.renameFile(operation.path, operation.newPath)
        }
        break
      case 'read':
        // Read operation doesn't modify files, just return content
        return
      default:
        throw new Error(`Unknown operation type: ${(operation as any).type}`)
    }
  }

  // Mock data for web version
  private getMockFileTree(): FileNode[] {
    return [
      {
        name: 'src',
        path: 'src',
        type: 'directory',
        modified: new Date(),
        children: [
          {
            name: 'components',
            path: 'src/components',
            type: 'directory',
            modified: new Date(),
          },
          {
            name: 'pages',
            path: 'src/pages',
            type: 'directory',
            modified: new Date(),
          },
          {
            name: 'App.tsx',
            path: 'src/App.tsx',
            type: 'file',
            size: 1234,
            modified: new Date(),
          },
          {
            name: 'main.tsx',
            path: 'src/main.tsx',
            type: 'file',
            size: 567,
            modified: new Date(),
          },
        ],
      },
      {
        name: 'package.json',
        path: 'package.json',
        type: 'file',
        size: 2345,
        modified: new Date(),
      },
      {
        name: 'README.md',
        path: 'README.md',
        type: 'file',
        size: 1567,
        modified: new Date(),
      },
    ]
  }

  private getMockFileContent(path: string): string {
    const mockContents: Record<string, string> = {
      'src/App.tsx': `import React from 'react'
import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <div className="App">
      <h1>AI Agent Desktop App</h1>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </div>
  )
}

export default App`,
      'package.json': `{
  "name": "ai-agent-desktop",
  "version": "1.0.0",
  "description": "AI Agent Desktop App",
  "main": "dist/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}`,
      'README.md': `# AI Agent Desktop App

A modern desktop application that lets you chat with AI to manage files and code.

## Features

- AI-powered file management
- Code editor with syntax highlighting
- File tree browser
- Multiple AI providers support

## Getting Started

1. Install dependencies: \`npm install\`
2. Start development: \`npm run dev\`
3. Configure AI settings
4. Start chatting with your AI agent!
`,
    }

    return mockContents[path] || `// Mock content for ${path}\n\nThis is placeholder content for the file.`
  }
}

export const fileService = new FileService()

