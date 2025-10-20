import { SSHConfig, SSHResult } from '../types/electron';

export class SSHService {
  private connections = new Map<string, string>();

  async connect(config: SSHConfig): Promise<SSHResult> {
    if (!window.electronAPI) {
      return { success: false, error: 'Electron API не доступен' };
    }

    try {
      const result = await window.electronAPI.sshConnect(config);
      
      if (result.success && result.connectionId) {
        this.connections.set(config.host, result.connectionId);
      }
      
      return result;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
      };
    }
  }

  async execute(host: string, command: string): Promise<SSHResult> {
    if (!window.electronAPI) {
      return { success: false, error: 'Electron API не доступен' };
    }

    const connectionId = this.connections.get(host);
    if (!connectionId) {
      return { success: false, error: 'SSH соединение не найдено' };
    }

    try {
      return await window.electronAPI.sshExecute(connectionId, command);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
      };
    }
  }

  async disconnect(host: string): Promise<SSHResult> {
    if (!window.electronAPI) {
      return { success: false, error: 'Electron API не доступен' };
    }

    const connectionId = this.connections.get(host);
    if (!connectionId) {
      return { success: true }; // Уже отключен
    }

    try {
      const result = await window.electronAPI.sshDisconnect(connectionId);
      if (result.success) {
        this.connections.delete(host);
      }
      return result;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
      };
    }
  }

  isConnected(host: string): boolean {
    return this.connections.has(host);
  }

  getConnectedHosts(): string[] {
    return Array.from(this.connections.keys());
  }

  // Предустановленные команды для настройки Ubuntu сервера
  async installNodeJS(host: string): Promise<SSHResult> {
    const commands = [
      'curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -',
      'sudo apt-get install -y nodejs',
      'node --version && npm --version'
    ];

    for (const command of commands) {
      const result = await this.execute(host, command);
      if (!result.success) {
        return result;
      }
    }

    return { success: true, stdout: 'Node.js успешно установлен' };
  }

  async installDocker(host: string): Promise<SSHResult> {
    const commands = [
      'sudo apt-get update',
      'sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release',
      'curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg',
      'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null',
      'sudo apt-get update',
      'sudo apt-get install -y docker-ce docker-ce-cli containerd.io',
      'sudo usermod -aG docker $USER',
      'docker --version'
    ];

    for (const command of commands) {
      const result = await this.execute(host, command);
      if (!result.success) {
        return result;
      }
    }

    return { success: true, stdout: 'Docker успешно установлен' };
  }

  async installNginx(host: string): Promise<SSHResult> {
    const commands = [
      'sudo apt-get update',
      'sudo apt-get install -y nginx',
      'sudo systemctl start nginx',
      'sudo systemctl enable nginx',
      'sudo systemctl status nginx'
    ];

    for (const command of commands) {
      const result = await this.execute(host, command);
      if (!result.success) {
        return result;
      }
    }

    return { success: true, stdout: 'Nginx успешно установлен и запущен' };
  }

  async updateSystem(host: string): Promise<SSHResult> {
    const commands = [
      'sudo apt-get update',
      'sudo apt-get upgrade -y',
      'sudo apt-get autoremove -y',
      'sudo apt-get autoclean'
    ];

    for (const command of commands) {
      const result = await this.execute(host, command);
      if (!result.success) {
        return result;
      }
    }

    return { success: true, stdout: 'Система успешно обновлена' };
  }

  async getSystemInfo(host: string): Promise<SSHResult> {
    const commands = [
      'uname -a',
      'lsb_release -a',
      'df -h',
      'free -h',
      'ps aux --sort=-%cpu | head -10'
    ];

    let output = '';
    for (const command of commands) {
      const result = await this.execute(host, command);
      if (result.success) {
        output += `\n=== ${command} ===\n${result.stdout}\n`;
      }
    }

    return { success: true, stdout: output };
  }
}

export const sshService = new SSHService();
