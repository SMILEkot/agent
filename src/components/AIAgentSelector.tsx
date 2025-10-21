import React, { useState, useEffect } from 'react';
import { FREE_AI_AGENTS, AIAgent, AICapability } from '../types/ai-agents';

interface AIAgentSelectorProps {
  selectedAgents: string[];
  onAgentsChange: (agents: string[]) => void;
  onPrimaryAgentChange: (agentId: string) => void;
  primaryAgent: string;
}

const AIAgentSelector: React.FC<AIAgentSelectorProps> = ({
  selectedAgents,
  onAgentsChange,
  onPrimaryAgentChange,
  primaryAgent
}) => {
  const [agents, setAgents] = useState<AIAgent[]>(FREE_AI_AGENTS);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const handleAgentToggle = (agentId: string) => {
    const newSelectedAgents = selectedAgents.includes(agentId)
      ? selectedAgents.filter(id => id !== agentId)
      : [...selectedAgents, agentId];
    
    onAgentsChange(newSelectedAgents);
    
    // Если убираем основного агента, выбираем первого из оставшихся
    if (primaryAgent === agentId && !newSelectedAgents.includes(agentId)) {
      if (newSelectedAgents.length > 0) {
        onPrimaryAgentChange(newSelectedAgents[0]);
      }
    }
    
    // Если добавляем первого агента, делаем его основным
    if (newSelectedAgents.length === 1 && newSelectedAgents.includes(agentId)) {
      onPrimaryAgentChange(agentId);
    }
  };

  const handlePrimaryAgentChange = (agentId: string) => {
    if (selectedAgents.includes(agentId)) {
      onPrimaryAgentChange(agentId);
    }
  };

  const getCapabilityIcon = (type: AICapability['type']) => {
    const icons = {
      code: '💻',
      design: '🎨',
      analysis: '🔍',
      debugging: '🐛',
      testing: '🧪',
      ssh: '🔐',
      general: '💬'
    };
    return icons[type] || '❓';
  };

  const getStrengthStars = (strength: number) => {
    return '⭐'.repeat(strength) + '☆'.repeat(5 - strength);
  };

  const getProviderColor = (provider: string) => {
    const colors = {
      'OpenAI': 'bg-green-100 text-green-800',
      'Anthropic': 'bg-orange-100 text-orange-800',
      'Google': 'bg-blue-100 text-blue-800',
      'Cohere': 'bg-purple-100 text-purple-800',
      'Hugging Face': 'bg-yellow-100 text-yellow-800',
      'Mistral AI': 'bg-red-100 text-red-800'
    };
    return colors[provider as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="ai-agent-selector bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          🤖 AI Агенты ({selectedAgents.length} выбрано)
        </h3>
        <div className="text-sm text-gray-600">
          Все агенты бесплатные
        </div>
      </div>

      {primaryAgent && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-800">
            🎯 Основной агент: {agents.find(a => a.id === primaryAgent)?.name}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Будет использоваться по умолчанию для новых задач
          </div>
        </div>
      )}

      <div className="space-y-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`border rounded-lg p-4 transition-all duration-200 ${
              selectedAgents.includes(agent.id)
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <input
                  type="checkbox"
                  id={agent.id}
                  checked={selectedAgents.includes(agent.id)}
                  onChange={() => handleAgentToggle(agent.id)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <label
                      htmlFor={agent.id}
                      className="font-medium text-gray-900 cursor-pointer"
                    >
                      {agent.name}
                    </label>
                    <span className={`px-2 py-1 text-xs rounded-full ${getProviderColor(agent.provider)}`}>
                      {agent.provider}
                    </span>
                    {agent.isFree && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        FREE
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    {agent.description}
                  </p>

                  {selectedAgents.includes(agent.id) && (
                    <div className="flex items-center space-x-4 mb-3">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="primaryAgent"
                          checked={primaryAgent === agent.id}
                          onChange={() => handlePrimaryAgentChange(agent.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Основной агент</span>
                      </label>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {agent.capabilities.map((capability, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-md text-xs"
                        title={capability.description}
                      >
                        <span>{getCapabilityIcon(capability.type)}</span>
                        <span className="capitalize">{capability.type}</span>
                        <span className="text-yellow-500 text-xs">
                          {getStrengthStars(capability.strength)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600"
              >
                {expandedAgent === agent.id ? '▼' : '▶'}
              </button>
            </div>

            {expandedAgent === agent.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Модель:</span>
                    <span className="ml-2 text-gray-600">{agent.model}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Макс. токены:</span>
                    <span className="ml-2 text-gray-600">{agent.maxTokens}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Температура:</span>
                    <span className="ml-2 text-gray-600">{agent.temperature}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Статус:</span>
                    <span className="ml-2 text-green-600">✅ Доступен</span>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="font-medium text-gray-700">Возможности:</span>
                  <div className="mt-2 space-y-1">
                    {agent.capabilities.map((capability, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="flex items-center space-x-2">
                          <span>{getCapabilityIcon(capability.type)}</span>
                          <span>{capability.description}</span>
                        </span>
                        <span className="text-yellow-500">
                          {getStrengthStars(capability.strength)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedAgents.length === 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600">⚠️</span>
            <span className="text-sm text-yellow-800">
              Выберите хотя бы одного AI агента для работы
            </span>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">💡 Рекомендации:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>GPT-3.5</strong> - универсальный выбор для большинства задач</li>
          <li>• <strong>Claude Haiku</strong> - лучший для анализа безопасности кода</li>
          <li>• <strong>Code Llama</strong> - специализируется на программировании</li>
          <li>• <strong>Gemini Flash</strong> - быстрый для больших проектов</li>
        </ul>
      </div>
    </div>
  );
};

export default AIAgentSelector;
