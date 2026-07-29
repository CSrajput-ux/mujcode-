import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export interface ExamAnswerState {
  questionId: string;
  answer?: string | number | string[];
  code?: string;
  updatedAt: number;
  locked?: boolean;
}

export interface RecoverySnapshot {
  testId: string;
  studentId: string;
  answers: Record<string, ExamAnswerState>;
  lockedQuestionIds: string[];
  currentQuestionId?: string;
  lastSavedAt: number;
}

export interface UseExamRecoveryProps {
  testId: string;
  studentId: string;
  isExamActive: boolean;
  enableQuestionLock?: boolean;
  onRestoreComplete?: (snapshot: RecoverySnapshot) => void;
  socketRef?: React.MutableRefObject<any>;
}

// Deterministic Seeded Random Number Generator (for stable shuffle per student)
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Fisher-Yates shuffle with seed
export function shuffleArray<T>(arr: T[], seedString: string): T[] {
  const copy = [...arr];
  let seed = stringToSeed(seedString);
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed++) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function useExamRecovery({
  testId,
  studentId,
  isExamActive,
  enableQuestionLock = false,
  onRestoreComplete,
  socketRef
}: UseExamRecoveryProps) {
  const [answers, setAnswers] = useState<Record<string, ExamAnswerState>>({});
  const [lockedQuestions, setLockedQuestions] = useState<Set<string>>(new Set());
  const [isRestored, setIsRestored] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<number>(Date.now());

  const storageKey = `mujcode_exam_recovery_${testId}_${studentId}`;
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Restore state after crash / power failure / reconnect (Feature 24)
  const restoreExamState = useCallback(async () => {
    if (!testId || !studentId) return;

    let restoredAnswers: Record<string, ExamAnswerState> = {};
    let restoredLocked: string[] = [];

    // A. Read from browser localStorage
    try {
      const localRaw = localStorage.getItem(storageKey);
      if (localRaw) {
        const parsed: RecoverySnapshot = JSON.parse(localRaw);
        if (parsed.answers) restoredAnswers = { ...parsed.answers };
        if (Array.isArray(parsed.lockedQuestionIds)) {
          restoredLocked = [...parsed.lockedQuestionIds];
        }
      }
    } catch (err) {
      console.warn('Failed to parse local exam recovery snapshot', err);
    }

    // B. Read from server backup API (in case browser cache was cleared on another PC)
    try {
      const res = await fetch(`/api/exam-recovery/restore?testId=${testId}&studentId=${studentId}`);
      const data = await res.json();
      if (data.success && data.snapshot?.answers) {
        // Merge server timestamps with local timestamps (keep newest edit)
        const serverAnswers: Record<string, ExamAnswerState> = data.snapshot.answers;
        Object.entries(serverAnswers).forEach(([qId, sState]) => {
          const lState = restoredAnswers[qId];
          if (!lState || (sState.updatedAt || 0) > (lState.updatedAt || 0)) {
            restoredAnswers[qId] = sState;
          }
        });

        if (Array.isArray(data.snapshot.lockedQuestionIds)) {
          restoredLocked = Array.from(new Set([...restoredLocked, ...data.snapshot.lockedQuestionIds]));
        }
      }
    } catch (err) {
      console.warn('Server recovery sync unavailable, relying on local storage backup');
    }

    const lockedSet = new Set(restoredLocked);
    setAnswers(restoredAnswers);
    setLockedQuestions(lockedSet);
    setIsRestored(true);

    const snapshot: RecoverySnapshot = {
      testId,
      studentId,
      answers: restoredAnswers,
      lockedQuestionIds: restoredLocked,
      lastSavedAt: Date.now()
    };

    if (Object.keys(restoredAnswers).length > 0) {
      toast.success('Exam State Restored', {
        description: `Recovered ${Object.keys(restoredAnswers).length} saved answers after reload.`
      });
    }

    if (onRestoreComplete) {
      onRestoreComplete(snapshot);
    }
  }, [testId, studentId, storageKey, onRestoreComplete]);

  // Execute restore on initial mount
  useEffect(() => {
    if (isExamActive && !isRestored) {
      restoreExamState();
    }
  }, [isExamActive, isRestored, restoreExamState]);

  // 2. Persist Snapshot (Dual-Storage: LocalStorage + Socket + REST API)
  const saveSnapshot = useCallback((
    currentAnswers: Record<string, ExamAnswerState>,
    currentLocked: Set<string>
  ) => {
    if (!testId || !studentId) return;

    const snapshot: RecoverySnapshot = {
      testId,
      studentId,
      answers: currentAnswers,
      lockedQuestionIds: Array.from(currentLocked),
      lastSavedAt: Date.now()
    };

    // A. Write to localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(snapshot));
    } catch (err) {
      console.error('LocalStorage write failed (quota exceeded?)', err);
    }

    // B. Send via Socket.IO if connected
    if (socketRef && socketRef.current?.connected) {
      socketRef.current.emit('auto_save_answer', {
        testId,
        studentId,
        snapshot
      });
    }

    // C. Fire-and-forget REST API backup
    fetch('/api/exam-recovery/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot)
    }).catch(() => {});

    setLastSavedAt(Date.now());
  }, [testId, studentId, storageKey, socketRef]);

  // 3. Save Answer for a Question (Instant Trigger + Lock check)
  const setAnswer = useCallback((
    questionId: string,
    answerPayload: { answer?: string | number | string[]; code?: string }
  ) => {
    if (enableQuestionLock && lockedQuestions.has(questionId)) {
      toast.error('Question Locked', {
        description: 'You cannot change your answer for a locked question.'
      });
      return false;
    }

    setAnswers(prev => {
      const next = {
        ...prev,
        [questionId]: {
          questionId,
          answer: answerPayload.answer,
          code: answerPayload.code,
          updatedAt: Date.now()
        }
      };
      saveSnapshot(next, lockedQuestions);
      return next;
    });
    return true;
  }, [enableQuestionLock, lockedQuestions, saveSnapshot]);

  // 4. Lock Question (Feature 18: Cannot revisit if enabled)
  const lockQuestion = useCallback((questionId: string) => {
    if (!enableQuestionLock) return;

    setLockedQuestions(prev => {
      const next = new Set(prev);
      next.add(questionId);
      saveSnapshot(answers, next);
      return next;
    });

    toast.info('Question Locked', {
      description: 'You have submitted this question and cannot return to it.'
    });
  }, [enableQuestionLock, answers, saveSnapshot]);

  // 5. Auto Save Timer every 5 seconds (Feature 13)
  useEffect(() => {
    if (!isExamActive) return;

    autoSaveIntervalRef.current = setInterval(() => {
      saveSnapshot(answers, lockedQuestions);
    }, 5000);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [isExamActive, answers, lockedQuestions, saveSnapshot]);

  return {
    answers,
    lockedQuestions,
    isRestored,
    lastSavedAt,
    setAnswer,
    lockQuestion,
    restoreExamState
  };
}
