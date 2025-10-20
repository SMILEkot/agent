import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron';
import { join } from 'path';
import { readdir, readFile, writeFile, stat, mkdir } from 'fs/promises';
import { NodeSSH } from 'node-ssh';

const isDev = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow;

function createWindow(): void {
  // Создаем главное окно приложения
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'default',
    show: false,
  });

  // Загружаем приложение
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  // Показываем окно когда оно готово
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Создаем меню
  createMenu();
}

function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Файл',
      submenu: [
        {
          label: 'Выбрать папку проекта',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            selectProjectFolder();
          },
        },
        { type: 'separator' },
        {
          label: 'Выход',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Вид',
      submenu: [
        { role: 'reload', label: 'Перезагрузить' },
        { role: 'forceReload', label: 'Принудительная перезагрузка' },
        { role: 'toggleDevTools', label: 'Инструменты разработчика' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Сбросить масштаб' },
        { role: 'zoomIn', label: 'Увеличить' },
        { role: 'zoomOut', label: 'Уменьшить' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Полный экран' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Обработчики IPC
async function selectProjectFolder(): Promise<void> {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Выберите папку проекта',
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const folderPath = result.filePaths[0];
    mainWindow.webContents.send('project-folder-selected', folderPath);
  }
}

// Файловые операции
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Выберите папку проекта',
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('read-directory', async (_, dirPath: string) => {
  try {
    const items = await readdir(dirPath, { withFileTypes: true });
    const result = [];

    for (const item of items) {
      const fullPath = join(dirPath, item.name);
      const stats = await stat(fullPath);
      
      result.push({
        name: item.name,
        path: fullPath,
        isDirectory: item.isDirectory(),
        size: stats.size,
        modified: stats.mtime,
      });
    }

    return result;
  } catch (error) {
    console.error('Error reading directory:', error);
    throw error;
  }
});

ipcMain.handle('read-file', async (_, filePath: string) => {
  try {
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
});

ipcMain.handle('write-file', async (_, filePath: string, content: string) => {
  try {
    await writeFile(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing file:', error);
    throw error;
  }
});

// SSH операции
const sshConnections = new Map<string, NodeSSH>();

ipcMain.handle('ssh-connect', async (_, config: {
  host: string;
  username: string;
  password?: string;
  privateKey?: string;
  port?: number;
}) => {
  try {
    const ssh = new NodeSSH();
    const connectionId = `${config.host}:${config.port || 22}:${config.username}`;
    
    await ssh.connect({
      host: config.host,
      username: config.username,
      password: config.password,
      privateKey: config.privateKey,
      port: config.port || 22,
    });

    sshConnections.set(connectionId, ssh);
    return { success: true, connectionId };
  } catch (error) {
    console.error('SSH connection error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ssh-execute', async (_, connectionId: string, command: string) => {
  try {
    const ssh = sshConnections.get(connectionId);
    if (!ssh) {
      throw new Error('SSH connection not found');
    }

    const result = await ssh.execCommand(command);
    return {
      success: true,
      stdout: result.stdout,
      stderr: result.stderr,
      code: result.code,
    };
  } catch (error) {
    console.error('SSH execute error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ssh-disconnect', async (_, connectionId: string) => {
  try {
    const ssh = sshConnections.get(connectionId);
    if (ssh) {
      ssh.dispose();
      sshConnections.delete(connectionId);
    }
    return { success: true };
  } catch (error) {
    console.error('SSH disconnect error:', error);
    return { success: false, error: error.message };
  }
});

// События приложения
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Закрываем все SSH соединения
  sshConnections.forEach(ssh => ssh.dispose());
  sshConnections.clear();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Закрываем все SSH соединения перед выходом
  sshConnections.forEach(ssh => ssh.dispose());
  sshConnections.clear();
});
