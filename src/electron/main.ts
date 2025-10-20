import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import * as path from 'path'
import * as fs from 'fs/promises'
import * as fsSync from 'fs'
import { FileNode, FileOperation } from '../types/ai'

const isDev = process.env.NODE_ENV === 'development'

let mainWindow: BrowserWindow

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Current working directory
let currentDirectory = process.cwd()

// IPC Handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('get-platform', () => {
  return process.platform
})

ipcMain.handle('minimize-window', () => {
  mainWindow.minimize()
})

ipcMain.handle('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow.maximize()
  }
})

ipcMain.handle('close-window', () => {
  mainWindow.close()
})

ipcMain.handle('get-current-directory', () => {
  return currentDirectory
})

ipcMain.handle('set-current-directory', async (_, path: string) => {
  try {
    await fs.access(path)
    currentDirectory = path
    return true
  } catch {
    throw new Error('Directory does not exist')
  }
})

ipcMain.handle('read-directory', async (_, dirPath: string = ''): Promise<FileNode[]> => {
  try {
    const fullPath = path.resolve(currentDirectory, dirPath)
    const entries = await fs.readdir(fullPath, { withFileTypes: true })
    
    const nodes: FileNode[] = []
    
    for (const entry of entries) {
      // Skip hidden files and node_modules
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue
      }
      
      const entryPath = path.join(fullPath, entry.name)
      const relativePath = path.relative(currentDirectory, entryPath)
      const stats = await fs.stat(entryPath)
      
      const node: FileNode = {
        name: entry.name,
        path: relativePath,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: entry.isFile() ? stats.size : undefined,
        modified: stats.mtime,
      }
      
      // Load children for directories (only first level to avoid performance issues)
      if (entry.isDirectory() && dirPath === '') {
        try {
          const childEntries = await fs.readdir(entryPath, { withFileTypes: true })
          node.children = childEntries
            .filter(child => !child.name.startsWith('.') && child.name !== 'node_modules')
            .map(child => ({
              name: child.name,
              path: path.relative(currentDirectory, path.join(entryPath, child.name)),
              type: child.isDirectory() ? 'directory' : 'file',
            }))
        } catch {
          // Ignore errors when reading subdirectories
        }
      }
      
      nodes.push(node)
    }
    
    // Sort: directories first, then files, both alphabetically
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
  } catch (error) {
    console.error('Error reading directory:', error)
    throw new Error(`Failed to read directory: ${error}`)
  }
})

ipcMain.handle('read-file', async (_, filePath: string): Promise<string> => {
  try {
    const fullPath = path.resolve(currentDirectory, filePath)
    return await fs.readFile(fullPath, 'utf-8')
  } catch (error) {
    throw new Error(`Failed to read file: ${error}`)
  }
})

ipcMain.handle('write-file', async (_, filePath: string, content: string): Promise<void> => {
  try {
    const fullPath = path.resolve(currentDirectory, filePath)
    const dir = path.dirname(fullPath)
    
    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(fullPath, content, 'utf-8')
  } catch (error) {
    throw new Error(`Failed to write file: ${error}`)
  }
})

ipcMain.handle('delete-file', async (_, filePath: string): Promise<void> => {
  try {
    const fullPath = path.resolve(currentDirectory, filePath)
    const stats = await fs.stat(fullPath)
    
    if (stats.isDirectory()) {
      await fs.rmdir(fullPath, { recursive: true })
    } else {
      await fs.unlink(fullPath)
    }
  } catch (error) {
    throw new Error(`Failed to delete file: ${error}`)
  }
})

ipcMain.handle('rename-file', async (_, oldPath: string, newPath: string): Promise<void> => {
  try {
    const fullOldPath = path.resolve(currentDirectory, oldPath)
    const fullNewPath = path.resolve(currentDirectory, newPath)
    await fs.rename(fullOldPath, fullNewPath)
  } catch (error) {
    throw new Error(`Failed to rename file: ${error}`)
  }
})

ipcMain.handle('create-directory', async (_, dirPath: string): Promise<void> => {
  try {
    const fullPath = path.resolve(currentDirectory, dirPath)
    await fs.mkdir(fullPath, { recursive: true })
  } catch (error) {
    throw new Error(`Failed to create directory: ${error}`)
  }
})

ipcMain.handle('get-file-stats', async (_, filePath: string) => {
  try {
    const fullPath = path.resolve(currentDirectory, filePath)
    const stats = await fs.stat(fullPath)
    return {
      size: stats.size,
      modified: stats.mtime,
    }
  } catch {
    return null
  }
})

ipcMain.handle('show-open-dialog', async (_, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options)
  return result
})

ipcMain.handle('show-save-dialog', async (_, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options)
  return result
})

