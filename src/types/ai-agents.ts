export interface AIAgent {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: AICapability[];
  isEnabled: boolean;
  isFree: boolean;
  apiEndpoint?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AICapability {
  type: 'code' | 'design' | 'analysis' | 'debugging' | 'testing' | 'ssh' | 'general';
  description: string;
  strength: 1 | 2 | 3 | 4 | 5; // 1-слабо, 5-отлично
}

export interface AIProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  requiresApiKey: boolean;
  freeModels: string[];
  paidModels: string[];
}

export interface AIRequest {
  message: string;
  context?: {
    projectPath?: string;
    fileContent?: string;
    errorLogs?: string;
    taskType?: 'code' | 'design' | 'debug' | 'analyze' | 'test';
  };
  selectedAgent: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  response: string;
  actions?: AIAction[];
  confidence: number;
  timestamp: string;
  agentUsed: string;
  tokensUsed?: number;
}

export interface AIAction {
  type: 'edit_file' | 'create_file' | 'delete_file' | 'run_command' | 'install_package';
  target: string;
  content?: string;
  command?: string;
  description: string;
}

// Предустановленные бесплатные AI агенты
export const FREE_AI_AGENTS: AIAgent[] = [
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
    id: 'anthropic-claude-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    description: 'Отличный для анализа кода и безопасности',
    capabilities: [
      { type: 'code', description: 'Качественный код с фокусом на безопасность', strength: 5 },
      { type: 'analysis', description: 'Глубокий анализ кода', strength: 5 },
      { type: 'debugging', description: 'Поиск уязвимостей и багов', strength: 4 },
      { type: 'general', description: 'Техническое консультирование', strength: 4 }
    ],
    isEnabled: false,
    isFree: true,
    model: 'claude-3-haiku-20240307',
    maxTokens: 4096,
    temperature: 0.5
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
    id: 'cohere-command',
    name: 'Cohere Command',
    provider: 'Cohere',
    description: 'Хорош для рефакторинга и оптимизации',
    capabilities: [
      { type: 'code', description: 'Рефакторинг и оптимизация', strength: 4 },
      { type: 'analysis', description: 'Анализ производительности', strength: 3 },
      { type: 'debugging', description: 'Логические ошибки', strength: 3 },
      { type: 'general', description: 'Техническая документация', strength: 3 }
    ],
    isEnabled: false,
    isFree: true,
    model: 'command',
    maxTokens: 4096,
    temperature: 0.5
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
  },
  {
    id: 'mistral-7b',
    name: 'Mistral 7B',
    provider: 'Mistral AI',
    description: 'Легкий и быстрый для простых задач',
    capabilities: [
      { type: 'code', description: 'Базовое программирование', strength: 3 },
      { type: 'general', description: 'Общие вопросы', strength: 3 },
      { type: 'analysis', description: 'Простой анализ кода', strength: 2 },
      { type: 'debugging', description: 'Базовая отладка', strength: 2 }
    ],
    isEnabled: false,
    isFree: true,
    model: 'mistral-7b-instruct',
    maxTokens: 2048,
    temperature: 0.4
  }
];

export const AI_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    requiresApiKey: true,
    freeModels: [], // Требует API ключ, но есть бесплатный tier
    paidModels: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    requiresApiKey: true,
    freeModels: [],
    paidModels: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229']
  },
  {
    id: 'google',
    name: 'Google AI',
    baseUrl: 'https://generativelanguage.googleapis.com/v1',
    requiresApiKey: true,
    freeModels: ['gemini-1.5-flash'],
    paidModels: ['gemini-1.5-pro']
  },
  {
    id: 'cohere',
    name: 'Cohere',
    baseUrl: 'https://api.cohere.ai/v1',
    requiresApiKey: true,
    freeModels: ['command'],
    paidModels: ['command-r', 'command-r-plus']
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    baseUrl: 'https://api-inference.huggingface.co/models',
    requiresApiKey: true,
    freeModels: ['codellama/CodeLlama-7b-Instruct-hf', 'mistralai/Mistral-7B-Instruct-v0.1'],
    paidModels: []
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434/api',
    requiresApiKey: false,
    freeModels: ['llama2', 'codellama', 'mistral'],
    paidModels: []
  }
];
