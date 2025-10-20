import React from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CpuChipIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

const navigation = [
  { name: 'AI Agent', href: '/', icon: CpuChipIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

const Sidebar: React.FC = () => {
  return (
    <motion.div
      className="w-16 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4"
      initial={{ x: -64 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Logo */}
      <div className="mb-8">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <CpuChipIcon className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              clsx(
                'w-10 h-10 rounded-lg flex items-center justify-center transition-colors relative group',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-gray-100 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {item.name}
            </div>
          </NavLink>
        ))}
      </nav>


    </motion.div>
  )
}

export default Sidebar
