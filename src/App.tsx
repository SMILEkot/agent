import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from './components/Layout'
import AIAgent from './pages/AIAgent'
import Settings from './pages/Settings'
import { useAppStore } from './store/appStore'

function App() {
  const { setTheme } = useAppStore()
  
  // Initialize app
  useEffect(() => {
    // Set dark theme by default
    setTheme('dark')
    document.documentElement.classList.add('dark')
  }, [setTheme])
  
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
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </motion.div>
  )
}

export default App
