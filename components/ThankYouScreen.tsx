import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { RotateCcw, Share2, Download, Zap, Crown, Shield, Hexagon, Star, Fingerprint, QrCode, Facebook, Linkedin, Link as LinkIcon, Check, Copy, Phone, Edit2, Save } from 'lucide-react';
import { Background } from './Background';
import html2canvas from 'html2canvas';
import { SurveyMetrics } from '../types';

interface ThankYouScreenProps {
  answers: Record<string, string | number>;
  metrics: SurveyMetrics;
  onRestart: () => void;
}

// --- EXPANDED ARCHETYPES (12 Types) ---
const ARCHETYPES = [
  // 1. High Grades + Relationship + Productive
  {
    id: 'power_couple',
    title: "The Power Couple",
    emoji: "👑",
    desc: "You have it all. High grades, healthy relationship. You are literally God's favorite. How does it feel to win at life?",
    color: "from-amber-300 via-yellow-400 to-orange-500",
    primaryColor: "#f59e0b",
    rarity: "MYTHIC",
    rarityColor: "text-amber-400 border-amber-500/50 bg-amber-500/10",
    statLeft: "Ambition",
    statRight: "Romance"
  },
  // 2. High Grades + Single/Focused
  {
    id: 'academic_weapon',
    title: "The Academic Weapon",
    emoji: "📚",
    desc: "Love is temporary. GPA is forever. You're locked in, you don't check your phone, and you're carrying the curve.",
    color: "from-cyan-400 via-blue-500 to-indigo-600",
    primaryColor: "#06b6d4",
    rarity: "LEGENDARY",
    rarityColor: "text-cyan-400 border-cyan-500/50 bg-cyan-500/10",
    statLeft: "Grades",
    statRight: "Discipline"
  },
  // 3. Low Grades + Relationship/Talking (Distracted)
  {
    id: 'lover_brain',
    title: "The Lover Brain",
    emoji: "😍",
    desc: "Head in the clouds, heart on your sleeve. You might fail math, but you're getting an A+ in texting back immediately.",
    color: "from-rose-400 via-pink-500 to-fuchsia-600",
    primaryColor: "#f43f5e",
    rarity: "COMMON",
    rarityColor: "text-rose-400 border-rose-500/50 bg-rose-500/10",
    statLeft: "Focus",
    statRight: "Obsession"
  },
  // 4. Heartbroken
  {
    id: 'heartbroken_poet',
    title: "The Heartbroken Poet",
    emoji: "🥀",
    desc: "Turning pain into power (or at least into a really sad playlist). We believe in your comeback arc.",
    color: "from-gray-400 via-slate-500 to-zinc-600",
    primaryColor: "#9ca3af",
    rarity: "RARE",
    rarityColor: "text-gray-400 border-gray-500/50 bg-gray-500/10",
    statLeft: "Tears",
    statRight: "Resilience"
  },
  // 5. Single + Unbothered + High Focus + Introvert
  {
    id: 'lone_wolf',
    title: "The Lone Wolf",
    emoji: "🐺",
    desc: "No drama, just results. You study alone, you succeed alone. You protect your peace at all costs.",
    color: "from-emerald-400 via-teal-500 to-cyan-600",
    primaryColor: "#10b981",
    rarity: "EPIC",
    rarityColor: "text-emerald-400 border-emerald-500/50 bg-emerald-500/10",
    statLeft: "Independence",
    statRight: "Focus"
  },
  // 6. High Stress + Good Grades
  {
    id: 'chaos_coordinator',
    title: "Chaos Coordinator",
    emoji: "🌀",
    desc: "Stressed, blessed, and coffee obsessed. You're barely holding it together, but your grades are somehow fine?",
    color: "from-violet-400 via-purple-500 to-fuchsia-600",
    primaryColor: "#8b5cf6",
    rarity: "UNCOMMON",
    rarityColor: "text-violet-400 border-violet-500/50 bg-violet-500/10",
    statLeft: "Stress",
    statRight: "Performance"
  },
  // 7. Talking + Distracted (High impact)
  {
    id: 'hopeless_romantic',
    title: "Hopeless Romantic",
    emoji: "💌",
    desc: "You're not dating, but you're definitely not studying. That situationship is a full-time job right now.",
    color: "from-pink-300 via-rose-400 to-red-500",
    primaryColor: "#fb7185",
    rarity: "COMMON",
    rarityColor: "text-pink-400 border-pink-500/50 bg-pink-500/10",
    statLeft: "Delusion",
    statRight: "Hope"
  },
  // 8. Single + No Impact + Never checks phone
  {
    id: 'unbothered_icon',
    title: "The Unbothered Icon",
    emoji: "💅",
    desc: "Notifications off. Grades up. You simply do not perceive drama. Teach us your ways.",
    color: "from-fuchsia-300 via-purple-400 to-indigo-500",
    primaryColor: "#c084fc",
    rarity: "MYTHIC",
    rarityColor: "text-fuchsia-400 border-fuchsia-500/50 bg-fuchsia-500/10",
    statLeft: "Chill",
    statRight: "Success"
  },
  // 9. Relationship + Studies MORE
  {
    id: 'locked_in_lover',
    title: "The Locked-In Lover",
    emoji: "🚀",
    desc: "You found someone who actually helps you study? That's the ultimate flex. Keep them forever.",
    color: "from-lime-400 via-green-500 to-emerald-600",
    primaryColor: "#84cc16",
    rarity: "LEGENDARY",
    rarityColor: "text-lime-400 border-lime-500/50 bg-lime-500/10",
    statLeft: "Synergy",
    statRight: "Love"
  },
  // 10. Low Focus + Stressed
  {
    id: 'academic_victim',
    title: "The Academic Victim",
    emoji: "💀",
    desc: "School is cooking you right now. Focus is at 0%. It's rough out here. Maybe take a nap?",
    color: "from-red-500 via-orange-500 to-amber-500",
    primaryColor: "#ef4444",
    rarity: "COMMON",
    rarityColor: "text-red-400 border-red-500/50 bg-red-500/10",
    statLeft: "Pain",
    statRight: "Suffering"
  },
  // 11. Average everything
  {
    id: 'npc_energy',
    title: "The Balanced Zen",
    emoji: "🧘",
    desc: "Perfectly average. No major drama, decent grades. You are the glue holding society together.",
    color: "from-sky-300 via-blue-400 to-cyan-500",
    primaryColor: "#38bdf8",
    rarity: "RARE",
    rarityColor: "text-sky-400 border-sky-500/50 bg-sky-500/10",
    statLeft: "Balance",
    statRight: "Peace"
  },
  // 12. "It's Complicated" equivalent
  {
    id: 'mystery_main',
    title: "The Mystery Lead",
    emoji: "🎭",
    desc: "Your answers are all over the place. Are you okay? Are you in love? Who knows. It's a mystery.",
    color: "from-indigo-400 via-violet-500 to-purple-600",
    primaryColor: "#818cf8",
    rarity: "EPIC",
    rarityColor: "text-indigo-400 border-indigo-500/50 bg-indigo-500/10",
    statLeft: "Mystery",
    statRight: "Intrigue"
  }
];

