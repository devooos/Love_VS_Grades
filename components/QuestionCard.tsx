import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue, useTransform } from 'framer-motion';
import { Question, CompanionMood, QuestionContext, SliderStop } from '../types';
import { useSound } from './SoundManager';
import { Sparkles, ArrowRight, CornerDownLeft, CheckCircle2, Heart, Brain, Zap, GripHorizontal } from 'lucide-react';
import { DataService } from '../services/DataService';

interface QuestionCardProps {
  question: Question;
  onAnswer: (value: string | number) => void;
  currentValue?: string | number;
  onPauseDetected: (duration: number) => void;
  onInteractionChange?: (isInteracting: boolean) => void;
  onMoodHover?: (mood: CompanionMood | null) => void;
  onNext?: () => void;
}

const TYPING_PLACEHOLDERS = [
  "Take your time...",
  "No perfect answer needed.",
  "Just be real...",
  "We're listening...",
  "What's on your mind?"
];

// --- Theme Configurator based on Context ---
const getTheme = (context: QuestionContext) => {
    switch(context) {
        case 'love':
            return {
                accent: 'text-rose-400',
                border: 'border-rose-500/30',
                bgActive: 'bg-rose-500/10',
                glow: 'shadow-[0_0_50px_rgba(244,63,94,0.2)]',
                gradient: 'from-rose-500 via-pink-600 to-rose-500',
                icon: <Heart size={18} className="text-rose-400" />,
                trackColor: 'bg-rose-900/30',
                thumbBorder: 'border-rose-200',
                textGradient: 'from-rose-200 to-rose-400'
            };
        case 'study':
            return {
                accent: 'text-cyan-400',
                border: 'border-cyan-500/30',
                bgActive: 'bg-cyan-500/10',
                glow: 'shadow-[0_0_50px_rgba(6,182,212,0.2)]',
                gradient: 'from-cyan-500 via-blue-600 to-cyan-500',
                icon: <Brain size={18} className="text-cyan-400" />,
                trackColor: 'bg-cyan-900/30',
                thumbBorder: 'border-cyan-200',
                textGradient: 'from-cyan-200 to-cyan-400'
            };
    }
    // Default
    return {
        accent: 'text-violet-400',
        border: 'border-violet-500/30',
        bgActive: 'bg-violet-500/10',
        glow: 'shadow-[0_0_50px_rgba(139,92,246,0.2)]',
        gradient: 'from-violet-500 via-purple-600 to-violet-500',
        icon: <Zap size={18} className="text-violet-400" />,
        trackColor: 'bg-violet-900/30',
        thumbBorder: 'border-violet-200',
        textGradient: 'from-violet-200 to-violet-400'
    };
};

