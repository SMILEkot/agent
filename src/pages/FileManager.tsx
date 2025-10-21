import React, { useState, useEffect } from 'react';
import { FolderIcon, DocumentIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  modified?: Date;
}

const FileManager: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Симуляция файловой системы
  useEffect(() => {
    const mockFiles: FileItem[] = [
      { name: 'Documents', type: 'folder', path: '/Documents' },
      { name: 'Downloads', type: 'folder', path: '/Downloads' },
      { name: 'Pictures', type: 'folder', path: '/Pictures' },
      { name: 'src', type: 'folder', path: '/src' },
      { name: 'package.json', type: 'file', path: '/package.json', size: 2048 },
      { name: 'README.md', type: 'file', path: '/README.md', size: 1024 },
      { name: 'tsconfig.json', type: 'file', path: '/tsconfig.json', size: 512 },
      { name: 'vite.config.ts', type: 'file', path: '/vite.config.ts', size: 256 },
    ];
    setFiles(mockFiles);
  }, [currentPath]);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const navigateToFolder = (path: string) => {
    setCurrentPath(path);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <FolderIcon className="w-6 h-6" />
          File Manager
        </h1>
        <div className="mt-2 text-sm text-gray-400">
          Current path: {currentPath}
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {files.map((file) => (
            <div
              key={file.path}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => {
                if (file.type === 'folder') {
                  toggleFolder(file.path);
                }
              }}
            >
              {/* Icon */}
              <div className="flex items-center gap-2">
                {file.type === 'folder' && (
                  <>
                    {expandedFolders.has(file.path) ? (
                      <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                    )}
                    <FolderIcon className="w-5 h-5 text-blue-400" />
                  </>
                )}
                {file.type === 'file' && (
                  <>
                    <div className="w-4 h-4" /> {/* Spacer */}
                    <DocumentIcon className="w-5 h-5 text-gray-400" />
                  </>
                )}
              </div>

              {/* Name */}
              <div className="flex-1">
                <div className="font-medium">{file.name}</div>
              </div>

              {/* Size */}
              {file.size && (
                <div className="text-sm text-gray-500">
                  {formatFileSize(file.size)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty state */}
        {files.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FolderIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No files found in this directory</p>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="p-3 bg-gray-800 border-t border-gray-700 text-sm text-gray-400">
        {files.length} items
      </div>
    </div>
  );
};

export default FileManager;

