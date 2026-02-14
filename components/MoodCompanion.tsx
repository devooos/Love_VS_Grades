import React, { useEffect, useState, useRef, memo } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import { CompanionMood } from '../types';

interface MoodCompanionProps {
  mood: CompanionMood;
  reactionTrigger: number;
  className?: string;
  questionId?: string; 
}

const BLOB_PATHS = {
  neutral: "M50,15 C80,15 95,35 95,60 C95,85 75,95 50,95 C25,95 5,85 5,60 C5,35 20,15 50,15 Z", 
  happy:   "M50,20 C85,15 95,45 95,70 C95,90 75,95 50,95 C25,95 5,90 5,70 C5,45 15,15 50,20 Z",
  love:    "M50,25 C80,25 90,45 90,70 C90,90 70,95 50,95 C30,95 10,90 10,70 C10,45 20,25 50,25 Z",
  excited: "M50,10 C90,10 95,40 95,65 C95,90 70,95 50,95 C30,95 5,90 5,65 C5,40 10,10 50,10 Z",
  sleepy:  "M50,40 C80,40 95,60 98,80 C100,95 80,98 50,98 C20,98 0,95 2,80 C5,60 20,40 50,40 Z",
  stressed:"M50,20 C70,10 95,30 90,60 C85,90 70,95 50,95 C30,95 15,90 10,60 C5,30 30,10 50,20 Z",
  thinking:"M50,20 C80,20 95,50 95,75 C95,95 75,95 50,95 C25,95 5,95 5,75 C5,50 20,20 50,20 Z",
  sad:     "M50,30 C75,30 90,55 90,80 C90,95 70,98 50,98 C30,98 10,95 10,80 C10,55 25,30 50,30 Z",
  confused:"M50,20 C75,10 95,40 90,70 C95,90 75,95 50,95 C25,95 10,80 15,50 C10,25 25,15 50,20 Z"
};

const EYE_SHAPES = {
  neutral: { left: "M 0,0 a 6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0", right: "M 0,0 a 6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0" },
  happy: { left: "M 0,6 Q 6,-4 12,6", right: "M 0,6 Q 6,-4 12,6" },
  love: { left: "M 0,6 Q 6,-2 12,6", right: "M 0,6 Q 6,-2 12,6" },
  excited: { left: "M 0,0 a 7,7 0 1,0 14,0 a 7,7 0 1,0 -14,0", right: "M 0,0 a 7,7 0 1,0 14,0 a 7,7 0 1,0 -14,0" },
  sleepy: { left: "M 0,6 L 12,6", right: "M 0,6 L 12,6" },
  thinking: { left: "M 0,0 a 6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0", right: "M 0,0 a 6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0" },
  stressed: { left: "M 0,4 Q 6,12 12,4", right: "M 0,4 Q 6,12 12,4" },
  sad: { left: "M 0,8 Q 6,0 12,8", right: "M 0,8 Q 6,0 12,8" },
  confused: { left: "M 0,5 L 12,5", right: "M 0,0 a 7,7 0 1,0 14,0 a 7,7 0 1,0 -14,0" },
  surprised: { left: "M 0,0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0", right: "M 0,0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0" }
};

const GENERIC_PHRASES: Record<string, string[]> = {
    happy: ["Living life!", "Vibe check: Passed.", "Slay!", "We love to see it.", "Keep glowing!", "Chill vibes only.", "Main character energy.", "So true!"],
    love: ["Down bad?", "So cute!", "Relationship goals!", "Heart eyes fr.", "Love that for you!", "Romance arc?", "Simping allowed.", "Aww!"],
    excited: ["Let's gooo!", "Locked in!", "Big energy!", "Academic weapon!", "Wow!", "Sheeesh!", "Top tier behavior.", "Yes!"],
    sleepy: ["Need coffee?", "Zzz...", "Wake up!", "Brain rot realness.", "Nap time?", "Running on fumes.", "Low battery.", "Same."],
    stressed: ["Deep breaths.", "It's okay bestie.", "You got this.", "Take a moment.", "Panic mode off.", "Academic victim?", "Hang in there."],
    sad: ["Sending hugs.", "It gets better.", "Here for you.", "Keep your head up.", "❤️", "It's a canon event.", "Oof."],
    thinking: ["Processing...", "Big brain time.", "Let me cook.", "Good point.", "Deep thoughts.", "Hmm...", "Valid.", "Interesting..."],
    confused: ["Wait, what?", "Math ain't mathing.", "Situationship?", "Loading...", "Make it make sense.", "Uh... okay?", "Spill the tea."],
    neutral: ["Cool.", "Noted.", "Okay!", "Got it.", "Fair enough.", "Just vibing.", "Alright."]
};