export const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  onAnswer, 
  currentValue, 
  onPauseDetected, 
  onInteractionChange,
  onMoodHover,
  onNext
}) => {
  const { playSound } = useSound();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pauseStartRef = useRef<number | null>(null);
  
  const theme = getTheme(question.context);

  // --- Dynamic Title Logic ---
  const displayTitle = useMemo(() => {
    const saved = DataService.loadProgress();
    const status = saved?.answers['status'];
    const isSingle = status === 'single' || status === 'heartbroken';

    if (isSingle) {
        if (question.id === 'romantic_thoughts_freq') return "If you were interested in someone, how often would they likely come to mind while studying?";
        if (question.id === 'romantic_thought_impact') return "If you were distracted by romance, how do you think it would affect your focus?";
        if (question.id === 'study_time_change') return "How would your study time change if you were emotionally involved?";
        if (question.id === 'mood_impact') return "How do you think a relationship would affect your mood at school?";
        if (question.id === 'emotional_effect_strength') return "Hypothetically, how strong of an effect would romance have on your concentration?";
    }
    return question.title;
  }, [question, currentValue]);

  // --- Spotlight Effect ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const spotlightBackground = useMotionTemplate`
    radial-gradient(
        800px circle at ${mouseX}px ${mouseY}px,
        rgba(255, 255, 255, 0.04),
        transparent 50%
    )
  `;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const { left, top } = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement> | React.ChangeEvent<HTMLInputElement>) => {
    onAnswer(e.target.value);
    playSound('type');
    setIsTyping(true);
    if (onInteractionChange) onInteractionChange(true);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    pauseStartRef.current = Date.now();

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (onInteractionChange) onInteractionChange(false);
      
      if (e.target.value.length > 5 && pauseStartRef.current) { 
        const duration = (Date.now() - pauseStartRef.current) / 1000;
        onPauseDetected(duration);
      }
    }, 1500);
  };

  // --- MOOD MAPPING ---
  const getMoodForOption = (value: string): CompanionMood => {
    const v = String(value).toLowerCase();
    if (v === '9') return 'excited'; 
    if (v === '10') return 'happy'; 
    if (v === '11') return 'stressed'; 
    if (v === '12') return 'excited'; 
    if (v === 'college') return 'thinking'; 
    if (v === 'single') return 'happy'; 
    if (v === 'talking') return 'confused'; 
    if (v === 'taken') return 'love'; 
    if (v === 'heartbroken') return 'sad'; 
    if (v === 'female') return 'happy';
    if (v === 'male') return 'happy';
    if (v === 'never') return 'thinking'; 
    if (v === 'rarely') return 'neutral';
    if (v === 'sometimes') return 'confused';
    if (v === 'often') return 'stressed'; 
    if (v === 'very_often') return 'sleepy'; 
    if (v === 'improve') return 'excited';
    if (v === 'slightly_improve') return 'happy';
    if (v === 'none') return 'neutral';
    if (v === 'slightly_reduce') return 'confused';
    if (v === 'greatly_reduce') return 'stressed';
    if (v === 'more') return 'thinking';
    if (v === 'same') return 'neutral';
    if (v === 'less') return 'sleepy';
    if (v.includes('happy')) return 'happy';
    if (v.includes('relaxed')) return 'happy'; 
    if (v.includes('distracted')) return 'confused';
    if (v.includes('stressed')) return 'stressed';
    if (v.includes('sad')) return 'sad';
    if (v.includes('neutral')) return 'neutral';
    return 'neutral';
  };

  // --- RENDERERS ---

  const renderChoices = () => (
    <div className="grid grid-cols-1 gap-4 mt-8 w-full">
      {question.options?.map((option, idx) => (
        <motion.button
          key={option.value}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05, type: 'spring' }}
          onClick={() => { playSound('click'); onAnswer(option.value); }}
          onMouseEnter={() => {
              if (onMoodHover) onMoodHover(getMoodForOption(option.value));
              playSound('hover');
          }}
          onMouseLeave={() => onMoodHover && onMoodHover(null)}
          className={`
            group relative flex items-center justify-between w-full p-6 rounded-2xl transition-all duration-300 overflow-hidden border
            ${currentValue === option.value 
              ? `${theme.bgActive} ${theme.border} ${theme.glow} shadow-lg ring-1 ring-white/10` 
              : `bg-[#0a0a0f] border-white/5 hover:border-white/20 hover:bg-[#12121a]`}
          `}
        >
          {/* Active Gradient Border/Background Line */}
          {currentValue === option.value && (
             <motion.div layoutId="activeChoice" className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${theme.gradient}`} />
          )}

          <div className="flex items-center gap-6 relative z-10 overflow-hidden">
            <span className="text-3xl filter drop-shadow-lg group-hover:scale-110 transition-transform duration-300 shrink-0">
                {option.emoji}
            </span>
            <span className={`text-lg font-medium tracking-wide text-left transition-colors duration-300 break-words font-sans ${currentValue === option.value ? 'text-white font-bold' : 'text-gray-400 group-hover:text-gray-200'}`}>
                {option.label}
            </span>
          </div>
          
          <div className="relative z-10 shrink-0 ml-4">
             {currentValue === option.value ? (
                 <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} className={theme.accent}>
                     <CheckCircle2 size={24} strokeWidth={3} />
                 </motion.div>
             ) : (
                 <div className="w-5 h-5 rounded-full border-2 border-white/10 group-hover:border-white/30 transition-colors" />
             )}
          </div>
        </motion.button>
      ))}
    </div>
  );

  const renderSlider = () => {
    // Local state for smooth dragging
    const min = question.min || 1;
    const max = question.max || 5;
    const [localVal, setLocalVal] = useState<number>(currentValue ? Number(currentValue) : Math.ceil((min + max)/2));
    const [isDragging, setIsDragging] = useState(false);

    // Sync when props change externally (unlikely during drag)
    useEffect(() => {
        if (!isDragging && currentValue !== undefined) {
            setLocalVal(Number(currentValue));
        }
    }, [currentValue, isDragging]);

    // Find closest stop
    let closestStop: SliderStop | undefined;
    const roundedLocal = Math.round(localVal);

    if (question.sliderStops) {
        closestStop = question.sliderStops.find(s => s.value === roundedLocal);
    }

    const percentage = ((localVal - min) / (max - min)) * 100;

    return (
        <div className="mt-12 px-2 w-full flex flex-col items-center">
            
            {/* Dynamic Label Display */}
            <div className="mb-10 text-center h-28 flex flex-col items-center justify-center bg-[#05050a]/60 rounded-3xl p-6 border border-white/10 w-full max-w-sm backdrop-blur-xl shadow-2xl transition-all duration-300 relative overflow-hidden">
                 <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${theme.gradient}`} />
                 <AnimatePresence mode="wait">
                     <motion.div
                        key={closestStop ? closestStop.value : 'unknown'}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="flex flex-col items-center relative z-10"
                     >
                        <span className="text-5xl mb-3 filter drop-shadow-xl">{closestStop?.emoji || "🎚️"}</span>
                        <span className={`text-xl font-bold uppercase tracking-[0.2em] font-display ${theme.accent}`}>
                            {closestStop?.label || `${roundedLocal}`}
                        </span>
                     </motion.div>
                 </AnimatePresence>
            </div>

            <div className="relative h-24 w-full flex items-center justify-center group px-4">
                
                {/* Visual Track Container */}
                <div className="absolute w-full h-2 bg-[#0a0a10] rounded-full overflow-hidden border border-white/5">
                    {/* Progress Fill */}
                    <div className={`absolute left-0 top-0 bottom-0 bg-gradient-to-r ${theme.gradient} opacity-50 blur-sm transition-all duration-75 ease-out`} style={{ width: `${percentage}%` }} />
                    <div className={`absolute left-0 top-0 bottom-0 bg-gradient-to-r ${theme.gradient} transition-all duration-75 ease-out`} style={{ width: `${percentage}%` }} />
                </div>

                {/* Tick Marks & Labels Container */}
                <div className="absolute inset-0 flex justify-between px-4 items-center pointer-events-none">
                    {[1, 2, 3, 4, 5].map(tick => {
                         const isActive = tick <= localVal;
                         return (
                             <div key={tick} className="flex flex-col items-center gap-4 relative">
                                 {/* Tick Mark */}
                                 <motion.div 
                                    animate={{ 
                                        height: isActive ? 24 : 12, 
                                        backgroundColor: isActive ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.1)'
                                    }}
                                    className={`w-1 rounded-full shadow-[0_0_10px_currentColor] transition-colors duration-300`}
                                 />
                                 {/* Number Label */}
                                 <span className={`text-[10px] font-mono font-bold transition-colors duration-300 absolute top-8 ${isActive ? 'text-white' : 'text-gray-600'}`}>{tick}</span>
                             </div>
                         );
                    })}
                </div>

                {/* Draggable Thumb (Visual) */}
                <motion.div 
                    className={`absolute h-10 w-10 bg-[#0a0a0a] border-2 ${theme.thumbBorder} rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] z-20 flex items-center justify-center pointer-events-none ${theme.accent}`}
                    style={{ left: `calc(${percentage}% - 20px)` }} 
                    animate={{ scale: isDragging ? 1.2 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                >
                     <div className={`w-3 h-3 rounded-full ${theme.bgActive} bg-current shadow-[0_0_10px_currentColor]`} />
                </motion.div>

                {/* Input (Invisible Overlay) - step=0.01 for smooth drag */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={0.01}
                    value={localVal}
                    onPointerDown={() => setIsDragging(true)}
                    onPointerUp={() => {
                        setIsDragging(false);
                        const snapped = Math.round(localVal);
                        setLocalVal(snapped);
                        onAnswer(snapped);
                        playSound('success');
                        
                        // Mood Feedback on Snap
                        if (onMoodHover) {
                            if (snapped >= 4) onMoodHover('excited');
                            else if (snapped <= 2) onMoodHover('sad');
                            else onMoodHover('thinking');
                        }
                    }}
                    onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setLocalVal(val);
                        // Haptic sound occasionally
                        if (Math.round(val) !== Math.round(localVal)) playSound('hover');
                    }}
                    className="relative w-full z-30 opacity-0 cursor-grab active:cursor-grabbing h-24" 
                />
            </div>

            {/* Labels */}
            <div className="w-full flex justify-between mt-6 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] font-mono px-1">
                <span>{question.minLabel}</span>
                <span>{question.maxLabel}</span>
            </div>
        </div>
    );
  };

  const renderMoodGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8 w-full">
      {question.options?.map((option) => (
        <button
          key={option.value}
          onClick={() => { playSound('click'); onAnswer(option.value); }}
          onMouseEnter={() => {
              if (onMoodHover) onMoodHover(getMoodForOption(option.value));
              playSound('hover');
          }}
          onMouseLeave={() => onMoodHover && onMoodHover(null)}
          className={`
            relative flex flex-col items-center justify-center p-6 rounded-3xl transition-all duration-300 aspect-square border
            ${currentValue === option.value 
                ? `${theme.bgActive} ${theme.border} scale-105 ${theme.glow} shadow-xl ring-1 ring-white/10` 
                : 'bg-[#0a0a0f] border-white/5 hover:border-white/20 hover:bg-[#12121a] hover:scale-105'}
          `}
        >
          <span className="text-5xl md:text-6xl mb-4 filter drop-shadow-xl transition-transform duration-300 hover:scale-110">{option.emoji}</span>
          <span className={`text-xs font-bold uppercase tracking-widest ${currentValue === option.value ? theme.accent : 'text-gray-500'}`}>{option.label}</span>
        </button>
      ))}
    </div>
  );

  const renderText = () => (
    <div className="mt-10 w-full relative group">
        <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-r ${theme.gradient} opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-1000 blur-sm`} />
        
        <div className="relative bg-[#05050a] rounded-2xl p-[1px]">
            {question.id === 'name' ? (
                <input
                    type="text"
                    className="w-full p-8 rounded-2xl bg-[#0a0a0f] focus:bg-[#0f0f15] outline-none text-2xl font-bold text-center text-white placeholder-gray-600 transition-all duration-300 font-display tracking-wider border border-white/5 focus:border-white/10"
                    placeholder={question.placeholder}
                    value={currentValue as string || ''}
                    onChange={handleTextChange}
                    onFocus={() => onMoodHover && onMoodHover('happy')}
                    onBlur={() => onMoodHover && onMoodHover(null)}
                    maxLength={20}
                />
            ) : (
                <textarea
                    className="w-full h-48 p-6 rounded-2xl bg-[#0a0a0f] focus:bg-[#0f0f15] outline-none text-lg font-light leading-relaxed text-gray-100 placeholder-gray-600 resize-none transition-all duration-300 font-serif border border-white/5 focus:border-white/10"
                    placeholder={question.placeholder}
                    value={currentValue as string || ''}
                    onChange={handleTextChange}
                    onFocus={() => onMoodHover && onMoodHover('thinking')}
                    onBlur={() => onMoodHover && onMoodHover(null)}
                />
            )}
        </div>
        
        <div className="absolute bottom-4 right-6 text-[10px] text-gray-500 font-mono tracking-widest uppercase flex items-center gap-2">
            {(currentValue as string || '').length} CHARS <CornerDownLeft size={10} />
        </div>
    </div>
  );

  return (
    <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        className="relative group w-full transition-all duration-500"
    >
        {/* Volumetric Glass Card */}
        <div className={`absolute inset-0 bg-[#020205]/80 backdrop-blur-xl border border-white/10 rounded-[40px] shadow-2xl z-0 transition-all duration-500 ${theme.glow}`} />
        
        {/* Spotlight Effect Gradient */}
        <motion.div
            className="pointer-events-none absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[40px]"
            style={{ background: spotlightBackground }}
        />

        <div className="relative z-10 p-6 md:p-12 flex flex-col items-start h-full">
            {/* Question Context Badge */}
            <div className="mb-8 flex items-center gap-3 w-full justify-between">
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border bg-black/40 backdrop-blur-md ${theme.border}`}>
                    {theme.icon}
                    <span className={`text-[10px] font-bold tracking-[0.2em] uppercase font-mono ${theme.accent}`}>
                        {question.section}
                    </span>
                </div>
            </div>

            {/* RESPONSIVE TITLE */}
            <h2 className={`text-2xl sm:text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-br ${theme.textGradient} leading-[1.1] mb-4 drop-shadow-sm w-full break-words font-display font-bold`}>
                {displayTitle}
            </h2>

            {question.subtitle && (
                <p className="text-sm md:text-base text-gray-400 font-light mb-2 leading-relaxed max-w-xl font-sans opacity-90 break-words">
                    {question.subtitle}
                </p>
            )}

            <div className="w-full relative z-20">
                {question.type === 'choice' && renderChoices()}
                {question.type === 'slider' && renderSlider()}
                {question.type === 'mood' && renderMoodGrid()}
                {question.type === 'text' && renderText()}
            </div>
        </div>
    </div>
  );
};