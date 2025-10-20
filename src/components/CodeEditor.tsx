import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Editor from '@monaco-editor/react'
import {
  DocumentIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useAIStore } from '../store/aiStore'
import { fileService } from '../services/fileService'

const CodeEditor: React.FC = () => {
  const { selectedFile, fileContent, setFileContent } = useAIStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editContent, setEditContent] = useState('')

  const handleEdit = () => {
    setEditContent(fileContent)
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!selectedFile) return
    
    setIsSaving(true)
    try {
      await fileService.writeFile(selectedFile, editContent)
      setFileContent(editContent)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save file:', error)
      // You could show an error toast here
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditContent('')
    setIsEditing(false)
  }

  const getLanguage = (filePath: string): string => {
    const ext = filePath.split('.').pop()?.toLowerCase()
    
    switch (ext) {
      case 'js':
        return 'javascript'
      case 'ts':
        return 'typescript'
      case 'tsx':
        return 'typescript'
      case 'jsx':
        return 'javascript'
      case 'json':
        return 'json'
      case 'css':
        return 'css'
      case 'html':
        return 'html'
      case 'md':
        return 'markdown'
      case 'py':
        return 'python'
      case 'java':
        return 'java'
      case 'cpp':
      case 'cc':
      case 'cxx':
        return 'cpp'
      case 'c':
        return 'c'
      case 'go':
        return 'go'
      case 'rs':
        return 'rust'
      case 'php':
        return 'php'
      case 'rb':
        return 'ruby'
      case 'sh':
        return 'shell'
      case 'yml':
      case 'yaml':
        return 'yaml'
      case 'xml':
        return 'xml'
      case 'sql':
        return 'sql'
      default:
        return 'plaintext'
    }
  }

  const getFileStats = () => {
    if (!fileContent) return null
    
    const lines = fileContent.split('\n').length
    const chars = fileContent.length
    const words = fileContent.split(/\s+/).filter(word => word.length > 0).length
    
    return { lines, chars, words }
  }

  const stats = getFileStats()

  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <DocumentIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            No file selected
          </h3>
          <p className="text-gray-500">
            Select a file from the file manager to view its contents
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <DocumentIcon className="w-5 h-5 text-gray-400" />
          <div>
            <h2 className="text-sm font-medium text-gray-100">
              {selectedFile.split('/').pop()}
            </h2>
            <p className="text-xs text-gray-500">{selectedFile}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors disabled:opacity-50"
              >
                <CheckIcon className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="flex items-center space-x-1 px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={getLanguage(selectedFile)}
          value={isEditing ? editContent : fileContent}
          onChange={(value) => isEditing && setEditContent(value || '')}
          theme="vs-dark"
          options={{
            readOnly: !isEditing,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            contextmenu: true,
            selectOnLineNumbers: true,
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 3,
            renderLineHighlight: 'line',
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              useShadows: false,
              verticalHasArrows: false,
              horizontalHasArrows: false,
            },
          }}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400">Loading editor...</div>
            </div>
          }
        />
      </div>

      {/* Footer with stats */}
      {stats && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-800 bg-gray-900 text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>{getLanguage(selectedFile)}</span>
            <span>UTF-8</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>{stats.lines} lines</span>
            <span>{stats.words} words</span>
            <span>{stats.chars} characters</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default CodeEditor

