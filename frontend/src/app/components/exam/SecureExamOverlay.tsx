import React, { useState } from 'react';
import { useSecureExamMode, SecurityEventLog } from '../../hooks/useSecureExamMode';
import { ShieldAlert, Maximize2, AlertTriangle, CheckCircle2, WifiOff, FileText } from 'lucide-react';
import { Button } from '../ui/button';

export interface SecureExamOverlayProps {
  isExamActive: boolean;
  examTitle: string;
  studentName?: string;
  maxFullscreenExits?: number;
  maxCheatingScore?: number;
  onAutoSubmit: (reason: string) => void;
  onViolationLog?: (log: SecurityEventLog) => void;
  children: React.ReactNode;
}

export const SecureExamOverlay: React.FC<SecureExamOverlayProps> = ({
  isExamActive,
  examTitle,
  studentName = 'Student',
  maxFullscreenExits = 3,
  maxCheatingScore = 50,
  onAutoSubmit,
  onViolationLog,
  children
}) => {
  const [showTimelineModal, setShowTimelineModal] = useState(false);

  const {
    isFullscreen,
    fullscreenExits,
    cheatingScore,
    activityTimeline,
    isOffline,
    activeWarning,
    clearWarning,
    enterFullscreen
  } = useSecureExamMode({
    isExamActive,
    maxFullscreenExits,
    maxCheatingScore,
    onAutoSubmit,
    onSecurityViolation: onViolationLog
  });

  if (!isExamActive) {
    return <>{children}</>;
  }

  // 1. Fullscreen Lock Screen
  if (!isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-6 text-white select-none">
        <div className="max-w-md w-full bg-slate-800/80 border border-slate-700 rounded-2xl p-8 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-orange-500/20 text-[#FF7A00] rounded-full flex items-center justify-center mx-auto border border-orange-500/30">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Secure Exam Mode Required</h2>
            <p className="text-sm text-slate-300">
              You must enter <span className="font-semibold text-orange-400">Fullscreen Mode</span> to start or continue <span className="text-white font-medium">{examTitle}</span>.
            </p>
          </div>

          <div className="bg-slate-900/60 rounded-xl p-4 text-left text-xs text-slate-300 space-y-2 border border-slate-700/50">
            <div className="font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Active Anti-Cheating Rules:
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Tab switches, minimizes & blur events are monitored.</li>
              <li>Copy, Paste, Cut & right-click menus are disabled.</li>
              <li>Developer Tools & OS shortcuts are strictly blocked.</li>
              <li>Max Fullscreen Exits: <strong className="text-white">{maxFullscreenExits - fullscreenExits} remaining</strong>.</li>
            </ul>
          </div>

          <Button
            onClick={enterFullscreen}
            className="w-full bg-[#FF7A00] hover:bg-[#e06d00] text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            <Maximize2 className="w-4 h-4" />
            Enter Fullscreen & Resume Exam
          </Button>

          {fullscreenExits > 0 && (
            <div className="text-xs text-red-400 font-medium">
              ⚠️ Warning: You have exited fullscreen {fullscreenExits} time(s). Auto-submission after {maxFullscreenExits} exits.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-900 select-none">
      {/* 2. Live Security Header Banner */}
      <div className="sticky top-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-2 flex items-center justify-between text-white text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Secure Exam Mode Active</span>
          </div>

          {isOffline && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full font-bold animate-pulse">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline - Retrying Sync</span>
            </div>
          )}
        </div>

        {/* Security Score Badge */}
        <div className="flex items-center gap-4">
          <div className="text-slate-400">
            Student: <span className="text-white font-medium">{studentName}</span>
          </div>

          <button
            onClick={() => setShowTimelineModal(true)}
            className="flex items-center gap-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${cheatingScore > 20 ? 'text-red-400 animate-bounce' : 'text-orange-400'}`} />
            <span>Cheating Score:</span>
            <strong className={`font-bold ${cheatingScore > 30 ? 'text-red-400' : 'text-orange-400'}`}>
              {cheatingScore}/{maxCheatingScore}
            </strong>
          </button>
        </div>
      </div>

      {/* 3. Active Violation Alert Banner */}
      {activeWarning && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-red-900/95 border-2 border-red-500 text-white p-4 rounded-xl shadow-2xl flex items-start gap-3 animate-slide-up">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <div className="font-bold text-sm">Violation Recorded</div>
            <p className="text-xs text-red-200">{activeWarning}</p>
            <button
              onClick={clearWarning}
              className="text-[10px] text-red-300 underline hover:text-white mt-1 font-semibold"
            >
              Dismiss Warning
            </button>
          </div>
        </div>
      )}

      {/* 4. Activity Timeline Modal (Student View) */}
      {showTimelineModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-lg w-full p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2 font-bold text-base">
                <FileText className="w-5 h-5 text-orange-400" />
                <span>Security Activity Log ({activityTimeline.length} events)</span>
              </div>
              <button
                onClick={() => setShowTimelineModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {activityTimeline.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  ✅ No suspicious security violations detected yet.
                </div>
              ) : (
                activityTimeline.map(log => (
                  <div key={log.id} className="bg-slate-900/80 border border-slate-700/60 rounded-lg p-3 text-xs flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-semibold text-red-400">{log.type}</div>
                      <div className="text-slate-300">{log.message}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-orange-400">+{log.cheatingScoreDelta} pts</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Button
              onClick={() => setShowTimelineModal(false)}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg text-xs"
            >
              Close Log
            </Button>
          </div>
        </div>
      )}

      {/* 5. Main Exam Children (Text Selection Disabled) */}
      <div className="select-none">
        {children}
      </div>
    </div>
  );
};
