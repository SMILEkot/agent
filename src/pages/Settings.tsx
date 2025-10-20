import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAIStore } from '../store/aiStore'
import { useAppStore } from '../store/appStore'
import { AIConfig } from '../types/ai'
import { aiService } from '../services/aiService'

const Settings: React.FC = () => {
  const { config, setConfig } = useAIStore()
  const { theme, setTheme } = useAppStore()
  
  const [formData, setFormData] = useState<AIConfig>({
    provider: config?.provider || 'openai',
    apiKey: config?.apiKey || '',
    model: config?.model || 'gpt-3.5-turbo',
    temperature: config?.temperature || 0.7,
    maxTokens: config?.maxTokens || 2000,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const handleSave = async () => {
    setIsSaving(true)
    try {
      setConfig(formData)
      setSaveMessage('Settings saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      setSaveMessage('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const availableModels = aiService.getAvailableModels(formData.provider)

  return (
    <div className="flex-1 overflow-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Settings</h1>
          <p className="text-gray-400">
            Configure your AI agent and application preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Configuration */}
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">
                AI Configuration
              </h2>
              
              <div className="space-y-4">
                {/* Provider */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    AI Provider
                  </label>
                  <select
                    value={formData.provider}
                    onChange={(e) => {
                      const provider = e.target.value as 'openai' | 'anthropic'
                      const defaultModel = provider === 'openai' ? 'gpt-3.5-turbo' : 'claude-3-sonnet-20240229'
                      setFormData({ ...formData, provider, model: defaultModel })
                    }}
                    className="input w-full"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                  </select>
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="Enter your API key"
                    className="input w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.provider === 'openai' 
                      ? 'Get your API key from platform.openai.com'
                      : 'Get your API key from console.anthropic.com'
                    }
                  </p>
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Model
                  </label>
                  <select
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="input w-full"
                  >
                    {availableModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Temperature */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Temperature: {formData.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Focused</span>
                    <span>Creative</span>
                  </div>
                </div>

                {/* Max Tokens */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="4000"
                    value={formData.maxTokens}
                    onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                    className="input w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* App Settings */}
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">
                Application Settings
              </h2>
              
              <div className="space-y-4">
                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Theme
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                    className="input w-full"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>

                {/* Auto-save */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-300">
                      Auto-save files
                    </label>
                    <p className="text-xs text-gray-500">
                      Automatically save files when editing
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
                    defaultChecked
                  />
                </div>

                {/* File watching */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-300">
                      Watch file changes
                    </label>
                    <p className="text-xs text-gray-500">
                      Monitor file system for changes
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
                    defaultChecked
                  />
                </div>
              </div>
            </div>

            {/* About */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">
                About
              </h2>
              
              <div className="space-y-2 text-sm text-gray-400">
                <p><strong>Version:</strong> 1.0.0</p>
                <p><strong>Platform:</strong> Electron + React</p>
                <p><strong>Author:</strong> SMILEkot</p>
                <p><strong>License:</strong> MIT</p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex items-center justify-between">
          <div>
            {saveMessage && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-sm ${
                  saveMessage.includes('success') ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {saveMessage}
              </motion.p>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default Settings