const WhatsAppIcon = ({ size = 16, className = "" }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
        <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
);


export const ThankYouScreen: React.FC<ThankYouScreenProps> = ({ answers, metrics, onRestart }) => {
  const [stage, setStage] = useState<'calculating' | 'reveal'>('calculating');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Name Edit State (Purely Visual)
  const [editableName, setEditableName] = useState(String(answers['name'] || ''));
  const [nameFocused, setNameFocused] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // --- REFINED ARCHETYPE LOGIC ---
  const result = useMemo(() => {
    const focus = Number(answers['focus_level'] || 50);
    const status = String(answers['status'] || 'single');
    const impact = String(answers['romantic_thought_impact'] || 'none');
    const notifs = String(answers['notifications_freq'] || 'sometimes');
    const studyChange = String(answers['study_time_change'] || 'same');
    const mood = String(answers['mood_impact'] || 'neutral');
    const partner = String(answers['study_partner'] || 'na');

    // Priority 1: Heartbroken
    if (status === 'heartbroken') return ARCHETYPES.find(a => a.id === 'heartbroken_poet')!;

    // Priority 2: High Performers
    if (focus >= 80) {
        if (status === 'taken') {
            if (studyChange === 'more' || impact.includes('improve')) return ARCHETYPES.find(a => a.id === 'locked_in_lover')!;
            return ARCHETYPES.find(a => a.id === 'power_couple')!;
        }
        if (status === 'single') {
            if (notifs === 'never' || notifs === 'rarely') return ARCHETYPES.find(a => a.id === 'unbothered_icon')!;
            if (partner === 'separate' || partner === 'na') return ARCHETYPES.find(a => a.id === 'lone_wolf')!;
            return ARCHETYPES.find(a => a.id === 'academic_weapon')!;
        }
        return ARCHETYPES.find(a => a.id === 'chaos_coordinator')!;
    }

    // Priority 3: Low Performers
    if (focus <= 40) {
        if (status === 'taken' || status === 'talking') {
            if (impact.includes('reduce') || notifs === 'often' || notifs === 'very_often') {
                return ARCHETYPES.find(a => a.id === 'lover_brain')!;
            }
        }
        return ARCHETYPES.find(a => a.id === 'academic_victim')!;
    }

    // Priority 4: Specific Behaviors
    if (status === 'talking' && (impact.includes('reduce') || notifs === 'often' || notifs === 'very_often')) {
        return ARCHETYPES.find(a => a.id === 'hopeless_romantic')!;
    }

    if ((mood.includes('stressed') || notifs === 'often') && focus >= 50) {
        return ARCHETYPES.find(a => a.id === 'chaos_coordinator')!;
    }

    // Priority 5: Balanced
    if (focus > 40 && focus < 80) {
        if (mood.includes('happy') || mood.includes('neutral') || mood.includes('relaxed')) {
             return ARCHETYPES.find(a => a.id === 'npc_energy')!;
        }
    }

    return ARCHETYPES.find(a => a.id === 'mystery_main')!;
  }, [answers]);

  useEffect(() => {
    const timer = setTimeout(() => setStage('reveal'), 3000);
    return () => clearTimeout(timer);
  }, []);

  // --- 3D Card Physics ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-15deg", "15deg"]);
  const glareX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = e.clientX - rect.left;
    const mouseYPos = e.clientY - rect.top;
    x.set(mouseXPos / width - 0.5);
    y.set(mouseYPos / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // --- Stats Calculation ---
  const leftStatValue = useMemo(() => {
    if (result.id === 'academic_weapon') return 99;
    if (result.id === 'lone_wolf') return 95;
    if (result.id === 'academic_victim') return 15;
    if (result.id.includes('academic') || result.id === 'power_couple') return Number(answers['focus_level'] || 80);
    if (result.id === 'lover_brain') return 20; 
    if (result.id === 'heartbroken_poet') return 90; 
    return Number(answers['focus_level'] || 50); 
  }, [result, answers]);

  const rightStatValue = useMemo(() => {
    const scale = Number(answers['emotional_effect_strength'] || 1);
    if (result.id === 'unbothered_icon') return 100;
    if (result.id === 'academic_weapon') return 100;
    if (result.id === 'lover_brain') return 95;
    return (scale / 5) * 100;
  }, [answers, result]);

  // --- Image Generation ---
  const generateImage = async (): Promise<Blob | null> => {
    if (!exportRef.current) return null;
    setIsProcessing(true);
    
    try {
        const element = exportRef.current;
        await document.fonts.ready;
        const canvas = await html2canvas(element, {
            backgroundColor: '#05050a', 
            scale: 2, 
            useCORS: true,
            logging: false,
            allowTaint: true,
            width: 600,
            height: 900,
            scrollX: 0,
            scrollY: 0,
            x: 0,
            y: 0,
            ignoreElements: (el) => el.classList.contains('no-export')
        });

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                setIsProcessing(false);
                resolve(blob);
            }, 'image/png', 1.0);
        });
    } catch (error) {
        console.error("Generation failed:", error);
        setIsProcessing(false);
        return null;
    }
  };

  const handleDownload = async () => {
    const blob = await generateImage();
    if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `VibeCheck_${result.id}_${Date.now()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    }
  };

  const handleShare = (platform: 'linkedin' | 'facebook' | 'copy' | 'whatsapp') => {
      const text = `I got "${result.title}" on the Love vs Grades Vibe Check! What's your study vibe?`;
      const url = window.location.href; 
      
      if (platform === 'copy') {
          navigator.clipboard.writeText(`${text} ${url}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      } else if (platform === 'linkedin') {
          window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text + " " + url)}`, '_blank');
      } else if (platform === 'facebook') {
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank');
      } else if (platform === 'whatsapp') {
          window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, '_blank');
      }
  };

  const displayUserName = editableName.trim() === '' ? 'Anonymous' : editableName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#020205]">
      <div className="absolute inset-0 z-0">
         <Background moodIntensity={result.id === 'lover_brain' ? 'love' : 'excited'} />
         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      </div>

      <AnimatePresence mode="wait">
        
        {/* CALCULATING LOADER */}
        {stage === 'calculating' && (
           <motion.div 
             key="calculating"
             exit={{ opacity: 0, scale: 2, filter: 'blur(20px)' }}
             className="relative z-20 flex flex-col items-center justify-center w-full h-full"
           >
               <div className="relative">
                   <motion.div 
                     animate={{ rotate: 360 }}
                     transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                     className="w-32 h-32 rounded-full border border-t-transparent border-l-transparent border-white/20"
                   />
                   <motion.div 
                     animate={{ rotate: -360 }}
                     transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                     className="absolute inset-2 rounded-full border border-b-transparent border-r-transparent border-white/40"
                   />
                   <div className="absolute inset-0 flex items-center justify-center">
                       <Zap className="text-white animate-pulse" size={32} />
                   </div>
               </div>
               <div className="mt-8 font-mono text-xs space-y-2 text-center text-gray-400">
                   <p className="tracking-widest animate-pulse">ANALYZING GPA...</p>
                   <p className="tracking-widest animate-pulse delay-75">DETECTING CRUSH...</p>
                   <p className="tracking-widest animate-pulse delay-150">CALCULATING VIBE...</p>
               </div>
           </motion.div>
        )}

        {/* REVEAL */}
        {stage === 'reveal' && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="relative z-20 flex flex-col items-center gap-6 w-full max-w-md px-6 py-6 h-full justify-center"
          >
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center shrink-0 w-full flex flex-col items-center"
            >
                <h2 className="text-white font-display font-bold text-3xl mb-1">Your Vibe Check</h2>
                
                {/* NAME EDIT FIELD - Visual Only */}
                <div className="relative mt-2 w-full max-w-[200px] group flex flex-col items-center">
                    <input 
                        type="text"
                        value={editableName}
                        onChange={(e) => setEditableName(e.target.value)}
                        onFocus={() => setNameFocused(true)}
                        onBlur={() => setNameFocused(false)}
                        placeholder="Enter Name"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center text-white outline-none focus:border-cyan-400 font-bold tracking-widest uppercase text-sm transition-all"
                        maxLength={20}
                    />
                    <div className={`absolute right-3 top-3 pointer-events-none transition-opacity ${nameFocused || editableName.length > 0 ? 'opacity-0' : 'opacity-50'}`}>
                        <Edit2 size={12} className="text-gray-400" />
                    </div>
                </div>
            </motion.div>

            {/* --- VISUAL INTERACTIVE CARD (WEB VERSION) --- */}
            <motion.div
                style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="relative w-[300px] h-[450px] rounded-[20px] shadow-2xl group cursor-default perspective-1000 shrink-0"
            >
                <div 
                    ref={cardRef} 
                    className="relative w-full h-full rounded-[20px] overflow-hidden bg-[#0a0a0a] border border-white/10 transform-style-3d shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                    style={{ transform: 'translateZ(0)' }}
                >
                    {/* SCALING CONTAINER */}
                    <div style={{ width: '600px', height: '900px', transform: 'scale(0.5)', transformOrigin: 'top left' }}>
                         <ArchetypeCard result={result} leftStatValue={leftStatValue} rightStatValue={rightStatValue} userName={displayUserName} />
                    </div>

                    {/* Glare Effect */}
                    <motion.div 
                        style={{ 
                            background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.15), transparent 40%)`,
                            opacity: 0.6
                        }}
                        className="absolute inset-0 rounded-[20px] pointer-events-none mix-blend-overlay z-20"
                    />
                </div>
            </motion.div>

            {/* Actions & Sharing */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="flex flex-col items-center gap-4 w-full shrink-0"
            >
                <div className="flex w-full gap-3">
                    <button 
                        onClick={handleDownload}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50 shadow-lg shadow-white/10"
                    >
                        {isProcessing ? <Zap size={16} className="animate-spin"/> : <Download size={16} />}
                        {isProcessing ? 'Saving...' : 'Save Card'}
                    </button>
                    
                    <button 
                        onClick={onRestart}
                        className="flex items-center justify-center px-4 py-3.5 rounded-xl bg-white/10 text-white border border-white/20 font-bold hover:bg-white/20 transition-all"
                        title="Restart"
                    >
                        <RotateCcw size={16} /> 
                    </button>
                </div>

                {/* Social Buttons */}
                <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-3">Share:</span>
                    
                    <button onClick={() => handleShare('whatsapp')} className="p-2 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all border border-[#25D366]/20">
                        <WhatsAppIcon size={16} />
                    </button>

                    <button onClick={() => handleShare('linkedin')} className="p-2 rounded-xl bg-[#0077b5]/10 text-[#0077b5] hover:bg-[#0077b5] hover:text-white transition-all border border-[#0077b5]/20">
                        <Linkedin size={16} />
                    </button>
                    
                    <button onClick={() => handleShare('facebook')} className="p-2 rounded-xl bg-[#1877f2]/10 text-[#1877f2] hover:bg-[#1877f2] hover:text-white transition-all border border-[#1877f2]/20">
                        <Facebook size={16} />
                    </button>

                    <button onClick={() => handleShare('copy')} className="relative p-2 rounded-xl bg-white/5 text-gray-300 hover:bg-white hover:text-black transition-all border border-white/10 group">
                        {copied ? <Check size={16} className="text-emerald-500 group-hover:text-black" /> : <Copy size={16} />}
                        {copied && <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] bg-emerald-500 text-black px-2 py-1 rounded-md font-bold">Copied!</span>}
                    </button>
                </div>

            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HIDDEN EXPORT CARD --- */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
          <div 
             ref={exportRef} 
             id="export-card" 
             style={{ width: '600px', height: '900px', backgroundColor: '#05050a' }} 
          >
              <ArchetypeCard result={result} leftStatValue={leftStatValue} rightStatValue={rightStatValue} userName={displayUserName} />
          </div>
      </div>

    </div>
  );
};

// --- UNIFIED ARCHETYPE CARD COMPONENT ---
const ArchetypeCard = ({ result, leftStatValue, rightStatValue, userName }: any) => {
    // Exact Pixel Sizing for 600x900 canvas
    const titleLength = result.title.length;
    const titleFontSize = titleLength > 20 ? '42px' : '56px';
    const emojiSize = titleLength > 20 ? '160px' : '200px';

    const gradientStyle = {
        background: `radial-gradient(circle at 50% 30%, ${result.primaryColor}44 0%, #05050a 70%)`
    };

    return (
        <div style={{
            width: '600px',
            height: '900px',
            backgroundColor: '#05050a',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: '"Syne", sans-serif',
            color: 'white'
        }}>
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                ...gradientStyle,
                zIndex: 0
            }} />
            
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                opacity: 0.05,
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
                zIndex: 1
            }} />

            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
                padding: '60px 40px', boxSizing: 'border-box',
                zIndex: 10
            }}>
                
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.8 }}>
                    <div style={{ width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '6px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                         <span style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.3em', color: 'white', textTransform: 'uppercase', fontWeight: 'bold', fontSize: '14px' }}>VIBE CHECK</span>
                         <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', marginTop: '6px' }}>{new Date().toLocaleDateString()}</span>
                    </div>
                    <div style={{ width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '6px' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                    <div style={{ 
                        padding: '12px 28px', borderRadius: '50px',
                        border: `2px solid ${result.primaryColor}`,
                        color: result.primaryColor, 
                        backgroundColor: '#111', 
                        fontSize: '14px', fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase',
                        marginBottom: '50px',
                        boxShadow: `0 0 20px ${result.primaryColor}33`
                    }}>
                        {result.rarity}
                    </div>

                    <div style={{ 
                        fontSize: emojiSize, 
                        lineHeight: 1, 
                        marginBottom: '40px',
                        textShadow: `0 0 60px ${result.primaryColor}66`
                    }}>
                        {result.emoji}
                    </div>

                    <h1 style={{ 
                        fontSize: titleFontSize, fontWeight: 800, 
                        lineHeight: '1', textTransform: 'uppercase', 
                        textAlign: 'center', 
                        color: result.primaryColor,
                        margin: '0 0 20px 0',
                        textShadow: `0 0 15px ${result.primaryColor}44`
                    }}>
                        {result.title}
                    </h1>

                    <div style={{ width: '80px', height: '4px', backgroundColor: '#333', borderRadius: '4px', marginBottom: '24px' }} />

                    {userName !== 'Anonymous' && (
                        <div style={{ 
                            fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase', 
                            letterSpacing: '0.2em', color: 'white', marginBottom: '16px' 
                        }}>
                            {userName}
                        </div>
                    )}

                    <p style={{ 
                        fontSize: '20px', fontWeight: 500, lineHeight: '1.6', 
                        color: '#e5e7eb', textAlign: 'center', 
                        maxWidth: '500px', margin: 0,
                        fontFamily: '"Inter", sans-serif'
                    }}>
                        "{result.desc}"
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '30px', width: '100%', marginTop: 'auto' }}>
                    <ExportStatBox label={result.statLeft} value={leftStatValue} color={result.primaryColor} />
                    <ExportStatBox label={result.statRight} value={rightStatValue} color={result.primaryColor} />
                </div>

            </div>

            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                border: '16px solid #0a0a10',
                pointerEvents: 'none',
                zIndex: 20
            }} />
            <div style={{
                position: 'absolute', top: '16px', left: '16px', right: '16px', bottom: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px',
                pointerEvents: 'none',
                zIndex: 20
            }} />
        </div>
    );
};

const ExportStatBox = ({ label, value, color }: any) => (
    <div style={{
        flex: 1,
        backgroundColor: '#111',
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid #333'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 'bold' }}>{label}</div>
            <div style={{ fontSize: '14px', fontFamily: '"JetBrains Mono", monospace', color: '#9ca3af' }}>{Math.round(value)}%</div>
        </div>
        <div style={{ height: '12px', width: '100%', backgroundColor: '#222', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ 
                height: '100%', width: `${value}%`, 
                backgroundColor: color, 
                borderRadius: '999px'
            }} />
        </div>
    </div>
);