import React from 'react';
import { SimpleWebTerminal } from '../components/SimpleWebTerminal';

const SimpleWebTerminalPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <SimpleWebTerminal className="flex-1" />
    </div>
  );
};

export default SimpleWebTerminalPage;

