import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import CommandPalette from './CommandPalette'
import { useAppStore } from '../store/appStore'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useAppStore()

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
      
      {/* Command Palette */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <CommandPalette onClose={() => setCommandPaletteOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Layout

