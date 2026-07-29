import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export type SecurityViolationType =
  | 'FULLSCREEN_EXIT'
  | 'TAB_SWITCH'
  | 'WINDOW_MINIMIZE'
  | 'MULTI_MONITOR_DETECTED'
  | 'COPY_ATTEMPT'
  | 'PASTE_ATTEMPT'
  | 'CUT_ATTEMPT'
  | 'CONTEXT_MENU'
  | 'DEVTOOLS_OPENED'
  | 'FORBIDDEN_SHORTCUT'
  | 'BROWSER_ZOOM_DETECTED'
  | 'PRINT_SCREEN_ATTEMPT'
  | 'OFFLINE_DETECTED'
  | 'DRAG_DROP_ATTEMPT';

export interface SecurityEventLog {
  id: string;
  timestamp: number;
  type: SecurityViolationType;
  message: string;
  cheatingScoreDelta: number;
  currentScore: number;
}

export interface UseSecureExamModeProps {
  isExamActive: boolean;
  maxFullscreenExits?: number;
  maxCheatingScore?: number;
  onAutoSubmit: (reason: string) => void;
  onSecurityViolation?: (event: SecurityEventLog) => void;
}

const SCORE_WEIGHTS: Record<SecurityViolationType, number> = {
  DEVTOOLS_OPENED: 20,
  COPY_ATTEMPT: 15,
  PASTE_ATTEMPT: 15,
  CUT_ATTEMPT: 15,
  FULLSCREEN_EXIT: 10,
  WINDOW_MINIMIZE: 10,
  PRINT_SCREEN_ATTEMPT: 10,
  TAB_SWITCH: 5,
  FORBIDDEN_SHORTCUT: 5,
  MULTI_MONITOR_DETECTED: 5,
  BROWSER_ZOOM_DETECTED: 2,
  CONTEXT_MENU: 2,
  DRAG_DROP_ATTEMPT: 5,
  OFFLINE_DETECTED: 0
};

