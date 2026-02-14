import React, { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { CompanionMood, QuestionContext } from '../types';

interface BackgroundProps {
  moodIntensity: CompanionMood;
  context?: QuestionContext;
}

const BackgroundComponent: React.FC<BackgroundProps> = ({ moodIntensity, context = 'general' }) => {
  
  // Dynamic Configuration based on Mood
  const config = useMemo(() => {
    switch (moodIntensity) {
      case 'love':
        return {
          colors: ['#881337', '#be123c', '#fb7185'], // Rose/Pink
          speed: 20,
          count: 20,
          pulse: 2,
          blur: 'blur-[120px]',
          opacity: 0.2
        };
      case 'happy':
      case 'excited':
        return {
          colors: ['#e11d48', '#db2777', '#f472b6'], // Pink/Fuchsia
          speed: 10, // Faster
          count: 25,
          pulse: 1.5,
          blur: 'blur-[100px]',
          opacity: 0.25
        };
      case 'stressed':
      case 'confused':
        return {
          colors: ['#4c1d95', '#7c3aed', '#a78bfa'], // Violet/Purple
          speed: 5, // Erratic/Fast
          count: 30,
          pulse: 0.5,
          blur: 'blur-[90px]',
          opacity: 0.15
        };
      case 'sad':
      case 'sleepy':
        return {
          colors: ['#1e3a8a', '#3b82f6', '#93c5fd'], // Blue
          speed: 40, // Slow
          count: 15,
          pulse: 8,
          blur: 'blur-[140px]',
          opacity: 0.1
        };
      case 'thinking':
        return {
          colors: ['#0f766e', '#14b8a6', '#5eead4'], // Teal
          speed: 25,
          count: 18,
          pulse: 4,
          blur: 'blur-[110px]',
          opacity: 0.2
        };
      default: // Neutral
        return {
          colors: ['#312e81', '#6366f1', '#a5b4fc'], // Indigo
          speed: 30,
          count: 15,
          pulse: 5,
          blur: 'blur-[130px]',
          opacity: 0.15
        };
    }
  }, [moodIntensity]);

  // Context Overlay Colors
  const overlayGradient = useMemo(() => {
      if (context === 'love') return 'radial-gradient(circle at 50% 0%, rgba(244, 63, 94, 0.15), transparent 70%)';
      if (context === 'study') return 'radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.15), transparent 70%)';
      return 'radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.15), transparent 70%)';
  }, [context]);

  // Generate lightweight particles
  const particles = useMemo(() => Array.from({ length: config.count }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 4 + 1,
    duration: Math.random() * config.speed + config.speed * 0.5,
    delay: Math.random() * 5,
    color: config.colors[Math.floor(Math.random() * config.colors.length)]
  })), [config]);

  return (
    <div className="fixed inset-0 -z-10 bg-[#020205] overflow-hidden transition-colors duration-1000">
      
      {/* 1. Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020205] via-[#05050a] to-[#0a0510]" />
      
      {/* 2. Mood Orbs (Volumetric) */}
      <motion.div 
        animate={{ 
            scale: [1, 1.2, 1], 
            opacity: [config.opacity, config.opacity * 1.5, config.opacity],
            background: `radial-gradient(circle, ${config.colors[0]}, transparent 70%)`
        }}
        transition={{ duration: config.pulse * 4, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] rounded-full ${config.blur} mix-blend-screen pointer-events-none will-change-[transform,opacity]`}
      />
      
      <motion.div 
        animate={{ 
            scale: [1.2, 1, 1.2], 
            opacity: [config.opacity, config.opacity * 1.3, config.opacity],
            background: `radial-gradient(circle, ${config.colors[1]}, transparent 70%)`
        }}
        transition={{ duration: config.pulse * 5, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full ${config.blur} mix-blend-screen pointer-events-none will-change-[transform,opacity]`}
      />

      {/* 3. Context Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none mix-blend-overlay transition-all duration-1000"
        style={{ background: overlayGradient }}
      />

      {/* 4. Particles */}
      {particles.map((p) => (
        <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{ 
                left: p.left, 
                top: p.top, 
                width: p.size, 
                height: p.size, 
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                willChange: 'transform, opacity'
            }}
            animate={{ 
                y: [0, -100], 
                opacity: [0, 0.8, 0] 
            }}
            transition={{ 
                duration: p.duration, 
                repeat: Infinity, 
                delay: p.delay,
                ease: "linear" 
            }}
        />
      ))}
      
      {/* 5. Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020205_100%)] pointer-events-none opacity-80" />
    </div>
  );
};

export const Background = memo(BackgroundComponent);