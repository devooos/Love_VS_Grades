import { SurveySubmission, SurveyMetrics, SurveyState } from '../types';

const STORAGE_KEY_PROGRESS = 'love_vs_grades_progress';
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw2ktvOiTrIsPDgVtM76qLPX-YTRPvAge1qZvJm-vl1eTTweU50mmzoCfywfrw6BJg6/exec'; 

// Helper to safely get value from row object regardless of case
const safeGet = (row: any, key: string, fallback: any = '') => {
    if (!row) return fallback;
    // 1. Direct match
    if (row[key] !== undefined && row[key] !== "") return row[key];
    
    // 2. Case insensitive match
    const lowerKey = key.toLowerCase();
    const foundKey = Object.keys(row).find(k => k.toLowerCase() === lowerKey);
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== "") return row[foundKey];

    return fallback;
};

// Helper to normalize screen time strings to numeric hours for analytics
const mapScreenTime = (val: any): number => {
    if (typeof val === 'number') return val;
    const v = String(val).toLowerCase();
    
    // Map survey options to approximate daily hours
    if (v.includes('never')) return 0;
    if (v.includes('rarely')) return 1;
    if (v.includes('sometimes')) return 3; // ~2-4 hours
    if (v.includes('often')) return 5;     // ~4-6 hours
    if (v.includes('very')) return 8;      // ~7+ hours
    
    // Fallback if it's already a number string
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
};

// --- ROBUST ADAPTER ---
// This handles both "Flat Columns" (New) and "JSON String in Cell" (Old/Broken) data
const adaptSheetData = (sheetData: any[]): SurveySubmission[] => {
  if (!Array.isArray(sheetData)) return [];

  return sheetData.map((row: any, index: number) => {
    
    // 1. Start with the raw row data
    let cleanRow = { ...row };
    
    // 2. Scan ALL columns for a potential JSON string containing our data
    // We look for strings starting with '{' that contain known keys
    const potentialJson = Object.values(row).find(val => 
        typeof val === 'string' && 
        val.trim().startsWith('{') && 
        (val.includes('grade') || val.includes('status') || val.includes('answers') || val.includes('focus_level'))
    );

    if (potentialJson) {
        try {
            const parsed = JSON.parse(potentialJson as string);
            
            // Handle nested structure: { answers: {...}, metrics: {...} }
            // OR flat structure: { grade: "9", status: "single", ... }
            const extractedAnswers = parsed.answers || parsed;
            const extractedMetrics = parsed.metrics || {};
            
            // Merge unpacked data into cleanRow, overwriting column data if necessary
            cleanRow = { ...cleanRow, ...extractedAnswers, ...extractedMetrics };
        } catch (e) {
            // If parsing fails, we fallback to whatever is in the columns
            console.warn("Failed to parse row JSON", e);
        }
    }

    const parseNum = (val: any) => {
        if (typeof val === 'number') return val;
        const n = parseFloat(val);
        return isNaN(n) ? 0 : n;
    };

    // 3. Map fields using the flattened data with Robust Fallbacks
    // We check: 'Title Case Key' (Sheet Headers) || 'snake_case_key' (JSON) || Default
    return {
        id: safeGet(cleanRow, 'ID', safeGet(cleanRow, 'id', `row_${index}`)),
        timestamp: safeGet(cleanRow, 'Timestamp', safeGet(cleanRow, 'timestamp', new Date().toISOString())),
        answers: {
          name: safeGet(cleanRow, 'Name', '') || safeGet(cleanRow, 'name', 'Anonymous'),
          grade: safeGet(cleanRow, 'Grade', '') || safeGet(cleanRow, 'grade', '9'),
          gender: safeGet(cleanRow, 'Gender', '') || safeGet(cleanRow, 'gender', 'unknown'),
          status: safeGet(cleanRow, 'Status', '') || safeGet(cleanRow, 'status', 'single'),
          
          // Analytics Fields: normalize numbers
          focus_level: parseNum(safeGet(cleanRow, 'Focus Level', '') || safeGet(cleanRow, 'focus_level', 50)),
          homework_motivation: parseNum(safeGet(cleanRow, 'Homework Motivation', '') || safeGet(cleanRow, 'homework_motivation', 50)),
          sleep_quality: parseNum(safeGet(cleanRow, 'Sleep Quality', '') || safeGet(cleanRow, 'sleep_quality', 3)),
          emotional_effect_strength: parseNum(safeGet(cleanRow, 'Emotional Strength', '') || safeGet(cleanRow, 'emotional_effect_strength', 1)),
          
          // String Fields
          screen_time: mapScreenTime(
              safeGet(cleanRow, 'Screen Time', '') || 
              safeGet(cleanRow, 'screen_time', '') || 
              safeGet(cleanRow, 'notifications_freq', '')
          ),
          study_partner: safeGet(cleanRow, 'Study Partner', '') || safeGet(cleanRow, 'study_partner', 'na'),
          mood_impact: safeGet(cleanRow, 'Mood Impact', '') || safeGet(cleanRow, 'mood_impact', 'neutral'),
          reflection: safeGet(cleanRow, 'Reflection', '') || safeGet(cleanRow, 'reflection', ''),
          romantic_thoughts_freq: safeGet(cleanRow, 'Romantic Thoughts', '') || safeGet(cleanRow, 'romantic_thoughts_freq', ''),
          romantic_thought_impact: safeGet(cleanRow, 'Romantic Impact', '') || safeGet(cleanRow, 'romantic_thought_impact', ''),
          study_time_change: safeGet(cleanRow, 'Study Change', '') || safeGet(cleanRow, 'study_time_change', '')
        },
        metrics: {
          totalTimeSeconds: parseNum(safeGet(cleanRow, 'Total Time (s)', '') || safeGet(cleanRow, 'totalTimeSeconds', 0)),
          startTime: 0, 
          questionStartTimes: {}, 
          longPauses: [], 
          averageTimePerQuestion: 0
        }
    };
  });
};

