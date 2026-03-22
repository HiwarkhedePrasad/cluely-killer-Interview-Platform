import { useState, useCallback, useEffect } from 'react';

/**
 * Interview phases/states
 */
export const INTERVIEW_PHASES = {
  NOT_STARTED: 'not_started',
  INTRODUCTION: 'introduction',
  WARMUP: 'warmup',
  CODING: 'coding',
  REVIEW: 'review',
  WRAPUP: 'wrapup',
  COMPLETED: 'completed'
};

/**
 * Phase configurations
 */
const PHASE_CONFIG = {
  [INTERVIEW_PHASES.NOT_STARTED]: {
    title: 'Ready to Start',
    description: 'Click "Start Interview" to begin the AI-powered technical interview.',
    duration: null,
    autoAdvance: false
  },
  [INTERVIEW_PHASES.INTRODUCTION]: {
    title: 'Introduction',
    description: 'The AI interviewer will introduce themselves and explain the interview format.',
    duration: 120, // 2 minutes
    autoAdvance: false
  },
  [INTERVIEW_PHASES.WARMUP]: {
    title: 'Warmup Questions',
    description: 'Brief discussion about your background and experience.',
    duration: 300, // 5 minutes
    autoAdvance: false
  },
  [INTERVIEW_PHASES.CODING]: {
    title: 'Coding Challenge',
    description: 'Solve the coding problem while explaining your approach.',
    duration: 2400, // 40 minutes
    autoAdvance: false
  },
  [INTERVIEW_PHASES.REVIEW]: {
    title: 'Code Review',
    description: 'The AI will review your solution and discuss improvements.',
    duration: 300, // 5 minutes
    autoAdvance: false
  },
  [INTERVIEW_PHASES.WRAPUP]: {
    title: 'Wrap Up',
    description: 'Final questions and closing remarks.',
    duration: 180, // 3 minutes
    autoAdvance: false
  },
  [INTERVIEW_PHASES.COMPLETED]: {
    title: 'Interview Complete',
    description: 'Thank you for completing the interview!',
    duration: null,
    autoAdvance: false
  }
};

/**
 * Phase transition prompts for the AI
 */
const PHASE_PROMPTS = {
  [INTERVIEW_PHASES.INTRODUCTION]: `Begin the interview with a warm, professional introduction. Introduce yourself as the AI interviewer, explain the interview format, and ask the candidate to briefly introduce themselves.`,
  
  [INTERVIEW_PHASES.WARMUP]: `Transition to warmup questions. Ask the candidate 1-2 brief questions about their programming experience, favorite technologies, or recent projects. Keep this conversational and brief.`,
  
  [INTERVIEW_PHASES.CODING]: `Transition to the coding challenge. Present the current coding problem clearly, ask if they have any clarifying questions, and encourage them to think out loud as they work through the solution.`,
  
  [INTERVIEW_PHASES.REVIEW]: `The candidate has submitted their code. Review their solution, discussing:
1. What they did well
2. The time/space complexity
3. Any potential improvements or edge cases
Be constructive and educational in your feedback.`,
  
  [INTERVIEW_PHASES.WRAPUP]: `Begin wrapping up the interview. Ask the candidate if they have any questions for you about the role, team, or company. Thank them for their time and effort.`,
  
  [INTERVIEW_PHASES.COMPLETED]: `Thank the candidate for completing the interview. Let them know the next steps and wish them well.`
};

/**
 * React hook for managing interview flow
 */
