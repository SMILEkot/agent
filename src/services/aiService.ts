import OpenAI from 'openai'
import { AIConfig, AIResponse, FileOperation } from '../types/ai'

class AIService {
  private openai: OpenAI | null = null
  private anthropicApiKey: string | null = null

  private initializeOpenAI(apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // Note: In production, use a proxy server
    })
  }

  async sendMessage(message: string, config: AIConfig): Promise<AIResponse> {
    try {
      if (config.provider === 'openai') {
        return await this.sendOpenAIMessage(message, config)
      } else if (config.provider === 'anthropic') {
        return await this.sendAnthropicMessage(message, config)
      } else {
        throw new Error('Unsupported AI provider')
      }
    } catch (error) {
      console.error('AI Service Error:', error)
      throw new Error(`AI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async sendOpenAIMessage(message: string, config: AIConfig): Promise<AIResponse> {
    if (!this.openai || this.openai.apiKey !== config.apiKey) {
      this.initializeOpenAI(config.apiKey)
    }

    const systemPrompt = `You are an AI assistant that helps manage files and code. You can:
1. Create new files with appropriate content
2. Edit existing files
3. Delete files
4. Rename files
5. Read and explain file contents

When the user asks you to perform file operations, respond with:
1. A helpful message explaining what you're doing
2. The actual file operations in a structured format

For file operations, use this JSON structure in your response:
\`\`\`json
{
  "operations": [
    {
      "type": "create|edit|delete|rename|read",
      "path": "file/path",
      "content": "file content (for create/edit)",
      "newPath": "new/path (for rename)"
    }
  ]
}
\`\`\`

Always be helpful and explain what you're doing. If you're unsure about a file operation, ask for clarification.`

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
}

export const aiService = new AIService()