export const DataService = {
  saveProgress: (state: SurveyState) => {
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(state));
  },

  loadProgress: (): SurveyState | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PROGRESS);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },

  clearProgress: () => {
    localStorage.removeItem(STORAGE_KEY_PROGRESS);
  },

  saveSubmission: async (answers: Record<string, string | number>, metrics: SurveyMetrics) => {
    let ip = 'unknown';
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 1500); 
        const ipRes = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
        if (ipRes.ok) {
            const ipJson = await ipRes.json();
            ip = ipJson.ip;
        }
    } catch (e) { }

    const payload = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ip: ip,
        name: String(answers.name || 'Anonymous'),
        grade: String(answers.grade || ''),
        gender: String(answers.gender || ''),
        status: String(answers.status || ''),
        focus_level: String(answers.focus_level || ''),
        screen_time: String(answers.notifications_freq || ''), 
        sleep_quality: String(answers.sleep_quality || ''),
        mood_impact: String(answers.mood_impact || ''),
        reflection: String(answers.reflection || ''),
        romantic_thoughts_freq: String(answers.romantic_thoughts_freq || ''),
        romantic_thought_impact: String(answers.romantic_thought_impact || ''),
        emotional_effect_strength: String(answers.emotional_effect_strength || ''),
        study_time_change: String(answers.study_time_change || ''),
        homework_motivation: '50', 
        study_partner: String(answers.study_time_change === 'more' ? 'productive' : 'distracted'),
        totalTimeSeconds: String(metrics.totalTimeSeconds || 0)
    };

    if (GOOGLE_SCRIPT_URL) {
      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors', 
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload)
        });
        return true;
      } catch (e) {
        console.error("Cloud save failed", e);
        return false;
      }
    }
    return false;
  },

  getAnalyticsData: async (): Promise<SurveySubmission[]> => {
    if (GOOGLE_SCRIPT_URL) {
      try {
        const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=read&nocache=${Date.now()}`);
        const json = await res.json();
        
        if (Array.isArray(json)) {
            return adaptSheetData(json);
        }
      } catch (e) {
        console.warn("Cloud fetch failed", e);
      }
    }
    return []; 
  }
};