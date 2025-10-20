import OpenAI from 'openai'
import { AIConfig, AIResponse, FileOperation } from '../types/ai'
import { AI_CONFIG, checkAIAvailability } from '../config/aiConfig'

class AIService {
  private openai: OpenAI | null = null
  private currentProvider: string = 'local'
  private currentModel: string = 'basic-assistant'
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Автоматически определяем доступный AI сервис
    const availability = await checkAIAvailability();
    
    this.currentProvider = availability.provider;
    this.currentModel = availability.model;

    if (availability.provider === 'openai' && AI_CONFIG.apiKey !== 'demo-key') {
      this.openai = new OpenAI({
        apiKey: AI_CONFIG.apiKey,
        dangerouslyAllowBrowser: true
      });
    } else if (availability.provider === 'ollama') {
      this.openai = new OpenAI({
        baseURL: 'http://localhost:11434/v1',
        apiKey: 'ollama',
        dangerouslyAllowBrowser: true
      });
    }

    this.initialized = true;
    console.log(`AI сервис инициализирован: ${availability.provider} (${availability.model})`);
  }

  async sendMessage(message: string, config?: AIConfig): Promise<AIResponse> {
    await this.initialize();

    try {
      // Используем автоматическую конфигурацию если не передана
      const effectiveConfig = config || {
        provider: this.currentProvider as any,
        apiKey: AI_CONFIG.apiKey,
        model: this.currentModel,
        temperature: AI_CONFIG.temperature,
        maxTokens: AI_CONFIG.maxTokens,
      };

      if (this.currentProvider === 'local' || !this.openai) {
        return this.getBasicResponse(message);
      }

      if (this.currentProvider === 'openai' || this.currentProvider === 'ollama') {
        return await this.sendOpenAIMessage(message, effectiveConfig);
      }

      throw new Error('Неподдерживаемый AI провайдер');
    } catch (error) {
      console.error('AI Service Error:', error);
      // Fallback к базовому ассистенту при ошибке
      return this.getBasicResponse(message);
    }
  }

  private getBasicResponse(message: string): AIResponse {
    const lowerMessage = message.toLowerCase();
    let responseMessage = '';
    const operations: FileOperation[] = [];
    
    if (lowerMessage.includes('создай') || lowerMessage.includes('create')) {
      responseMessage = '📁 Для создания файлов используйте файловый менеджер или редактор кода. Я могу помочь с содержимым файла.';
    } else if (lowerMessage.includes('файл') || lowerMessage.includes('file')) {
      responseMessage = '📁 Для работы с файлами используйте файловый менеджер слева. Вы можете открывать, редактировать и создавать файлы.';
    } else if (lowerMessage.includes('ssh') || lowerMessage.includes('сервер')) {
      responseMessage = '🔌 Для подключения к серверу перейдите в раздел "SSH Terminal" и введите данные для подключения.';
    } else if (lowerMessage.includes('ubuntu') || lowerMessage.includes('linux')) {
      responseMessage = `🐧 Для настройки Ubuntu сервера:
1. Подключитесь через SSH Terminal
2. Используйте готовые команды для установки ПО
3. Все команды выполняются автоматически!`;
    } else {
      responseMessage = `🤖 Я базовый AI ассистент. Помогаю с:
• Управлением файлами и проектами
• SSH подключением к серверам  
• Настройкой Ubuntu серверов
• Редактированием кода

Для полной функциональности установите Ollama или настройте OpenAI API ключ.`;
    }

    return {
      message: responseMessage,
      operations
    };
  }

  private async sendOpenAIMessage(message: string, config: AIConfig): Promise<AIResponse> {
    if (!this.openai || this.openai.apiKey !== config.apiKey) {
      this.initializeOpenAI(config.apiKey)
    }

    const systemPrompt = AI_CONFIG.systemPrompt

    const response = await this.openai!.chat.completions.create({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    })

    const responseContent = response.choices[0]?.message?.content || ''
    
    // Try to extract operations from the response
    const operations = this.extractOperations(responseContent)
    
    return {
      message: responseContent,
      operations,
    }
  }

  private async sendAnthropicMessage(message: string, config: AIConfig): Promise<AIResponse> {
    // Note: This is a simplified implementation
    // In a real app, you'd use the official Anthropic SDK
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: [
          {
            role: 'user',
            content: `You are an AI assistant that helps manage files and code. ${message}`
          }
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`)
    }

    const data = await response.json()
    const responseContent = data.content[0]?.text || ''
    
    const operations = this.extractOperations(responseContent)
    
    return {
      message: responseContent,
      operations,
    }
  }

  private extractOperations(content: string): FileOperation[] {
    const operations: FileOperation[] = []
    
    // Look for JSON blocks in the response
    const jsonRegex = /```json\s*(\{[\s\S]*?\})\s*```/g
    let match
    
    while ((match = jsonRegex.exec(content)) !== null) {
      try {
        const parsed = JSON.parse(match[1])
        if (parsed.operations && Array.isArray(parsed.operations)) {
          operations.push(...parsed.operations)
        }
      } catch (error) {
        console.warn('Failed to parse operations JSON:', error)
      }
    }
    
    return operations
  }

  // Get available models for each provider
  getAvailableModels(provider: 'openai' | 'anthropic'): string[] {
    if (provider === 'openai') {
      return ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview']
    } else if (provider === 'anthropic') {
      return ['claude-3-sonnet-20240229', 'claude-3-opus-20240229', 'claude-3-haiku-20240307']
    }
    return []
  }

  // Новые методы для статуса AI сервиса
  isInitialized(): boolean {
    return this.initialized;
  }

  getProvider(): string {
    return this.currentProvider;
  }

  getModel(): string {
    return this.currentModel;
  }

  getStatus(): string {
    if (!this.initialized) return 'Не инициализирован';
    
    switch (this.currentProvider) {
      case 'openai':
        return `OpenAI (${this.currentModel})`;
      case 'ollama':
        return `Ollama (${this.currentModel})`;
      case 'local':
        return 'Базовый ассистент';
      default:
        return 'Неизвестный провайдер';
    }
  }
}

export const aiService = new AIService()
