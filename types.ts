
export type QuestionType = 'choice' | 'slider' | 'mood' | 'text';
export type QuestionContext = 'love' | 'study' | 'general';
export type CompanionMood = 'neutral' | 'happy' | 'love' | 'sleepy' | 'stressed' | 'excited' | 'thinking' | 'sad' | 'confused';

export interface Option {
  label: string;
  emoji: string;
  value: string;
}

export interface SliderStop {
  value: number;
  label: string;
  emoji?: string;
}

export interface Question {
  id: string;
  section: string;
  context: QuestionContext; // For cursor logic
  title: string;
  subtitle?: string;
  type: QuestionType;
  options?: Option[]; // For choice and mood
  min?: number; // For slider
  max?: number; // For slider
  minLabel?: string;
  maxLabel?: string;
  placeholder?: string;
  tooltip?: string;
  sliderStops?: SliderStop[]; // For granular slider stages
}

export interface SurveyMetrics {
  startTime: number;
  questionStartTimes: Record<string, number>;
  longPauses: { questionId: string; duration: number }[];
  totalTimeSeconds: number;
  averageTimePerQuestion: number;
}

export interface SurveyState {
  answers: Record<string, string | number>;
  metrics: SurveyMetrics;
  currentQuestionIndex: number;
  isCompleted: boolean;
  hasStarted: boolean;
  isRushing: boolean; // UI state for rushing warning
}

export interface SurveySubmission {
  id: string;
  timestamp: string;
  answers: Record<string, string | number>;
  metrics: SurveyMetrics;
}

// Global definition for canvas-confetti
declare global {
  interface Window {
    confetti: any;
  }
}
