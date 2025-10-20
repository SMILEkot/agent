import React from 'react'
import { motion } from 'framer-motion'
import { FolderIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useAppStore } from '../store/appStore'

const Projects: React.FC = () => {
  const { recentProjects, currentProject, setCurrentProject } = useAppStore()

  const mockProjects = [
    {
      name: 'AI Agent Desktop',
      path: '/Users/user/projects/ai-agent',
      lastModified: new Date(),
      fileCount: 45,
    },
    {
      name: 'React Dashboard',
      path: '/Users/user/projects/dashboard',
      lastModified: new Date(Date.now() - 86400000),
      fileCount: 23,
    },
    {
      name: 'Node.js API',
      path: '/Users/user/projects/api',
      lastModified: new Date(Date.now() - 172800000),
      fileCount: 18,
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2">Projects</h1>
            <p className="text-gray-400">
              Manage and organize your development projects
            </p>
          </div>
          <button className="btn btn-primary flex items-center gap-2">
            <PlusIcon className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Current Project */}
        {currentProject && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">
              Current Project
            </h2>
            <div className="bg-primary-900/20 border border-primary-700 rounded-lg p-6">
              <div className="flex items-center">
                <FolderIcon className="w-8 h-8 text-primary-400" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-100">
                    {currentProject}
                  </h3>
                  <p className="text-gray-400">Active project</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Projects */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">
            Recent Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProjects.map((project, index) => (
              <motion.div
                key={project.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors cursor-pointer"
                onClick={() => setCurrentProject(project.name)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <FolderIcon className="w-6 h-6 text-blue-400" />
                    <h3 className="ml-3 text-lg font-medium text-gray-100">
                      {project.name}
                    </h3>
                  </div>
                </div>
                
                <p className="text-sm text-gray-400 mb-3 truncate">
                  {project.path}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{project.fileCount} files</span>
                  <span>{project.lastModified.toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {mockProjects.length === 0 && (
          <div className="text-center py-12">
            <FolderIcon className="mx-auto h-12 w-12 text-gray-600" />
            <h3 className="mt-2 text-sm font-medium text-gray-400">
              No projects yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new project or opening an existing one.
            </p>
            <div className="mt-6">
              <button className="btn btn-primary flex items-center gap-2 mx-auto">
                <PlusIcon className="w-4 h-4" />
                Create Project
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default Projects

