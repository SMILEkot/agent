import React from 'react'
import { motion } from 'framer-motion'
import { UserIcon, CpuChipIcon } from '@heroicons/react/24/outline'
import { Message } from '../types/ai'
import Markdown from 'markdown-to-jsx'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MessageBubbleProps {
  message: Message
}

const CodeBlock: React.FC<{ children: string; className?: string }> = ({ 
  children, 
  className 
}) => {
  const language = className?.replace('lang-', '') || 'text'
  
  return (
    <SyntaxHighlighter
      language={language}
      style={oneDark}
      customStyle={{
        margin: 0,
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
      }}
    >
      {children}
    </SyntaxHighlighter>
  )
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center"
      >
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg px-3 py-2 max-w-md">
          <p className="text-yellow-300 text-sm text-center">{message.content}</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-primary-600' : 'bg-gray-700'
          }`}>
            {isUser ? (
              <UserIcon className="w-4 h-4 text-white" />
            ) : (
              <CpuChipIcon className="w-4 h-4 text-white" />
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`rounded-lg px-4 py-2 ${
            isUser 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-800 text-gray-100'
          }`}>
            {message.isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none prose-invert">
                <Markdown
                  options={{
                    overrides: {
                      code: {
                        component: ({ children, className }) => (
                          className ? (
                            <CodeBlock className={className}>
                              {children as string}
                            </CodeBlock>
                          ) : (
                            <code className="bg-gray-700 px-1 py-0.5 rounded text-sm">
                              {children}
                            </code>
                          )
                        ),
                      },
                      pre: {
                        component: ({ children }) => <div>{children}</div>,
                      },
                    },
                  }}
                >
                  {message.content}
                </Markdown>
              </div>
            )}
          </div>
          
          {/* Timestamp */}
          <span className="text-xs text-gray-500 mt-1">
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default MessageBubble

