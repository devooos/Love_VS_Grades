import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  total: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, total }) => {
  const percentage = Math.min((progress / total) * 100, 100);

  return (
    <div className="w-full max-w-2xl mb-8 flex items-center gap-4 px-4">
      <span className="text-[10px] font-mono font-bold text-gray-500 opacity-80 tracking-widest">
        {String(progress).padStart(2, '0')} / {total}
      </span>
      
      <div className="flex-1 h-[2px] bg-white/5 rounded-full overflow-hidden relative">
        <motion.div
          className="h-full absolute left-0 top-0 bottom-0 bg-gradient-to-r from-rose-500 via-violet-500 to-cyan-500 shadow-[0_0_10px_rgba(255,255,255,0.3)]"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 50, damping: 20 }}
        />
      </div>
    </div>
  );
};