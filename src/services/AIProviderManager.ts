import { AIAgent, AIRequest, AIResponse, AI_PROVIDERS, FREE_AI_AGENTS } from '../types/ai-agents';

export interface AIProviderCredentials {
  openai?: string;
  anthropic?: string;
  google?: string;
  cohere?: string;
  huggingface?: string;
}

export class AIProviderManager {
  private credentials: AIProviderCredentials = {};
  private agents: AIAgent[] = FREE_AI_AGENTS;

  constructor() {
    this.loadCredentials();
  }

  private loadCredentials() {
    // Загружаем API ключи из localStorage или переменных окружения
    const stored = localStorage.getItem('ai_credentials');
    if (stored) {
      try {
        this.credentials = JSON.parse(stored);
      } catch (e) {
        console.warn('Failed to parse stored AI credentials');
      }
    }
  }

  public setCredentials(credentials: Partial<AIProviderCredentials>) {
    this.credentials = { ...this.credentials, ...credentials };
    localStorage.setItem('ai_credentials', JSON.stringify(this.credentials));
  }

  public async sendRequest(request: AIRequest): Promise<AIResponse> {
    const agent = this.agents.find(a => a.id === request.selectedAgent);
    if (!agent) {
      throw new Error(`Agent ${request.selectedAgent} not found`);
    }

    try {
      const response = await this.callAIProvider(agent, request);
      return {
        response: response.content,
        actions: this.parseActions(response.content),
        confidence: response.confidence || 0.8,
        timestamp: new Date().toISOString(),
        agentUsed: agent.id,
        tokensUsed: response.tokensUsed
      };
    } catch (error) {
      console.error('AI Provider Error:', error);
      // Fallback к локальным ответам при ошибке
      return this.getFallbackResponse(request);
    }
  }

  private async callAIProvider(agent: AIAgent, request: AIRequest): Promise<{
    content: string;
    confidence?: number;
    tokensUsed?: number;
  }> {
    const provider = AI_PROVIDERS.find(p => agent.provider.toLowerCase().includes(p.id));
    if (!provider) {
      throw new Error(`Provider for ${agent.provider} not found`);
    }

    switch (provider.id) {
      case 'openai':
        return this.callOpenAI(agent, request);
      case 'anthropic':
        return this.callAnthropic(agent, request);
      case 'google':
        return this.callGoogle(agent, request);
      case 'cohere':
        return this.callCohere(agent, request);
      case 'huggingface':
        return this.callHuggingFace(agent, request);
      case 'ollama':
        return this.callOllama(agent, request);
      default:
        throw new Error(`Provider ${provider.id} not implemented`);
    }
  }

