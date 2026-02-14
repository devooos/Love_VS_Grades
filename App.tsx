import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Background } from './components/Background';
import { QuestionCard } from './components/QuestionCard';
import { ProgressBar } from './components/ProgressBar';
import { InsightsDashboard } from './components/InsightsDashboard';
import { MoodCompanion } from './components/MoodCompanion';
import { SoundProvider, useSound } from './components/SoundManager';
import { DataService } from './services/DataService';
import { SURVEY_QUESTIONS } from './constants';
import { SurveyState, SurveyMetrics, CompanionMood } from './types';
import { ThankYouScreen } from './components/ThankYouScreen';
import { PasswordModal } from './components/PasswordModal';
import { Volume2, VolumeX, BarChart2, ArrowLeft, ArrowRight, Zap, Calculator, Heart, Sparkles } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isMuted, toggleMute, playSound } = useSound();
  const [currentView, setCurrentView] = useState<'survey' | 'insights'>('survey');
  const [isInteracting, setIsInteracting] = useState(false);
  const [reactionTrigger, setReactionTrigger] = useState(0);
  const [hoveredMood, setHoveredMood] = useState<CompanionMood | null>(null);
  
  // Transitions Lock
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Insights Security
  const [isInsightsUnlocked, setIsInsightsUnlocked] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // --- Optimized Physics & Mouse Tracking ---
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Throttle mouse updates for performance
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    requestAnimationFrame(() => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        mouseX.set(clientX - innerWidth / 2);
        mouseY.set(clientY - innerHeight / 2);
    });
  }, [mouseX, mouseY]);
  
  // Magnetic Pull for Start Button (Stronger pull)
  const btnX = useSpring(useTransform(mouseX, [-window.innerWidth/2, window.innerWidth/2], [-60, 60]), { stiffness: 120, damping: 10 });
  const btnY = useSpring(useTransform(mouseY, [-window.innerHeight/2, window.innerHeight/2], [-60, 60]), { stiffness: 120, damping: 10 });
  
  // Parallax Layers
  const moveX = useSpring(useTransform(mouseX, [-window.innerWidth, window.innerWidth], [-40, 40]), { damping: 30, stiffness: 100 });
  const moveY = useSpring(useTransform(mouseY, [-window.innerHeight, window.innerHeight], [-40, 40]), { damping: 30, stiffness: 100 });
  const inverseMoveX = useTransform(moveX, val => -val);
  const inverseMoveY = useTransform(moveY, val => -val);
  
  // Initialize state
  const [state, setState] = useState<SurveyState>(() => {
    const saved = DataService.loadProgress();
    if (saved && !saved.isCompleted) return saved;
    return {
        answers: {},
        metrics: {
            startTime: Date.now(),
            questionStartTimes: {},
            longPauses: [],
            totalTimeSeconds: 0,
            averageTimePerQuestion: 0
        },
        currentQuestionIndex: 0,
        isCompleted: false,
        hasStarted: false,
        isRushing: false
    };
  });

  useEffect(() => {
    if (state.hasStarted && !state.isCompleted) {
        DataService.saveProgress(state);
    }
  }, [state]);

  const currentQuestion = SURVEY_QUESTIONS[state.currentQuestionIndex];
  const progress = state.currentQuestionIndex + (state.isCompleted ? 1 : 0);

  // Determine Mood Logic
  const currentMood: CompanionMood = useMemo(() => {
    if (hoveredMood) return hoveredMood;
    if (state.isCompleted) return 'love'; 
    if (!state.hasStarted) return 'neutral';
    if (state.isRushing) return 'stressed';
    if (isInteracting) return 'thinking';
    
    const focus = state.answers['focus_level'] as number;
    const status = state.answers['status'] as string;
    
    if (status === 'taken' || status === 'talking') return 'love';
    if (focus !== undefined && focus < 30) return 'sleepy';
    if (focus !== undefined && focus > 80) return 'excited';
    
    return 'neutral';
  }, [state.answers, state.isCompleted, state.hasStarted, state.isRushing, isInteracting, hoveredMood]);

  const handleStart = () => {
    playSound('click');
    setReactionTrigger(prev => prev + 1);
    setState(prev => ({ 
        ...prev, 
        hasStarted: true,
        metrics: {
            ...prev.metrics,
            startTime: Date.now(),
            questionStartTimes: { [SURVEY_QUESTIONS[0].id]: Date.now() }
        }
    }));
  };

  const handleAnswer = useCallback((value: string | number) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [SURVEY_QUESTIONS[prev.currentQuestionIndex].id]: value }
    }));
    setReactionTrigger(prev => prev + 1);
  }, []);

  const handleNext = async () => {
    // LOCK: Prevent double clicks
    if (isTransitioning) return;
    setIsTransitioning(true);

    const now = Date.now();
    const startTime = state.metrics.questionStartTimes[currentQuestion.id] || now;
    if (now - startTime < 1500 && currentQuestion.type !== 'choice') {
         setState(prev => ({ ...prev, isRushing: true }));
         setTimeout(() => setState(prev => ({ ...prev, isRushing: false })), 2000);
    }

    playSound('success');

    // Add a small delay for animation, then unlock
    setTimeout(async () => {
        if (state.currentQuestionIndex < SURVEY_QUESTIONS.length - 1) {
          const nextQuestion = SURVEY_QUESTIONS[state.currentQuestionIndex + 1];
          setState(prev => ({ 
              ...prev, 
              currentQuestionIndex: prev.currentQuestionIndex + 1,
              metrics: {
                  ...prev.metrics,
                  questionStartTimes: { ...prev.metrics.questionStartTimes, [nextQuestion.id]: now }
              }
          }));
        } else {
          // FINISHED
          const finalMetrics = { ...state.metrics, totalTimeSeconds: (now - state.metrics.startTime) / 1000 };
          
          // --- IMMEDIATE SAVE ---
          // Saves strictly after completion of the final question (Reflection)
          const finalAnswers = { ...state.answers, name: 'Anonymous' };
          DataService.saveSubmission(finalAnswers, finalMetrics);
          
          setState(prev => ({ ...prev, isCompleted: true, metrics: finalMetrics }));
          DataService.clearProgress();
          triggerConfetti();
        }
        setIsTransitioning(false);
    }, 400); // 400ms transition buffer
  };

  const triggerConfetti = () => {
    if (window.confetti) {
      window.confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#a78bfa', '#f472b6', '#ffffff'] });
    }
  };
  
  const handleInsightsClick = () => {
      if (currentView === 'insights') {
          setCurrentView('survey');
      } else {
          if (isInsightsUnlocked) {
              setCurrentView('insights');
          } else {
              setShowPasswordModal(true);
          }
      }
  };

  const canProceed = state.answers[currentQuestion?.id] !== undefined && state.answers[currentQuestion?.id] !== '';

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#020205] selection:bg-rose-500/30 selection:text-white" onMouseMove={handleMouseMove} ref={containerRef}>
      
      {/* Background with Context Awareness - Memoized */}
      {state.hasStarted && (
        <Background 
          moodIntensity={currentMood} 
          context={currentQuestion?.context} 
        />
      )}
      
      {/* Floating Controls */}
      {!state.isCompleted && (
          <nav className="fixed top-6 left-6 right-6 flex justify-between items-center z-50 mix-blend-difference text-white">
              <div 
                onClick={handleInsightsClick}
                className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity flex items-center gap-2 group"
              >
                 <div className="p-2.5 rounded-full bg-white/10 border border-white/5 group-hover:bg-white/20 transition-colors backdrop-blur-md">
                     {currentView === 'insights' ? <ArrowLeft size={18} /> : <BarChart2 size={18} />}
                 </div>
                 <span className="text-[10px] tracking-[0.2em] uppercase font-bold hidden md:inline group-hover:tracking-[0.25em] transition-all">
                    {currentView === 'insights' ? 'Back' : 'Insights'}
                 </span>
              </div>
              
              <button 
                onClick={toggleMute} 
                className="opacity-70 hover:opacity-100 transition-opacity p-2.5 rounded-full bg-white/10 border border-white/5 hover:bg-white/20 backdrop-blur-md"
              >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
          </nav>
      )}

      {/* Mood Companion - Memoized */}
      {!state.isCompleted && (
        <MoodCompanion 
            mood={currentMood} 
            reactionTrigger={reactionTrigger} 
            questionId={currentQuestion?.id}
            className="fixed bottom-6 left-6 z-40 w-24 h-24 md:w-32 md:h-32 hidden md:flex items-center justify-center pointer-events-none"
        />
      )}

      {/* MAIN CONTENT */}
      <main className="relative z-10 w-full h-full flex flex-col">
        
        <AnimatePresence mode="wait">
          
          {/* VIEW: INSIGHTS */}
          {currentView === 'insights' && !state.isCompleted && (
              <motion.div 
                key="insights" 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="w-full h-screen pt-20 px-4 flex justify-center"
              >
                  <InsightsDashboard />
              </motion.div>
          )}

          {/* VIEW: SURVEY FLOW */}
          {currentView === 'survey' && (
            <>
              {/* --- LANDING PAGE: REDESIGNED --- */}
              {!state.hasStarted && (
                <motion.div 
                  key="landing-split"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 1.2, filter: 'blur(20px)' }}
                  transition={{ duration: 0.8 }}
                  className="relative w-full h-screen flex flex-col overflow-hidden"
                >
                    {/* Animated Grain Overlay */}
                    <div className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
                    
                    {/* Marquee Background Top */}
                    <div className="absolute top-10 left-0 w-full overflow-hidden opacity-5 z-0 -rotate-3 select-none">
                        <motion.div 
                            animate={{ x: ["0%", "-50%"] }} 
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="flex whitespace-nowrap text-[15vw] font-display font-black leading-none text-white"
                        >
                            LOVE GRADES LOVE GRADES LOVE GRADES LOVE GRADES
                        </motion.div>
                    </div>

                    {/* Marquee Background Bottom */}
                    <div className="absolute bottom-10 left-0 w-full overflow-hidden opacity-5 z-0 rotate-3 select-none">
                        <motion.div 
                            animate={{ x: ["-50%", "0%"] }} 
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                            className="flex whitespace-nowrap text-[15vw] font-display font-black leading-none text-white"
                        >
                            FOCUS DRAMA FOCUS DRAMA FOCUS DRAMA FOCUS DRAMA
                        </motion.div>
                    </div>

                    {/* Content Container */}
                    <div className="relative z-10 w-full h-full flex flex-col md:flex-row">
                        
                        {/* LEFT: LOVE */}
                        <div className="relative flex-1 h-1/2 md:h-full flex items-center justify-center md:justify-end md:pr-10 group">
                            <motion.div style={{ x: moveX, y: moveY }} className="absolute inset-0 bg-rose-500/5 blur-[100px] rounded-full scale-50 group-hover:scale-75 transition-transform duration-700" />
                            <motion.div 
                                initial={{ x: -100, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="text-center md:text-right relative z-10"
                            >
                                <h1 className="font-serif italic font-light text-[15vw] md:text-[10vw] text-rose-200/90 leading-none mix-blend-screen drop-shadow-[0_0_30px_rgba(244,63,94,0.5)]">
                                    Love
                                </h1>
                                <p className="text-rose-200/50 font-mono text-sm tracking-widest uppercase mt-4">The Heart</p>
                            </motion.div>
                            {/* Floating Elements */}
                            <motion.div animate={{ y: [0,-15,0], rotate: [0,5,-5,0] }} transition={{ duration: 6, repeat: Infinity }} className="absolute top-[30%] left-[20%] text-rose-400 opacity-20"><Heart size={64} /></motion.div>
                        </div>

                        {/* RIGHT: GRADES */}
                        <div className="relative flex-1 h-1/2 md:h-full flex items-center justify-center md:justify-start md:pl-10 group">
                            <motion.div style={{ x: inverseMoveX, y: inverseMoveY }} className="absolute inset-0 bg-cyan-500/5 blur-[100px] rounded-full scale-50 group-hover:scale-75 transition-transform duration-700" />
                            <motion.div 
                                initial={{ x: 100, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                className="text-center md:text-left relative z-10"
                            >
                                <h1 className="font-display font-black text-[15vw] md:text-[10vw] text-cyan-200/90 leading-none mix-blend-screen tracking-tighter drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                                    Grades
                                </h1>
                                <p className="text-cyan-200/50 font-mono text-sm tracking-widest uppercase mt-4">The Mind</p>
                            </motion.div>
                             {/* Floating Elements */}
                             <motion.div animate={{ y: [0,15,0], rotate: [0,-5,5,0] }} transition={{ duration: 7, repeat: Infinity }} className="absolute bottom-[30%] right-[20%] text-cyan-400 opacity-20"><Calculator size={64} /></motion.div>
                        </div>

                        {/* CENTER ACTION (MAGNETIC ORB) */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                            <motion.button
                                style={{ x: btnX, y: btnY }}
                                onClick={handleStart}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="group relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center cursor-none outline-none"
                            >
                                {/* Core Orb */}
                                <div className="absolute inset-0 rounded-full bg-white shadow-[0_0_50px_rgba(255,255,255,0.4)] group-hover:shadow-[0_0_80px_rgba(255,255,255,0.6)] transition-shadow duration-300" />
                                
                                {/* Orbit Rings */}
                                <div className="absolute inset-[-20%] border border-white/20 rounded-full animate-[spin_10s_linear_infinite]" />
                                <div className="absolute inset-[-40%] border border-white/10 rounded-full animate-[spin_15s_linear_infinite_reverse] scale-90" />
                                
                                <div className="relative z-10 flex flex-col items-center">
                                    <span className="font-display font-black text-4xl md:text-5xl italic tracking-tighter text-black mix-blend-screen group-hover:scale-110 transition-transform">VS</span>
                                    <span className="text-[10px] font-mono uppercase tracking-widest mt-1 text-black font-bold group-hover:tracking-[0.3em] transition-all">Start</span>
                                </div>
                            </motion.button>
                        </div>
                    </div>

                    {/* Bottom Prompt */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="absolute bottom-12 w-full text-center z-20 pointer-events-none"
                    >
                         <p className="text-white/40 text-xs font-mono uppercase tracking-[0.3em] animate-pulse">
                            Is your GPA safe?
                        </p>
                    </motion.div>
                </motion.div>
              )}

              {/* --- QUESTIONS FLOW --- */}
              {state.hasStarted && !state.isCompleted && (
                <motion.div className="w-full flex-1 flex flex-col items-center justify-center p-4">
                    
                    <div className="w-full max-w-4xl mb-8">
                       <ProgressBar progress={progress} total={SURVEY_QUESTIONS.length} />
                    </div>

                    <div className="relative w-full max-w-4xl min-h-[500px] flex items-center justify-center">
                        <AnimatePresence mode="popLayout" custom={1}>
                            <motion.div
                                key={currentQuestion.id}
                                custom={1}
                                initial={{ opacity: 0, x: 100, scale: 0.95, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, x: -100, scale: 0.95, filter: 'blur(10px)' }}
                                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                className="w-full"
                            >
                                <QuestionCard 
                                  question={currentQuestion} 
                                  onAnswer={handleAnswer} 
                                  currentValue={state.answers[currentQuestion.id]}
                                  onPauseDetected={() => {}} 
                                  onInteractionChange={setIsInteracting}
                                  onMoodHover={setHoveredMood} 
                                  onNext={canProceed ? handleNext : undefined}
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Floating 'Next' Action - Bottom Right Fixed */}
                    <AnimatePresence>
                        {canProceed && (
                            <motion.button
                                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                                whileHover={{ scale: 1.05, x: 5 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={isTransitioning}
                                onClick={handleNext}
                                className="fixed bottom-8 right-8 z-50 pl-8 pr-6 py-4 rounded-full bg-white text-black font-bold text-sm tracking-[0.2em] shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] transition-all duration-300 flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {state.currentQuestionIndex === SURVEY_QUESTIONS.length - 1 ? 'FINISH' : 'NEXT'}
                                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center group-hover:rotate-[-45deg] transition-transform duration-300">
                                  <ArrowRight size={14} />
                                </div>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </motion.div>
              )}

              {/* END SCREEN */}
              {state.isCompleted && (
                  <ThankYouScreen 
                    answers={state.answers} 
                    metrics={state.metrics}
                    onRestart={() => {
                        DataService.clearProgress(); 
                        window.location.reload(); 
                    }} 
                  />
              )}
            </>
          )}

        </AnimatePresence>
      </main>

      {/* GLOBAL PASSWORD MODAL */}
      <PasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
        onSuccess={() => {
            setIsInsightsUnlocked(true);
            setCurrentView('insights');
        }} 
      />

    </div>
  );
};

const App: React.FC = () => (
  <SoundProvider>
    <AppContent />
  </SoundProvider>
);

export default App;