const CONTEXT_PHRASES: Record<string, string[]> = {
    'grade': ["Freshman year?", "Senioritis kicking in?", "Oh, cool!", "Good luck!"],
    'status': ["Spill the tea!", "Be honest...", "No judgment.", "I'm listening.", "Oop-"],
    'focus_level': ["Be real with me.", "Academic weapon?", "Locked in or nah?", "GPA check?"],
    'romantic_thoughts_freq': ["Distracted much?", "Head in the clouds?", "Focus!", "Thinking about them?"],
    'notifications_freq': ["Doomscrolling?", "Put the phone down!", "Screen time reveal?", "Focus mode: On."],
    'reflection': ["This is a safe space.", "Let it all out.", "Writing is healing.", "I'm reading...", "Deep stuff."]
};

const MoodCompanionComponent: React.FC<MoodCompanionProps> = ({ mood, reactionTrigger, className, questionId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [blink, setBlink] = useState(false);
  const [surprise, setSurprise] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 120 };
  const pupilX = useSpring(mouseX, springConfig);
  const pupilY = useSpring(mouseY, springConfig);

  useEffect(() => {
    if (reactionTrigger > 0) {
      setSurprise(true);
      
      let phrasePool = GENERIC_PHRASES[mood] || GENERIC_PHRASES.neutral;
      if (questionId && CONTEXT_PHRASES[questionId] && Math.random() > 0.6) {
          phrasePool = CONTEXT_PHRASES[questionId];
      }

      const phrase = phrasePool[Math.floor(Math.random() * phrasePool.length)];
      setSpeech(phrase);
      
      const t1 = setTimeout(() => setSurprise(false), 800);
      const t2 = setTimeout(() => setSpeech(null), 3000); 
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [reactionTrigger, mood, questionId]);

  // Optimized Eye Tracking (Throttled)
  useEffect(() => {
    let frameId: number;
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || mood === 'thinking' || mood === 'sleepy') return;
      
      // Use requestAnimationFrame to prevent spamming updates
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
          const rect = containerRef.current!.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const limit = 5; 
          const dx = Math.min(Math.max((e.clientX - centerX) / 25, -limit), limit);
          const dy = Math.min(Math.max((e.clientY - centerY) / 25, -limit), limit);
          mouseX.set(dx);
          mouseY.set(dy);
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        cancelAnimationFrame(frameId);
    };
  }, [mood, mouseX, mouseY]);

  useEffect(() => {
    let scanInterval: any;
    if (mood === 'thinking') {
      const scan = () => {
         const now = Date.now();
         const offset = Math.sin(now / 500) * 6; 
         mouseX.set(offset);
         mouseY.set(Math.sin(now / 200) * 1); 
         scanInterval = requestAnimationFrame(scan);
      };
      scan();
    }
    return () => cancelAnimationFrame(scanInterval);
  }, [mood, mouseX, mouseY]);

  useEffect(() => {
    const blinkLoop = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
      setTimeout(blinkLoop, Math.random() * 4000 + 2000); 
    };
    const t = setTimeout(blinkLoop, 2000);
    return () => clearTimeout(t);
  }, []);

  const getConfig = () => {
    switch (mood) {
      case 'happy': return { color: ['#fff1f2', '#fce7f3'], shadow: '#fbcfe8' };
      case 'love': return { color: ['#fdf2f8', '#fce7f3'], shadow: '#f472b6' };
      case 'excited': return { color: ['#f5f3ff', '#ede9fe'], shadow: '#a78bfa' };
      case 'sleepy': return { color: ['#f0f9ff', '#e0f2fe'], shadow: '#bae6fd' };
      case 'stressed': return { color: ['#fff1f2', '#fee2e2'], shadow: '#fca5a5' };
      case 'thinking': return { color: ['#ecfdf5', '#d1fae5'], shadow: '#6ee7b7' };
      case 'sad': return { color: ['#eff6ff', '#dbeafe'], shadow: '#93c5fd' };
      case 'confused': return { color: ['#fff7ed', '#ffedd5'], shadow: '#fdba74' };
      default: return { color: ['#fafafa', '#f4f4f5'], shadow: '#cbd5e1' };
    }
  };
  const config = getConfig();
  
  const currentEyeShape = surprise ? EYE_SHAPES.surprised : (EYE_SHAPES[mood as keyof typeof EYE_SHAPES] || EYE_SHAPES.neutral);

  const getBodyAnimation = (): any => {
    if (surprise) return { y: [0, -20, 0], scale: [1, 1.15, 0.95, 1], transition: { duration: 0.5, ease: "backOut" } };
    switch(mood) {
        case 'love': return { scale: [1, 1.05, 1], y: [0, -5, 0], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } };
        case 'excited': return { y: [0, -8, 0], scale: [1, 1.05, 0.95, 1], transition: { duration: 0.6, repeat: Infinity, type: "spring", stiffness: 100 } };
        case 'stressed': return { x: [-1, 1, -1], y: [0, 1, 0], transition: { duration: 0.1, repeat: Infinity } };
        case 'sleepy': return { y: [0, 2, 0], scale: [1, 1.01, 1], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } };
        case 'thinking': return { rotate: [0, 2, -2, 0], y: [0, -3, 0], transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } };
        case 'confused': return { rotate: [0, -5, 5, 0], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } }
        default: return { y: [0, -6, 0], scale: [1, 1.02, 1], transition: { duration: 5, repeat: Infinity, ease: "easeInOut" } };
    }
  };

  const defaultClasses = "fixed bottom-8 left-8 z-50 w-24 h-24 md:w-32 md:h-32 hidden md:flex items-center justify-center pointer-events-none";
  const appliedClass = className || defaultClasses;

  return (
    <motion.div 
      ref={containerRef}
      className={appliedClass}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      style={{ willChange: 'transform' }}
    >
      <AnimatePresence>
        {speech && (
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: -90, scale: 1 }}
                exit={{ opacity: 0, y: -80, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="absolute w-40 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3 text-center shadow-lg z-50"
            >
                <div className="text-white text-xs md:text-sm font-bold font-display tracking-wide leading-tight">{speech}</div>
                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white/10 border-r border-b border-white/20 rotate-45 transform backdrop-blur-xl" />
            </motion.div>
        )}
      </AnimatePresence>

      <motion.div animate={getBodyAnimation()} className="relative w-full h-full">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
                <linearGradient id="blobGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={config.color[0]} />
                    <stop offset="100%" stopColor={config.color[1]} />
                </linearGradient>
                <filter id="glassBlur" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
                    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                    <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
                </filter>
                <filter id="innerGlow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
            </defs>

            {/* Shadow / Grounding */}
            <motion.ellipse 
              cx="50" cy="95" rx="30" ry="5" fill={config.shadow} opacity="0.3" filter="url(#glassBlur)"
              animate={{ rx: surprise ? 20 : [28, 34, 28], opacity: surprise ? 0.1 : [0.2, 0.3, 0.2] }}
              transition={{ duration: 5, repeat: Infinity }}
            />

            {/* Main Body */}
            <motion.path
                d={BLOB_PATHS[mood as keyof typeof BLOB_PATHS] || BLOB_PATHS.neutral}
                fill="url(#blobGradient)" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" filter="url(#innerGlow)"
                animate={{ d: BLOB_PATHS[mood as keyof typeof BLOB_PATHS] || BLOB_PATHS.neutral }}
                transition={{ duration: 0.8, type: "spring", stiffness: 50, damping: 15 }}
            />

            {/* Highlights */}
            <path d="M30,20 Q50,15 70,20" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" fill="none" />
            <circle cx="35" cy="30" r="2.5" fill="white" opacity="0.7" />

            {/* Face Group */}
            <motion.g animate={{ y: mood === 'thinking' ? 4 : 0 }} transition={{ duration: 0.4 }}>
                {/* Left Eye */}
                <g transform="translate(35, 45)">
                     <motion.path fill={mood === 'happy' || mood === 'love' || mood === 'sleepy' ? 'transparent' : '#334155'} stroke="#334155" strokeWidth={mood === 'happy' || mood === 'love' || mood === 'sleepy' ? "3" : "0"} strokeLinecap="round" animate={{ d: currentEyeShape.left }} />
                     {mood !== 'happy' && mood !== 'love' && mood !== 'sleepy' && !surprise && (<motion.circle r={blink ? 0.1 : 2.5} fill="white" style={{ x: pupilX, y: pupilY }} />)}
                     {surprise && <circle r="3" fill="white" />}
                </g>
                {/* Right Eye */}
                <g transform="translate(65, 45)">
                     <motion.path fill={mood === 'happy' || mood === 'love' || mood === 'sleepy' ? 'transparent' : '#334155'} stroke="#334155" strokeWidth={mood === 'happy' || mood === 'love' || mood === 'sleepy' ? "3" : "0"} strokeLinecap="round" animate={{ d: currentEyeShape.right }} />
                     {mood !== 'happy' && mood !== 'love' && mood !== 'sleepy' && !surprise && (<motion.circle r={blink ? 0.1 : 2.5} fill="white" style={{ x: pupilX, y: pupilY }} />)}
                     {surprise && <circle r="3" fill="white" />}
                </g>
            </motion.g>

            {/* Surprise Effect Lines */}
            <AnimatePresence>
                {surprise && (
                    <motion.g initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1.4, rotate: [0, 15, -15, 0] }} exit={{ opacity: 0 }} stroke={config.shadow} strokeWidth="2.5" strokeLinecap="round" style={{ originX: "50px", originY: "50px" }}>
                        <line x1="50" y1="5" x2="50" y2="-5" /> <line x1="85" y1="20" x2="92" y2="15" /> <line x1="15" y1="20" x2="8" y2="15" /> <circle cx="50" cy="50" r="45" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                    </motion.g>
                )}
            </AnimatePresence>
        </svg>

        <AnimatePresence>
            {mood === 'thinking' && !speech && <motion.div className="absolute -top-6 -right-2 text-2xl opacity-70" initial={{opacity:0, scale:0}} animate={{ opacity:1, scale:1, y: -5 }} exit={{opacity:0}}>💭</motion.div>}
            {mood === 'love' && !speech && <motion.div className="absolute -top-4 left-1/2 text-xl opacity-70" initial={{opacity:0}} animate={{ opacity:[0,1,0], y: -25, scale: [1, 1.2, 1] }} transition={{duration: 1.5, repeat: Infinity}}>❤️</motion.div>}
            {mood === 'sleepy' && !speech && <motion.div className="absolute -top-4 right-0 text-xl font-bold text-blue-300 opacity-70" initial={{opacity:0}} animate={{ opacity:[0,1,0], x: 10, y: -20 }} transition={{duration: 3, repeat: Infinity}}>Zzz</motion.div>}
            {mood === 'confused' && !speech && <motion.div className="absolute -top-6 left-2 text-2xl opacity-70" initial={{opacity:0, rotate: 0}} animate={{ opacity:1, rotate: [0, -10, 10, 0] }} exit={{opacity:0}}>❓</motion.div>}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export const MoodCompanion = memo(MoodCompanionComponent);