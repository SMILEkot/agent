import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderOpenIcon, DocumentIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import { fileService } from '../services/fileService';

interface ProjectSelectorProps {
  onProjectSelected: (projectPath: string) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ onProjectSelected }) => {
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [isSelecting, setIsSelecting] = useState(false);
  const [recentProjects, setRecentProjects] = useState<string[]>([]);

  useEffect(() => {
    // Загружаем недавние проекты из localStorage
    const recent = localStorage.getItem('recentProjects');
    if (recent) {
      try {
        setRecentProjects(JSON.parse(recent));
      } catch (error) {
        console.error('Error loading recent projects:', error);
      }
    }

    // Слушаем событие выбора папки из меню
    if (window.electronAPI) {
      window.electronAPI.onProjectFolderSelected((folderPath: string) => {
        handleProjectSelected(folderPath);
      });
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('project-folder-selected');
      }
    };
  }, []);

  const handleSelectFolder = async () => {
    if (!window.electronAPI) {
      alert('Функция доступна только в десктопной версии');
      return;
    }

    setIsSelecting(true);
    try {
      const folderPath = await fileService.selectFolder();
      if (folderPath) {
        handleProjectSelected(folderPath);
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      alert('Ошибка при выборе папки');
    } finally {
      setIsSelecting(false);
    }
  };

  const handleProjectSelected = (projectPath: string) => {
    setSelectedPath(projectPath);
    
    // Добавляем в недавние проекты
    const updatedRecent = [projectPath, ...recentProjects.filter(p => p !== projectPath)].slice(0, 5);
    setRecentProjects(updatedRecent);
    localStorage.setItem('recentProjects', JSON.stringify(updatedRecent));
    
    // Уведомляем родительский компонент
    onProjectSelected(projectPath);
  };

  const handleRecentProjectClick = (projectPath: string) => {
    handleProjectSelected(projectPath);
  };

  const removeFromRecent = (projectPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedRecent = recentProjects.filter(p => p !== projectPath);
    setRecentProjects(updatedRecent);
    localStorage.setItem('recentProjects', JSON.stringify(updatedRecent));
  };

  const getProjectName = (path: string) => {
    return path.split(/[/\\]/).pop() || path;
  };

  const getProjectIcon = (path: string) => {
    const name = getProjectName(path).toLowerCase();
    
    if (name.includes('react') || name.includes('next') || name.includes('vue')) {
      return '⚛️';
    } else if (name.includes('node') || name.includes('express') || name.includes('api')) {
      return '🟢';
    } else if (name.includes('python') || name.includes('django') || name.includes('flask')) {
      return '🐍';
    } else if (name.includes('java') || name.includes('spring')) {
      return '☕';
    } else if (name.includes('php') || name.includes('laravel')) {
      return '🐘';
    } else if (name.includes('go') || name.includes('golang')) {
      return '🐹';
    } else if (name.includes('rust')) {
      return '🦀';
    } else if (name.includes('web') || name.includes('site')) {
      return '🌐';
    } else {
      return '📁';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        {/* Заголовок */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CodeBracketIcon className="w-12 h-12 text-white" />
          </motion.div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Agent Desktop
          </h1>
          <p className="text-xl text-gray-600">
            Выберите папку проекта для начала работы
          </p>
        </div>

        {/* Кнопка выбора папки */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-8"
        >
          <button
            onClick={handleSelectFolder}
            disabled={isSelecting}
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
          >
            <FolderOpenIcon className="w-6 h-6 mr-3" />
            {isSelecting ? 'Выбор папки...' : 'Выбрать папку проекта'}
          </button>
        </motion.div>

        {/* Текущий выбранный проект */}
        {selectedPath && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8"
          >
            <div className="flex items-center">
              <div className="text-2xl mr-3">{getProjectIcon(selectedPath)}</div>
              <div>
                <h3 className="font-semibold text-green-800">
                  {getProjectName(selectedPath)}
                </h3>
                <p className="text-green-600 text-sm">{selectedPath}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Недавние проекты */}
        {recentProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <DocumentIcon className="w-5 h-5 mr-2" />
              Недавние проекты
            </h2>
            
            <div className="space-y-2">
              {recentProjects.map((projectPath, index) => (
                <motion.div
                  key={projectPath}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => handleRecentProjectClick(projectPath)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center">
                    <div className="text-xl mr-3">{getProjectIcon(projectPath)}</div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {getProjectName(projectPath)}
                      </h3>
                      <p className="text-gray-500 text-sm">{projectPath}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => removeFromRecent(projectPath, e)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
                    title="Удалить из недавних"
                  >
                    ✕
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Подсказки */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center text-gray-500"
        >
          <p className="mb-2">
            💡 Вы также можете выбрать папку через меню: <strong>Файл → Выбрать папку проекта</strong>
          </p>
          <p>
            🔧 После выбора папки станут доступны файловый менеджер, редактор кода и SSH терминал
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
