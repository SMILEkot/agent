import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { useAIStore } from '../store/aiStore'
import { useAppStore } from '../store/appStore'

interface Command {
  id: string
  title: string
  description: string
  action: () => void
  category: string
  keywords: string[]
}

interface CommandPaletteProps {
  onClose: () => void
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose }) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  
  const { setViewMode, clearMessages, refreshFileTree } = useAIStore()
  const { setTheme, theme } = useAppStore()

  const commands: Command[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      description: 'Navigate to the main dashboard',
      action: () => navigate('/'),
      category: 'Navigation',
      keywords: ['dashboard', 'home', 'main'],
    },
    {
      id: 'nav-projects',
      title: 'Go to Projects',
      description: 'Navigate to projects page',
      action: () => navigate('/projects'),
      category: 'Navigation',
      keywords: ['projects', 'files', 'folders'],
    },
    {
      id: 'nav-ai-agent',
      title: 'Go to AI Agent',
      description: 'Navigate to AI chat interface',
      action: () => navigate('/ai-agent'),
      category: 'Navigation',
      keywords: ['ai', 'chat', 'agent', 'assistant'],
    },
    {
      id: 'nav-settings',
      title: 'Go to Settings',
      description: 'Navigate to settings page',
      action: () => navigate('/settings'),
      category: 'Navigation',
      keywords: ['settings', 'config', 'preferences'],
    },
    
    // View modes
    {
      id: 'view-split',
      title: 'Split View',
      description: 'Show files, editor, and chat',
      action: () => setViewMode('split'),
      category: 'View',
      keywords: ['split', 'view', 'layout'],
    },
    {
      id: 'view-chat',
      title: 'Chat Only',
      description: 'Show only the AI chat',
      action: () => setViewMode('chat-only'),
      category: 'View',
      keywords: ['chat', 'only', 'view'],
    },
    {
      id: 'view-files',
      title: 'Files View',
      description: 'Show files and editor',
      action: () => setViewMode('files-only'),
      category: 'View',
      keywords: ['files', 'editor', 'view'],
    },
    {
      id: 'view-editor',
      title: 'Editor Only',
      description: 'Show only the code editor',
      action: () => setViewMode('editor-only'),
      category: 'View',
      keywords: ['editor', 'only', 'code'],
    },
    
    // Actions
    {
      id: 'clear-chat',
      title: 'Clear Chat History',
      description: 'Clear all chat messages',
      action: () => clearMessages(),
      category: 'Actions',
      keywords: ['clear', 'chat', 'messages', 'history'],
    },
    {
      id: 'refresh-files',
      title: 'Refresh File Tree',
      description: 'Reload the file tree',
      action: () => refreshFileTree(),
      category: 'Actions',
      keywords: ['refresh', 'reload', 'files', 'tree'],
    },
    {
      id: 'toggle-theme',
      title: 'Toggle Theme',
      description: `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`,
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      category: 'Actions',
      keywords: ['theme', 'dark', 'light', 'toggle'],
    },
  ]

  const filteredCommands = commands.filter(command => {
    if (!query) return true
    
    const searchText = query.toLowerCase()
    return (
      command.title.toLowerCase().includes(searchText) ||
      command.description.toLowerCase().includes(searchText) ||
      command.keywords.some(keyword => keyword.includes(searchText))
    )
  })

  const groupedCommands = filteredCommands.reduce((groups, command) => {
    const category = command.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(command)
    return groups
  }, {} as Record<string, Command[]>)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action()
        onClose()
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-gray-700">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-1 text-xs text-gray-500 bg-gray-800 rounded">
            ESC
          </kbd>
        </div>

        {/* Commands */}
        <div className="max-h-96 overflow-y-auto">
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No commands found for "{query}"
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, categoryCommands]) => (
              <div key={category}>
                <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-800/50">
                  {category}
                </div>
                {categoryCommands.map((command, index) => {
                  const globalIndex = filteredCommands.indexOf(command)
                  const isSelected = globalIndex === selectedIndex
                  
                  return (
                    <motion.div
                      key={command.id}
                      className={`px-4 py-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary-600 text-white' : 'hover:bg-gray-800'
                      }`}
                      onClick={() => {
                        command.action()
                        onClose()
                      }}
                      whileHover={{ x: 2 }}
                    >
                      <div className="font-medium">{command.title}</div>
                      <div className={`text-sm ${
                        isSelected ? 'text-gray-200' : 'text-gray-500'
                      }`}>
                        {command.description}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <kbd className="px-1 py-0.5 bg-gray-800 rounded mr-1">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center">
              <kbd className="px-1 py-0.5 bg-gray-800 rounded mr-1">↵</kbd>
              Select
            </span>
          </div>
          <span>{filteredCommands.length} commands</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default CommandPalette