export function useSecureExamMode({
  isExamActive,
  maxFullscreenExits = 3,
  maxCheatingScore = 50,
  onAutoSubmit,
  onSecurityViolation
}: UseSecureExamModeProps) {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [fullscreenExits, setFullscreenExits] = useState<number>(0);
  const [cheatingScore, setCheatingScore] = useState<number>(0);
  const [activityTimeline, setActivityTimeline] = useState<SecurityEventLog[]>([]);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [activeWarning, setActiveWarning] = useState<string | null>(null);

  // References to prevent duplicate/spam logging
  const lastEventTimeRef = useRef<Record<string, number>>({});
  const cheatingScoreRef = useRef<number>(0);
  const fullscreenExitsRef = useRef<number>(0);

  const logViolation = useCallback((type: SecurityViolationType, message: string) => {
    if (!isExamActive) return;

    // Cooldown check (2 seconds per violation type)
    const now = Date.now();
    if (lastEventTimeRef.current[type] && now - lastEventTimeRef.current[type] < 2000) {
      return;
    }
    lastEventTimeRef.current[type] = now;

    const delta = SCORE_WEIGHTS[type] || 5;
    const newScore = cheatingScoreRef.current + delta;
    cheatingScoreRef.current = newScore;
    setCheatingScore(newScore);

    const eventLog: SecurityEventLog = {
      id: `sec_${now}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      type,
      message,
      cheatingScoreDelta: delta,
      currentScore: newScore
    };

    setActivityTimeline(prev => [eventLog, ...prev]);
    setActiveWarning(`[Security Warning] ${message} (+${delta} Cheating Score)`);
    toast.error('Security Violation Detected', { description: `${message} (Score: ${newScore}/${maxCheatingScore})` });

    if (onSecurityViolation) {
      onSecurityViolation(eventLog);
    }

    // Auto submit check
    if (newScore >= maxCheatingScore) {
      onAutoSubmit(`Exam auto-submitted: Maximum Cheating Score limit (${maxCheatingScore}) exceeded.`);
    }
  }, [isExamActive, maxCheatingScore, onAutoSubmit, onSecurityViolation]);

  // 1. Force & Manage Fullscreen
  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (err) {
      toast.error('Fullscreen required', { description: 'Please enable Fullscreen to start/resume exam.' });
    }
  }, []);

  // Monitor Fullscreen Change (Feature 1)
  useEffect(() => {
    if (!isExamActive) return;

    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement || !!(document as any).webkitFullscreenElement;
      setIsFullscreen(isFull);

      if (!isFull) {
        const nextCount = fullscreenExitsRef.current + 1;
        fullscreenExitsRef.current = nextCount;
        setFullscreenExits(nextCount);

        logViolation('FULLSCREEN_EXIT', `Exited Fullscreen Mode (${nextCount}/${maxFullscreenExits})`);

        if (nextCount >= maxFullscreenExits) {
          onAutoSubmit(`Exam auto-submitted: Exceeded maximum fullscreen exits (${maxFullscreenExits}).`);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isExamActive, maxFullscreenExits, logViolation, onAutoSubmit]);

  // 2. Tab Switch & Visibility Detection (Feature 2 & 3)
  useEffect(() => {
    if (!isExamActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation('TAB_SWITCH', 'Student switched tab or minimized window');
      }
    };

    const handleBlur = () => {
      logViolation('TAB_SWITCH', 'Browser window lost focus');
    };

    const handlePageHide = () => {
      logViolation('WINDOW_MINIMIZE', 'Page hide event detected');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [isExamActive, logViolation]);

  // 3. Multi-Monitor Detection (Feature 4)
  useEffect(() => {
    if (!isExamActive) return;

    const checkMultiMonitor = () => {
      // Modern browser Extended Screen API or mismatched screen/window ratios
      const isExtended = (window.screen as any)?.isExtended;
      if (isExtended) {
        logViolation('MULTI_MONITOR_DETECTED', 'Multiple display monitors detected.');
      }
    };

    checkMultiMonitor();
    const interval = setInterval(checkMultiMonitor, 10000);
    return () => clearInterval(interval);
  }, [isExamActive, logViolation]);

  // 4. Copy, Paste, Cut & Context Menu Restrictions (Features 5, 6, 7)
  useEffect(() => {
    if (!isExamActive) return;

    const blockEvent = (e: Event, type: SecurityViolationType, msg: string) => {
      e.preventDefault();
      e.stopPropagation();
      logViolation(type, msg);
      return false;
    };

    const onCopy = (e: ClipboardEvent) => blockEvent(e, 'COPY_ATTEMPT', 'Copying text is disabled during exam.');
    const onPaste = (e: ClipboardEvent) => blockEvent(e, 'PASTE_ATTEMPT', 'Pasting content is disabled during exam.');
    const onCut = (e: ClipboardEvent) => blockEvent(e, 'CUT_ATTEMPT', 'Cutting text is disabled during exam.');
    const onContextMenu = (e: MouseEvent) => blockEvent(e, 'CONTEXT_MENU', 'Right-click menu is disabled.');
    const onDragStart = (e: DragEvent) => blockEvent(e, 'DRAG_DROP_ATTEMPT', 'Drag & drop is blocked in code editor.');

    document.addEventListener('copy', onCopy, true);
    document.addEventListener('paste', onPaste, true);
    document.addEventListener('cut', onCut, true);
    document.addEventListener('contextmenu', onContextMenu, true);
    document.addEventListener('dragstart', onDragStart, true);

    return () => {
      document.removeEventListener('copy', onCopy, true);
      document.removeEventListener('paste', onPaste, true);
      document.removeEventListener('cut', onCut, true);
      document.removeEventListener('contextmenu', onContextMenu, true);
      document.removeEventListener('dragstart', onDragStart, true);
    };
  }, [isExamActive, logViolation]);

  // 5. Developer Tools & Shortcuts Detection (Features 8, 9, 10)
  useEffect(() => {
    if (!isExamActive) return;

    // A. Window resize heuristic for docked DevTools
    const checkDevToolsSize = () => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > 160 || heightDiff > 160) {
        logViolation('DEVTOOLS_OPENED', 'Developer Tools inspection window detected.');
      }
    };

    // B. Zoom detection
    const checkZoom = () => {
      const ratio = window.devicePixelRatio || 1;
      if (ratio < 0.9 || ratio > 1.15) {
        logViolation('BROWSER_ZOOM_DETECTED', `Abnormal browser zoom detected (${Math.round(ratio * 100)}%)`);
      }
    };

    // C. Keyboard shortcut blocker (F12, Ctrl+Shift+I/J/C/U, PrintScreen, Alt, Meta)
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 or DevTools shortcuts
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) ||
        (e.ctrlKey && ['U', 'u'].includes(e.key))
      ) {
        e.preventDefault();
        logViolation('DEVTOOLS_OPENED', `Forbidden Shortcut (${e.key}): DevTools attempt`);
        return false;
      }

      // Copy/Paste/Cut shortcuts
      if (e.ctrlKey && ['c', 'v', 'x', 'C', 'V', 'X'].includes(e.key)) {
        e.preventDefault();
        const type = e.key.toLowerCase() === 'c' ? 'COPY_ATTEMPT' : e.key.toLowerCase() === 'v' ? 'PASTE_ATTEMPT' : 'CUT_ATTEMPT';
        logViolation(type, `Keyboard shortcut (Ctrl+${e.key.toUpperCase()}) blocked.`);
        return false;
      }

      // PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        logViolation('PRINT_SCREEN_ATTEMPT', 'Screenshot attempt blocked.');
        // Try clearing clipboard if possible
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('').catch(() => {});
        }
        return false;
      }

      // Windows / Alt key detection
      if (e.key === 'Meta' || e.key === 'Alt') {
        logViolation('FORBIDDEN_SHORTCUT', `OS-level key (${e.key}) pressed.`);
      }
    };

    window.addEventListener('resize', checkDevToolsSize);
    window.addEventListener('resize', checkZoom);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('resize', checkDevToolsSize);
      window.removeEventListener('resize', checkZoom);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isExamActive, logViolation]);

  // 6. Network / Offline Detection (Feature 12)
  useEffect(() => {
    if (!isExamActive) return;

    const handleOffline = () => {
      setIsOffline(true);
      logViolation('OFFLINE_DETECTED', 'Internet connection lost. Entering offline retry mode.');
    };

    const handleOnline = () => {
      setIsOffline(false);
      toast.success('Internet Restored', { description: 'Connection re-established. Syncing exam state.' });
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [isExamActive, logViolation]);

  return {
    isFullscreen,
    fullscreenExits,
    cheatingScore,
    activityTimeline,
    isOffline,
    activeWarning,
    clearWarning: () => setActiveWarning(null),
    enterFullscreen
  };
}
