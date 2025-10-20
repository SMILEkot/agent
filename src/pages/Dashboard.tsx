import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  CpuChipIcon,
  FolderIcon,
  DocumentTextIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { useAppStore } from '../store/appStore'
import { useAIStore } from '../store/aiStore'

const Dashboard: React.FC = () => {
  const { recentProjects } = useAppStore()
  const { messages, isConfigured } = useAIStore()

  const stats = [
    {
      name: 'AI Messages',
      value: messages.length,
      icon: CpuChipIcon,
      color: 'text-blue-400',
    },
    {
      name: 'Recent Projects',
      value: recentProjects.length,
      icon: FolderIcon,
      color: 'text-green-400',
    },
    {
      name: 'Files Managed',
      value: '12',
      icon: DocumentTextIcon,
      color: 'text-purple-400',
    },
    {
      name: 'Commands Run',
      value: '34',
      icon: ChartBarIcon,
      color: 'text-orange-400',
    },
  ]

  const quickActions = [
    {
      name: 'Start AI Chat',
      description: 'Chat with AI to manage your files',
      href: '/ai-agent',
      icon: CpuChipIcon,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'Browse Projects',
      description: 'View and manage your projects',
      href: '/projects',
      icon: FolderIcon,
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      name: 'Configure AI',
      description: 'Set up your AI provider and settings',
      href: '/settings',
      icon: CpuChipIcon,
      color: 'bg-purple-600 hover:bg-purple-700',
    },
  ]

  return (
    <div className="flex-1 overflow-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">
            Welcome to AI Agent
          </h1>
          <p className="text-gray-400">
            Chat with AI to manage files and code efficiently
          </p>
        </div>

        {/* Configuration Warning */}
        {!isConfigured() && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CpuChipIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-400">
                  AI Configuration Required
                </h3>
                <div className="mt-2 text-sm text-yellow-300">
                  <p>
                    Please configure your AI settings to start using the agent.{' '}
                    <Link
                      to="/settings"
                      className="font-medium underline hover:no-underline"
                    >
                      Go to Settings
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-gray-100">
                    {stat.value}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  to={action.href}
                  className={`block p-6 rounded-lg transition-colors ${action.color}`}
                >
                  <div className="flex items-center mb-3">
                    <action.icon className="h-6 w-6 text-white" />
                    <h3 className="ml-3 text-lg font-medium text-white">
                      {action.name}
                    </h3>
                  </div>
                  <p className="text-gray-100 opacity-90">
                    {action.description}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
            Recent Activity
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            {messages.length > 0 ? (
              <div className="space-y-4">
                {messages.slice(-3).map((message) => (
                  <div key={message.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                        <CpuChipIcon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-400">
                        {message.role === 'user' ? 'You' : 'AI Agent'}
                      </p>
                      <p className="text-gray-100 truncate">
                        {message.content}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CpuChipIcon className="mx-auto h-12 w-12 text-gray-600" />
                <h3 className="mt-2 text-sm font-medium text-gray-400">
                  No recent activity
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start chatting with your AI agent to see activity here.
                </p>
                <div className="mt-6">
                  <Link
                    to="/ai-agent"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <CpuChipIcon className="-ml-1 mr-2 h-5 w-5" />
                    Start AI Chat
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Dashboard

