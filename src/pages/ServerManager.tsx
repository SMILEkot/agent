import React from 'react';
import { motion } from 'framer-motion';
import { SSHTerminal } from '../components/SSHTerminal';
import { ServerIcon } from '@heroicons/react/24/outline';

export const ServerManager: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Заголовок */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-6 bg-white border-b border-gray-200"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ServerIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Управление сервером</h1>
            <p className="text-gray-600">SSH подключение и настройка Ubuntu серверов</p>
          </div>
        </div>
      </motion.div>

      {/* SSH Terminal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1"
      >
        <SSHTerminal />
      </motion.div>
    </div>
  );
};
