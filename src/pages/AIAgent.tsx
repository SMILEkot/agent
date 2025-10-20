import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAIStore } from '../store/aiStore'
import AIChat from '../components/AIChat'
import FileManager from '../components/FileManager'
import CodeEditor from '../components/CodeEditor'
import ViewModeSelector from '../components/ViewModeSelector'

const AIAgent: React.FC = () => {
  const { viewMode, loadFileTree, isConfigured } = useAIStore()

  useEffect(() => {
    // Load file tree on mount
    loadFileTree()
  }, [loadFileTree])

  if (!isConfigured()) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-100 mb-2">
            AI Configuration Required
          </h2>
          <p className="text-gray-400 mb-6">
            Please configure your AI settings before using the agent.
          </p>
          <button
            onClick={() => window.location.href = '/settings'}
            className="btn btn-primary"
          >
            Go to Settings
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header with View Mode Selector */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h1 className="text-xl font-semibold text-gray-100">AI Agent</h1>
        <ViewModeSelector />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'split' && (
          <>
            {/* File Manager */}
            <div className="w-64 border-r border-gray-800">
              <FileManager />
            </div>
            
            {/* Code Editor */}
            <div className="flex-1 border-r border-gray-800">
              <CodeEditor />
            </div>
            
            {/* AI Chat */}
            <div className="w-96">
              <AIChat />
            </div>
          </>
        )}

        {viewMode === 'chat-only' && (
          <div className="flex-1">
            <AIChat />
          </div>
        )}

        {viewMode === 'files-only' && (
          <>
            <div className="w-64 border-r border-gray-800">
              <FileManager />
            </div>
            <div className="flex-1">
              <CodeEditor />
            </div>
          </>
        )}

        {viewMode === 'editor-only' && (
          <div className="flex-1">
            <CodeEditor />
          </div>
        )}
      </div>
    </div>
  )
}

export default AIAgent

