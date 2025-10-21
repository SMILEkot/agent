import React, { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from './components/Layout'
import AIAgent from './pages/AIAgent'
import Settings from './pages/Settings'
import FileManager from './pages/FileManager'
import { ProjectSelector } from './pages/ProjectSelector'
import { ServerManager } from './pages/ServerManager'
import SimpleWebTerminalPage from './pages/SimpleWebTerminalPage'
import { useAppStore } from './store/appStore'
import { aiService } from './services/aiService'

function App() {
  const { setTheme } = useAppStore()
  const [selectedProject, setSelectedProject] = useState<string>('')
  
  // Initialize app
  useEffect(() => {
    // Set dark theme by default
    setTheme('dark')
    document.documentElement.classList.add('dark')
    
    // Initialize AI service
    aiService.initialize().catch(console.error)
    
    // Load last selected project
    const lastProject = localStorage.getItem('lastSelectedProject')
    if (lastProject) {
      setSelectedProject(lastProject)
    }
  }, [setTheme])

  const handleProjectSelected = (projectPath: string) => {
    setSelectedProject(projectPath)
    localStorage.setItem('lastSelectedProject', projectPath)
  }
  
  return (
    <motion.div 
      className="h-screen w-screen overflow-hidden bg-gray-950 text-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Layout>
        <Routes>
          <Route path="/" element={<AIAgent />} />
          <Route 
            path="/project" 
            element={<ProjectSelector onProjectSelected={handleProjectSelected} />} 
          />
          <Route path="/files" element={<FileManager />} />
          <Route path="/server" element={<ServerManager />} />
          <Route path="/terminal" element={<SimpleWebTerminalPage />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </motion.div>
  )
}

export default App
