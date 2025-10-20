import React from 'react'
import { motion } from 'framer-motion'
import {
  Squares2X2Icon,
  ChatBubbleLeftRightIcon,
  FolderIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { useAIStore } from '../store/aiStore'
import { ViewMode } from '../types/ai'

const viewModes: Array<{
  mode: ViewMode
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}> = [
  {
    mode: 'split',
    label: 'Split',
    icon: Squares2X2Icon,
    description: 'Files, editor, and chat',
  },
  {
    mode: 'chat-only',
    label: 'Chat',
    icon: ChatBubbleLeftRightIcon,
    description: 'Chat only',
  },
  {
    mode: 'files-only',
    label: 'Files',
    icon: FolderIcon,
    description: 'Files and editor',
  },
  {
    mode: 'editor-only',
    label: 'Editor',
    icon: DocumentTextIcon,
    description: 'Editor only',
  },
]

const ViewModeSelector: React.FC = () => {
  const { viewMode, setViewMode } = useAIStore()

  return (
    <div className="flex items-center space-x-1 bg-gray-800 rounded-lg p-1">
      {viewModes.map((mode) => {
        const Icon = mode.icon
        const isActive = viewMode === mode.mode
        
        return (
          <motion.button
            key={mode.mode}
            onClick={() => setViewMode(mode.mode)}
            className={`relative flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'text-white bg-primary-600'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title={mode.description}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{mode.label}</span>
            
            {isActive && (
              <motion.div
                className="absolute inset-0 bg-primary-600 rounded-md -z-10"
                layoutId="activeViewMode"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
              />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

export default ViewModeSelector

