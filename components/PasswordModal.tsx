import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, X, Loader2 } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    setError(false);

    // Simulate network delay for security feel
    setTimeout(() => {
      if (password === "Ahmmos@akm123a") {
        onSuccess();
        setPassword('');
        onClose();
      } else {
        setError(true);
        // Shake animation triggering logic could go here
      }
      setIsChecking(false);
    }, 800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-[#0a0510] border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(139,92,246,0.15)] overflow-hidden"
          >
            {/* Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-violet-500/20 blur-[50px]" />

            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="relative flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                <Lock size={24} className="text-violet-300" />
              </div>

              <h3 className="text-2xl font-display font-bold text-white mb-2">Restricted Access</h3>
              <p className="text-gray-400 text-sm mb-8">
                Enter the administrator password to download the confidential analytics report.
              </p>

              <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError(false);
                    }}
                    placeholder="Enter password"
                    className={`w-full bg-white/5 border ${error ? 'border-red-500/50 text-red-200' : 'border-white/10 text-white'} rounded-xl px-4 py-3 outline-none focus:border-violet-500/50 transition-all font-mono text-sm tracking-widest`}
                    autoFocus
                  />
                  {error && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-red-400 font-bold uppercase tracking-wider">
                        Invalid
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isChecking || !password}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold tracking-wide hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isChecking ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <Unlock size={18} />
                      Unlock & Download
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};