import { Question } from './types';

export const SURVEY_QUESTIONS: Question[] = [
  // Section 0: Demographics
  {
    id: 'grade',
    section: 'The Basics',
    context: 'general',
    title: "What grade are you in?",
    subtitle: "Just for stats, we promise.",
    type: 'choice',
    options: [
      { label: "Freshman (9th)", emoji: "🐣", value: "9" },
      { label: "Sophomore (10th)", emoji: "🦎", value: "10" },
      { label: "Junior (11th)", emoji: "😰", value: "11" },
      { label: "Senior (12th)", emoji: "🎓", value: "12" },
      { label: "College/Uni", emoji: "🏛️", value: "college" }
    ]
  },
  {
    id: 'gender',
    section: 'The Basics',
    context: 'general',
    title: "How do you identify?",
    type: 'choice',
    options: [
      { label: "Girl", emoji: "👧", value: "female" },
      { label: "Boy", emoji: "👦", value: "male" }
    ]
  },

  // Section A: Emotional Situation
  {
    id: 'status',
    section: 'Section A',
    context: 'love',
    title: "Which of the following best describes your current emotional situation?",
    subtitle: "Be honest. 🤐",
    type: 'choice',
    options: [
      { label: "I am not emotionally interested in anyone", emoji: "🧘", value: "single" },
      { label: "I have a crush on someone", emoji: "👀", value: "talking" },
      { label: "I am in a romantic relationship", emoji: "🥰", value: "taken" },
      { label: "I recently experienced a breakup", emoji: "💔", value: "heartbroken" }
    ]
  },

  // Section B: Baseline Academic Focus
  {
    id: 'focus_level',
    section: 'Section B',
    context: 'study',
    title: "How would you rate your general ability to focus while studying?",
    type: 'choice',
    options: [
        { label: "Very Good", emoji: "🧠", value: "100" },
        { label: "Good", emoji: "👍", value: "75" },
        { label: "Average", emoji: "😐", value: "50" },
        { label: "Poor", emoji: "🫠", value: "25" },
        { label: "Very Poor", emoji: "💀", value: "0" }
    ]
  },

  // Thoughts Frequency (Context Dependent)
  {
    id: 'romantic_thoughts_freq',
    section: 'Section B',
    context: 'love',
    title: "During studying, how often do emotional or romantic thoughts come to your mind?",
    type: 'choice',
    options: [
        { label: "Never", emoji: "🛡️", value: "never" },
        { label: "Rarely", emoji: "🌥️", value: "rarely" },
        { label: "Sometimes", emoji: "🤔", value: "sometimes" },
        { label: "Often", emoji: "💭", value: "often" },
        { label: "Always", emoji: "😍", value: "always" }
    ]
  },

  // Impact (Context Dependent)
  {
    id: 'romantic_thought_impact',
    section: 'Section B',
    context: 'love',
    title: "When emotional or romantic thoughts occur, how do they usually affect your focus?",
    type: 'choice',
    options: [
        { label: "They improve my focus", emoji: "🚀", value: "improve" },
        { label: "They slightly improve my focus", emoji: "✨", value: "slightly_improve" },
        { label: "No effect", emoji: "🤷", value: "none" },
        { label: "They slightly reduce my focus", emoji: "📉", value: "slightly_reduce" },
        { label: "They greatly reduce my focus", emoji: "💥", value: "greatly_reduce" }
    ]
  },

  // Intensity Slider (1-5 Scale)
  {
    id: 'emotional_effect_strength',
    section: 'Section B',
    context: 'love',
    title: "How strong is the effect of emotional or romantic feelings on your concentration?",
    subtitle: "Drag the slider to rate from 1 to 5.",
    type: 'slider',
    min: 1,
    max: 5,
    minLabel: "Weak",
    maxLabel: "Strong",
    sliderStops: [
      { value: 1, label: "Barely Noticeable", emoji: "🛡️" },
      { value: 2, label: "Slight Distraction", emoji: "☁️" },
      { value: 3, label: "Moderate Impact", emoji: "🌊" },
      { value: 4, label: "Strong Impact", emoji: "🌪️" },
      { value: 5, label: "All Consuming", emoji: "💥" }
    ]
  },

  // Phone Checking
  {
    id: 'notifications_freq',
    section: 'Digital Life',
    context: 'general',
    title: "While studying, how often do you check your phone for notifications or replies?",
    type: 'choice',
    options: [
        { label: "Never", emoji: "🔒", value: "never" },
        { label: "Rarely", emoji: "👀", value: "rarely" },
        { label: "Sometimes", emoji: "🤔", value: "sometimes" },
        { label: "Often", emoji: "😬", value: "often" },
        { label: "Very Often", emoji: "💀", value: "very_often" }
    ]
  },
  
  // Study Time Change (Context Dependent)
  {
    id: 'study_time_change',
    section: 'Study Habits',
    context: 'study',
    title: "How does your study time change when you are emotionally involved?",
    subtitle: "Crush, relationship, or breakup context.",
    type: 'choice',
    options: [
        { label: "I study MORE than usual", emoji: "😤", value: "more" },
        { label: "No change", emoji: "🧘", value: "same" },
        { label: "I study LESS than usual", emoji: "📉", value: "less" }
    ]
  },

  // Section 3: Health & Mood
  {
    id: 'sleep_quality',
    section: 'Health Check',
    context: 'general',
    title: "How's your sleep schedule?",
    subtitle: "Are those late night talks worth the eye bags?",
    type: 'slider',
    min: 1,
    max: 5,
    minLabel: "Zombie",
    maxLabel: "Fresh",
    sliderStops: [
      { value: 1, label: "Zombie Mode", emoji: "🧟" },
      { value: 2, label: "Surviving on Caffeine", emoji: "☕" },
      { value: 3, label: "Average Human", emoji: "😐" },
      { value: 4, label: "Well Rested", emoji: "😌" },
      { value: 5, label: "Glowing & Fresh", emoji: "✨" }
    ]
  },
  {
    id: 'mood_impact',
    section: 'The Feels',
    context: 'love',
    title: "How does your love life affect your mood at school?",
    type: 'mood',
    options: [
      { label: "Super Happy", emoji: "🤩", value: "happy" },
      { label: "Relaxed", emoji: "😌", value: "relaxed" },
      { label: "Distracted", emoji: "😵‍💫", value: "distracted" },
      { label: "Stressed", emoji: "😫", value: "stressed" },
      { label: "Sad / Down", emoji: "😢", value: "sad" },
      { label: "Unbothered", emoji: "💅", value: "neutral" }
    ]
  },

  // Reflection (UPDATED)
  {
    id: 'reflection',
    section: 'Final Thoughts',
    context: 'general',
    title: "Briefly describe one specific instance where a romantic situation directly helped or harmed you.",
    subtitle: "e.g., A crush motivating you to study, or a breakup causing you to miss an assignment.",
    type: 'text',
    placeholder: "Share your story...",
  },
  
  // Name Field (Removed from survey flow, handled in ThankYouScreen now, but kept in types if needed)
];

export const PROGRESS_EMOJIS = ["👋", "🐣", "❤️", "🧠", "🤔", "📱", "📉", "😴", "😮", "✍️", "🎉"];