export function useInterviewFlow() {
  const [phase, setPhase] = useState(INTERVIEW_PHASES.NOT_STARTED);
  const [phaseStartTime, setPhaseStartTime] = useState(null);
  const [interviewStartTime, setInterviewStartTime] = useState(null);
  const [candidateName, setCandidateName] = useState('');
  const [notes, setNotes] = useState([]);
  const [codeSnapshots, setCodeSnapshots] = useState([]);

  /**
   * Get current phase configuration
   */
  const currentPhaseConfig = PHASE_CONFIG[phase];

  /**
   * Get AI prompt for current phase
   */
  const getPhasePrompt = useCallback(() => {
    return PHASE_PROMPTS[phase] || '';
  }, [phase]);

  /**
   * Start the interview
   */
  const startInterview = useCallback((name = 'candidate') => {
    const now = Date.now();
    setCandidateName(name);
    setInterviewStartTime(now);
    setPhaseStartTime(now);
    setPhase(INTERVIEW_PHASES.INTRODUCTION);
    setNotes([]);
    setCodeSnapshots([]);
  }, []);

  /**
   * Advance to next phase
   */
  const advancePhase = useCallback(() => {
    const phases = Object.values(INTERVIEW_PHASES);
    const currentIndex = phases.indexOf(phase);
    
    if (currentIndex < phases.length - 1) {
      const nextPhase = phases[currentIndex + 1];
      setPhase(nextPhase);
      setPhaseStartTime(Date.now());
      return nextPhase;
    }
    
    return null;
  }, [phase]);

  /**
   * Go to a specific phase
   */
  const goToPhase = useCallback((targetPhase) => {
    if (PHASE_CONFIG[targetPhase]) {
      setPhase(targetPhase);
      setPhaseStartTime(Date.now());
    }
  }, []);

  /**
   * Add an interviewer note
   */
  const addNote = useCallback((note) => {
    setNotes(prev => [...prev, {
      id: Date.now(),
      text: note,
      phase,
      timestamp: new Date()
    }]);
  }, [phase]);

  /**
   * Save a code snapshot
   */
  const saveCodeSnapshot = useCallback((code, language) => {
    setCodeSnapshots(prev => [...prev, {
      id: Date.now(),
      code,
      language,
      phase,
      timestamp: new Date()
    }]);
  }, [phase]);

  /**
   * End the interview
   */
  const endInterview = useCallback(() => {
    setPhase(INTERVIEW_PHASES.COMPLETED);
    setPhaseStartTime(Date.now());
  }, []);

  /**
   * Reset the interview
   */
  const resetInterview = useCallback(() => {
    setPhase(INTERVIEW_PHASES.NOT_STARTED);
    setPhaseStartTime(null);
    setInterviewStartTime(null);
    setCandidateName('');
    setNotes([]);
    setCodeSnapshots([]);
  }, []);

  /**
   * Get elapsed time in current phase (seconds)
   */
  const getPhaseElapsed = useCallback(() => {
    if (!phaseStartTime) return 0;
    return Math.floor((Date.now() - phaseStartTime) / 1000);
  }, [phaseStartTime]);

  /**
   * Get total interview elapsed time (seconds)
   */
  const getTotalElapsed = useCallback(() => {
    if (!interviewStartTime) return 0;
    return Math.floor((Date.now() - interviewStartTime) / 1000);
  }, [interviewStartTime]);

  /**
   * Check if interview is active
   */
  const isActive = phase !== INTERVIEW_PHASES.NOT_STARTED && phase !== INTERVIEW_PHASES.COMPLETED;

  /**
   * Get interview summary for export
   */
  const getInterviewSummary = useCallback(() => {
    return {
      candidateName,
      startTime: interviewStartTime ? new Date(interviewStartTime).toISOString() : null,
      endTime: phase === INTERVIEW_PHASES.COMPLETED ? new Date().toISOString() : null,
      totalDuration: getTotalElapsed(),
      phases: Object.values(INTERVIEW_PHASES).map(p => ({
        phase: p,
        config: PHASE_CONFIG[p]
      })),
      notes,
      codeSnapshots,
      currentPhase: phase
    };
  }, [candidateName, interviewStartTime, phase, notes, codeSnapshots, getTotalElapsed]);

  return {
    // State
    phase,
    currentPhaseConfig,
    candidateName,
    notes,
    codeSnapshots,
    isActive,
    
    // Actions
    startInterview,
    advancePhase,
    goToPhase,
    endInterview,
    resetInterview,
    addNote,
    saveCodeSnapshot,
    
    // Utilities
    getPhasePrompt,
    getPhaseElapsed,
    getTotalElapsed,
    getInterviewSummary,
    
    // Constants
    PHASES: INTERVIEW_PHASES
  };
}

export default useInterviewFlow;
