import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderIcon,
  FolderOpenIcon,
  DocumentIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { useAIStore } from '../store/aiStore'
import { FileNode } from '../types/ai'

interface FileTreeItemProps {
  node: FileNode
  level: number
  onSelect: (path: string) => void
  selectedFile: string | null
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ 
  node, 
  level, 
  onSelect, 
  selectedFile 
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const isSelected = selectedFile === node.path
  const hasChildren = node.children && node.children.length > 0

  const getFileIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) {
      return isExpanded ? FolderOpenIcon : FolderIcon
    }
    
    const ext = fileName.split('.').pop()?.toLowerCase()
    
    // You could add more specific icons based on file type
    switch (ext) {
      case 'tsx':
      case 'jsx':
      case 'ts':
      case 'js':
        return DocumentIcon
      case 'json':
        return DocumentIcon
      case 'md':
        return DocumentIcon
      default:
        return DocumentIcon
    }
  }

  const getFileColor = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) return 'text-blue-400'
    
    const ext = fileName.split('.').pop()?.toLowerCase()
    
    switch (ext) {
      case 'tsx':
      case 'jsx':
        return 'text-cyan-400'
      case 'ts':
        return 'text-blue-400'
      case 'js':
        return 'text-yellow-400'
      case 'json':
        return 'text-green-400'
      case 'md':
        return 'text-gray-400'
      case 'css':
        return 'text-pink-400'
      default:
        return 'text-gray-400'
    }
  }

  const Icon = getFileIcon(node.name, node.type === 'directory')
  const color = getFileColor(node.name, node.type === 'directory')

  const handleClick = () => {
    if (node.type === 'directory') {
      setIsExpanded(!isExpanded)
    } else {
      onSelect(node.path)
    }
  }

  return (
    <div>
      <motion.div
        className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-800 rounded ${
          isSelected ? 'bg-primary-900/30 text-primary-300' : 'text-gray-300'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        whileHover={{ x: 2 }}
        transition={{ duration: 0.1 }}
      >
        {/* Expand/Collapse Icon */}
        {node.type === 'directory' && (
          <div className="w-4 h-4 mr-1 flex items-center justify-center">
            {hasChildren && (
              isExpanded ? (
                <ChevronDownIcon className="w-3 h-3 text-gray-500" />
              ) : (
                <ChevronRightIcon className="w-3 h-3 text-gray-500" />
              )
            )}
          </div>
        )}
        
        {/* File/Folder Icon */}
        <Icon className={`w-4 h-4 mr-2 ${color}`} />
        
        {/* Name */}
        <span className="text-sm truncate flex-1">{node.name}</span>
        
        {/* File size for files */}
        {node.type === 'file' && node.size && (
          <span className="text-xs text-gray-500 ml-2">
            {formatFileSize(node.size)}
          </span>
        )}
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {node.type === 'directory' && isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {node.children!.map((child) => (
              <FileTreeItem
                key={child.path}
                node={child}
                level={level + 1}
                onSelect={onSelect}
                selectedFile={selectedFile}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const FileManager: React.FC = () => {
  const { fileTree, selectedFile, selectFile, refreshFileTree } = useAIStore()

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-gray-100">Files</h2>
        <button
          onClick={refreshFileTree}
          className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors"
          title="Refresh"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        {fileTree.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <FolderIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No files found</p>
            <button
              onClick={refreshFileTree}
              className="text-primary-400 hover:text-primary-300 text-sm mt-2"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="p-2">
            {fileTree.map((node) => (
              <FileTreeItem
                key={node.path}
                node={node}
                level={0}
                onSelect={selectFile}
                selectedFile={selectedFile}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FileManager