  private async callOpenAI(agent: AIAgent, request: AIRequest): Promise<{
    content: string;
    confidence?: number;
    tokensUsed?: number;
  }> {
    if (!this.credentials.openai) {
      throw new Error('OpenAI API key not provided');
    }

    const systemPrompt = this.buildSystemPrompt(request);
    const userPrompt = this.buildUserPrompt(request);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.credentials.openai}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: agent.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: request.maxTokens || agent.maxTokens || 4096,
        temperature: request.temperature || agent.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens
    };
  }

  private async callGoogle(agent: AIAgent, request: AIRequest): Promise<{
    content: string;
    confidence?: number;
    tokensUsed?: number;
  }> {
    if (!this.credentials.google) {
      throw new Error('Google AI API key not provided');
    }

    const prompt = this.buildSystemPrompt(request) + '\n\n' + this.buildUserPrompt(request);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${agent.model}:generateContent?key=${this.credentials.google}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: request.temperature || agent.temperature || 0.6,
            maxOutputTokens: request.maxTokens || agent.maxTokens || 8192,
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.candidates[0].content.parts[0].text,
      tokensUsed: data.usageMetadata?.totalTokenCount
    };
  }

  private async callHuggingFace(agent: AIAgent, request: AIRequest): Promise<{
    content: string;
    confidence?: number;
    tokensUsed?: number;
  }> {
    if (!this.credentials.huggingface) {
      throw new Error('Hugging Face API key not provided');
    }

    const prompt = this.buildSystemPrompt(request) + '\n\n' + this.buildUserPrompt(request);

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${agent.model}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.credentials.huggingface}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: request.maxTokens || agent.maxTokens || 2048,
            temperature: request.temperature || agent.temperature || 0.3,
            return_full_text: false
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: Array.isArray(data) ? data[0].generated_text : data.generated_text
    };
  }

  private async callAnthropic(agent: AIAgent, request: AIRequest): Promise<{
    content: string;
    confidence?: number;
    tokensUsed?: number;
  }> {
    if (!this.credentials.anthropic) {
      throw new Error('Anthropic API key not provided');
    }

    const systemPrompt = this.buildSystemPrompt(request);
    const userPrompt = this.buildUserPrompt(request);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.credentials.anthropic,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: agent.model || 'claude-3-haiku-20240307',
        max_tokens: request.maxTokens || agent.maxTokens || 4096,
        temperature: request.temperature || agent.temperature || 0.5,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      tokensUsed: data.usage?.total_tokens
    };
  }

  private async callCohere(agent: AIAgent, request: AIRequest): Promise<{
    content: string;
    confidence?: number;
    tokensUsed?: number;
  }> {
    if (!this.credentials.cohere) {
      throw new Error('Cohere API key not provided');
    }

    const prompt = this.buildSystemPrompt(request) + '\n\n' + this.buildUserPrompt(request);

    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.credentials.cohere}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: agent.model || 'command',
        prompt: prompt,
        max_tokens: request.maxTokens || agent.maxTokens || 4096,
        temperature: request.temperature || agent.temperature || 0.5,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cohere API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.generations[0].text
    };
  }

  private async callOllama(agent: AIAgent, request: AIRequest): Promise<{
    content: string;
    confidence?: number;
    tokensUsed?: number;
  }> {
    const systemPrompt = this.buildSystemPrompt(request);
    const userPrompt = this.buildUserPrompt(request);

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: agent.model || 'llama2',
        prompt: systemPrompt + '\n\n' + userPrompt,
        stream: false,
        options: {
          temperature: request.temperature || agent.temperature || 0.7,
          num_predict: request.maxTokens || agent.maxTokens || 2048
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.response
    };
  }

  private buildSystemPrompt(request: AIRequest): string {
    const basePrompt = `Ты AI Agent - автоматизированный помощник разработчика. 

Твоя задача:
1. Анализировать код и проекты
2. Автоматически находить и редактировать файлы
3. Исправлять ошибки
4. Предлагать улучшения
5. Генерировать конкретные действия для выполнения

Контекст задачи: ${request.context?.taskType || 'general'}

ВАЖНО: Всегда предлагай конкретные действия в формате:
ACTION: [тип действия]
TARGET: [файл или команда]
CONTENT: [содержимое или описание]
DESCRIPTION: [объяснение]

Доступные типы действий:
- edit_file: редактировать файл
- create_file: создать новый файл
- delete_file: удалить файл
- run_command: выполнить команду
- install_package: установить пакет`;

    if (request.context?.projectPath) {
      return basePrompt + `\n\nПуть к проекту: ${request.context.projectPath}`;
    }

    return basePrompt;
  }

  private buildUserPrompt(request: AIRequest): string {
    let prompt = `Запрос пользователя: ${request.message}`;

    if (request.context?.fileContent) {
      prompt += `\n\nСодержимое файла:\n${request.context.fileContent}`;
    }

    if (request.context?.errorLogs) {
      prompt += `\n\nЛоги ошибок:\n${request.context.errorLogs}`;
    }

    return prompt;
  }

  private parseActions(content: string): any[] {
    const actions = [];
    const lines = content.split('\n');
    
    let currentAction: any = {};
    
    for (const line of lines) {
      if (line.startsWith('ACTION:')) {
        if (currentAction.type) {
          actions.push(currentAction);
        }
        currentAction = { type: line.replace('ACTION:', '').trim() };
      } else if (line.startsWith('TARGET:')) {
        currentAction.target = line.replace('TARGET:', '').trim();
      } else if (line.startsWith('CONTENT:')) {
        currentAction.content = line.replace('CONTENT:', '').trim();
      } else if (line.startsWith('DESCRIPTION:')) {
        currentAction.description = line.replace('DESCRIPTION:', '').trim();
      }
    }
    
    if (currentAction.type) {
      actions.push(currentAction);
    }
    
    return actions;
  }

  private getFallbackResponse(request: AIRequest): AIResponse {
    const fallbackResponses = {
      code: 'Я готов помочь с анализом и редактированием кода. Покажите мне файлы проекта через файловый менеджер.',
      design: 'Для работы с дизайном мне нужно увидеть CSS файлы и компоненты. Выберите файлы в файловом менеджере.',
      debug: 'Для отладки покажите мне код с ошибками и логи. Я найду проблемы и предложу исправления.',
      analyze: 'Выберите папку с проектом, и я проанализирую его структуру и предложу улучшения.',
      test: 'Покажите мне код, для которого нужны тесты, и я создам соответствующие тестовые файлы.',
      general: `Понял ваш запрос: "${request.message}". Для полноценной работы мне нужны API ключи от AI провайдеров. Пока что я работаю в базовом режиме.`
    };

    const taskType = request.context?.taskType || 'general';
    
    return {
      response: fallbackResponses[taskType] || fallbackResponses.general,
      actions: [],
      confidence: 0.3,
      timestamp: new Date().toISOString(),
      agentUsed: request.selectedAgent,
      tokensUsed: 0
    };
  }

  public getAvailableAgents(): AIAgent[] {
    return this.agents;
  }

  public isAgentAvailable(agentId: string): boolean {
    const agent = this.agents.find(a => a.id === agentId);
    if (!agent) return false;

    // Проверяем наличие необходимых API ключей
    const provider = AI_PROVIDERS.find(p => agent.provider.toLowerCase().includes(p.id));
    if (!provider) return false;

    if (!provider.requiresApiKey) return true;

    switch (provider.id) {
      case 'openai':
        return !!this.credentials.openai;
      case 'anthropic':
        return !!this.credentials.anthropic;
      case 'google':
        return !!this.credentials.google;
      case 'cohere':
        return !!this.credentials.cohere;
      case 'huggingface':
        return !!this.credentials.huggingface;
      default:
        return false;
    }
  }
}

export const aiProviderManager = new AIProviderManager();
