import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import {
  ShieldAlert,
  Users,
  AlertTriangle,
  CheckCircle2,
  Wifi,
  WifiOff,
  Maximize2,
  Minimize2,
  Send,
  RefreshCw,
  Settings,
  Filter,
  Eye,
  FileText
} from 'lucide-react';
import { Button } from '../ui/button';

export interface ProctorStudentStatus {
  studentId: string;
  studentName: string;
  socketId?: string;
  isOnline: boolean;
  isFullscreen: boolean;
  cheatingScore: number;
  fullscreenExits: number;
  tabSwitches: number;
  currentQuestionId?: string;
  status: 'ACTIVE' | 'WARNED' | 'AUTO_SUBMITTED' | 'COMPLETED';
  suspiciousDrift?: boolean;
  lastHeartbeat?: number;
  ip?: string;
  browser?: string;
}

export interface ProctorAlertEvent {
  id: string;
  studentId: string;
  studentName: string;
  type: string;
  message: string;
  cheatingScore: number;
  timestamp: number;
}

export interface LiveProctorDashboardProps {
  testId: string;
  testTitle?: string;
  onClose?: () => void;
}

export const LiveProctorDashboard: React.FC<LiveProctorDashboardProps> = ({
  testId,
  testTitle = 'University Proctored Exam',
  onClose
}) => {
  const [students, setStudents] = useState<Record<string, ProctorStudentStatus>>({});
  const [alerts, setAlerts] = useState<ProctorAlertEvent[]>([]);
  const [filterScore, setFilterScore] = useState<'ALL' | 'HIGH_RISK' | 'WARNED'>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [customWarnMessage, setCustomWarnMessage] = useState<string>('Please remain focused on your exam window.');

  // Feature 26: Individual Security Settings Toggle
  const [securityRules, setSecurityRules] = useState({
    forceFullscreen: true,
    tabSwitchDetection: true,
    blockCopyPaste: true,
    blockDevTools: true,
    multiMonitorCheck: true,
    singleDeviceLogin: true
  });

  const socketRef = useRef<Socket | null>(null);

  // 1. Fetch initial DB sessions & connect to Socket.IO room
  useEffect(() => {
    // A. Load initial sessions from REST API
    const fetchInitialSessions = async () => {
      try {
        const res = await fetch(`/api/exam-security/test-sessions?testId=${testId}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.sessions)) {
          const loadedMap: Record<string, ProctorStudentStatus> = {};
          data.sessions.forEach((s: any) => {
            loadedMap[s.studentId] = {
              studentId: s.studentId,
              studentName: s.studentName || 'Student',
              isOnline: false,
              isFullscreen: true,
              cheatingScore: s.totalCheatingScore || 0,
              fullscreenExits: s.fullscreenExits || 0,
              tabSwitches: s.tabSwitches || 0,
              status: s.status || 'ACTIVE',
              ip: s.ip,
              browser: s.browser
            };
          });
          setStudents(loadedMap);
        }
      } catch (err) {
        console.error('Failed to load initial proctor sessions', err);
      }
    };

    fetchInitialSessions();

    // B. Connect to Socket.IO default namespace and join proctor room
    const socket = io((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '', {
      transports: ['websocket'],
      autoConnect: true
    });

    socket.on('connect', () => {
      console.log('⚡ [ProctorDashboard] Connected to Socket.IO:', socket.id);
      socket.emit('join_test', {
        testId,
        studentId: 'faculty_proctor',
        studentName: 'Faculty Proctor',
        role: 'proctor'
      });
    });

    socket.on('student_online', (data) => {
      setStudents(prev => ({
        ...prev,
        [data.studentId]: {
          ...(prev[data.studentId] || {
            studentId: data.studentId,
            studentName: data.studentName,
            cheatingScore: 0,
            fullscreenExits: 0,
            tabSwitches: 0,
            status: 'ACTIVE'
          }),
          isOnline: true,
          socketId: data.socketId,
          lastHeartbeat: data.timestamp
        }
      }));
    });

    socket.on('student_offline', (data) => {
      setStudents(prev => {
        const curr = prev[data.studentId];
        if (!curr) return prev;
        return { ...prev, [data.studentId]: { ...curr, isOnline: false } };
      });
    });

    socket.on('student_status_update', (data) => {
      setStudents(prev => {
        const curr: ProctorStudentStatus = prev[data.studentId] || {
          studentId: data.studentId,
          studentName: data.studentName,
          isOnline: true,
          isFullscreen: true,
          cheatingScore: 0,
          fullscreenExits: 0,
          tabSwitches: 0,
          status: 'ACTIVE'
        };
        return {
          ...prev,
          [data.studentId]: {
            ...curr,
            isOnline: true,
            cheatingScore: data.cheatingScore ?? curr.cheatingScore,
            isFullscreen: data.isFullscreen ?? curr.isFullscreen,
            currentQuestionId: data.currentQuestionId ?? curr.currentQuestionId,
            suspiciousDrift: data.suspiciousDrift,
            lastHeartbeat: data.lastHeartbeat
          }
        };
      });
    });

    socket.on('proctor_alert', (data) => {
      const alertItem: ProctorAlertEvent = {
        id: `alt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        studentId: data.studentId,
        studentName: data.studentName,
        type: data.type,
        message: data.message,
        cheatingScore: data.cheatingScore,
        timestamp: data.timestamp
      };

      setAlerts(prev => [alertItem, ...prev.slice(0, 99)]);

      setStudents(prev => {
        const curr = prev[data.studentId];
        if (!curr) return prev;
        return {
          ...prev,
          [data.studentId]: {
            ...curr,
            cheatingScore: data.cheatingScore,
            status: data.cheatingScore >= 50 ? 'AUTO_SUBMITTED' : data.cheatingScore > 20 ? 'WARNED' : curr.status,
            fullscreenExits: data.type === 'FULLSCREEN_EXIT' ? curr.fullscreenExits + 1 : curr.fullscreenExits,
            tabSwitches: ['TAB_SWITCH', 'WINDOW_MINIMIZE'].includes(data.type) ? curr.tabSwitches + 1 : curr.tabSwitches
          }
        };
      });

      toast.error(`Security Alert: ${data.studentName}`, {
        description: `${data.message} [Score: ${data.cheatingScore}]`
      });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [testId]);

  // 2. Remote Proctor Commands
  const handleIssueWarning = (studentId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('proctor_command', {
      testId,
      studentId,
      command: 'WARN',
      reason: customWarnMessage
    });
    toast.success('Warning sent', { description: `Message delivered to student ${studentId}` });
  };

  const handleForceSubmit = (studentId: string, studentName: string) => {
    if (!window.confirm(`Are you sure you want to FORCE SUBMIT ${studentName}'s exam immediately?`)) {
      return;
    }
    if (!socketRef.current) return;
    socketRef.current.emit('proctor_command', {
      testId,
      studentId,
      command: 'FORCE_SUBMIT',
      reason: 'Exam terminated remotely by Faculty Proctor.'
    });

    setStudents(prev => {
      const curr = prev[studentId];
      if (!curr) return prev;
      return { ...prev, [studentId]: { ...curr, status: 'AUTO_SUBMITTED' } };
    });

    toast.error('Student Exam Terminated', { description: `Force submitted ${studentName}'s exam.` });
  };

  const handleResetSession = async (studentId: string) => {
    try {
      const res = await fetch('/api/exam-security/reset-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId, studentId, reason: 'Pardoned by Faculty Proctor' })
      });
      const data = await res.json();
      if (data.success) {
        setStudents(prev => {
          const curr = prev[studentId];
          if (!curr) return prev;
          return {
            ...prev,
            [studentId]: {
              ...curr,
              cheatingScore: 0,
              fullscreenExits: 0,
              tabSwitches: 0,
              status: 'ACTIVE'
            }
          };
        });
        toast.success('Session Reset', { description: `Cleared cheating score for student.` });
      }
    } catch (err) {
      toast.error('Failed to reset student security session');
    }
  };

  // 3. Filtered student list
  const studentList = Object.values(students).filter(s => {
    if (filterScore === 'HIGH_RISK') return s.cheatingScore >= 20;
    if (filterScore === 'WARNED') return s.status === 'WARNED' || s.status === 'AUTO_SUBMITTED';
    return true;
  });

  const activeCount = studentList.filter(s => s.isOnline).length;
  const highRiskCount = Object.values(students).filter(s => s.cheatingScore >= 20).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/20 text-[#FF7A00] rounded-xl flex items-center justify-center border border-orange-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">{testTitle}</h1>
              <span className="px-2 py-0.5 bg-orange-500/10 text-[#FF7A00] text-[10px] font-bold rounded uppercase border border-orange-500/20">
                PROCTOR MODE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Test ID: <code className="text-slate-300 font-mono">{testId}</code> | Live Anti-Cheating Telemetry
            </p>
          </div>
        </div>

        {/* Header KPI Stats & Buttons */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span>Online:</span>
              <strong className="text-green-400 font-bold">{activeCount} / {Object.keys(students).length}</strong>
            </div>

            <div className="h-4 w-px bg-slate-800" />

            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span>High Risk:</span>
              <strong className={`font-bold ${highRiskCount > 0 ? 'text-red-400 animate-pulse' : 'text-slate-300'}`}>
                {highRiskCount}
              </strong>
            </div>
          </div>

          <Button
            onClick={() => setShowSettingsModal(true)}
            variant="outline"
            className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-xs gap-1.5"
          >
            <Settings className="w-4 h-4" />
            Security Rules
          </Button>

          {onClose && (
            <Button onClick={onClose} variant="ghost" className="text-slate-400 hover:text-white text-xs">
              Exit Proctor
            </Button>
          )}
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 overflow-hidden">
        {/* Left 3 Columns: Student Telemetry Grid */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden">
          {/* Filters Bar */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-300">Filter View:</span>
              <button
                onClick={() => setFilterScore('ALL')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  filterScore === 'ALL' ? 'bg-[#FF7A00] text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All Students ({Object.keys(students).length})
              </button>
              <button
                onClick={() => setFilterScore('HIGH_RISK')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  filterScore === 'HIGH_RISK' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                High Risk ({highRiskCount})
              </button>
              <button
                onClick={() => setFilterScore('WARNED')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  filterScore === 'WARNED' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Warned / Submitted
              </button>
            </div>

            <div className="text-xs text-slate-400">
              Live Socket Telemetry • Refreshed instantly
            </div>
          </div>

          {/* Student Table */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50 sticky top-0 z-10">
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Status / Network</th>
                  <th className="py-3 px-4 font-semibold">Fullscreen</th>
                  <th className="py-3 px-4 font-semibold">Cheating Score</th>
                  <th className="py-3 px-4 font-semibold">Violations</th>
                  <th className="py-3 px-4 font-semibold">Current Q</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {studentList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      No student exam sessions matching this filter.
                    </td>
                  </tr>
                ) : (
                  studentList.map(student => (
                    <tr
                      key={student.studentId}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        student.cheatingScore >= 50 ? 'bg-red-950/20' : student.cheatingScore >= 20 ? 'bg-orange-950/10' : ''
                      }`}
                    >
                      {/* Name */}
                      <td className="py-3 px-4 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <span>{student.studentName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({student.studentId})</span>
                        </div>
                      </td>

                      {/* Network & Status */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {student.isOnline ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-semibold">
                              <Wifi className="w-3 h-3" /> Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
                              <WifiOff className="w-3 h-3" /> Offline
                            </span>
                          )}

                          {student.status === 'AUTO_SUBMITTED' && (
                            <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[10px] border border-red-500/30">
                              SUBMITTED
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Fullscreen Badge */}
                      <td className="py-3 px-4">
                        {student.isFullscreen ? (
                          <span className="text-green-400 inline-flex items-center gap-1">
                            <Maximize2 className="w-3 h-3" /> Full
                          </span>
                        ) : (
                          <span className="text-red-400 font-bold inline-flex items-center gap-1 animate-pulse">
                            <Minimize2 className="w-3 h-3" /> Exited ({student.fullscreenExits})
                          </span>
                        )}
                      </td>

                      {/* Cheating Score */}
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold px-2.5 py-1 rounded-lg border ${
                            student.cheatingScore >= 50
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : student.cheatingScore >= 20
                              ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {student.cheatingScore} / 50
                        </span>
                      </td>

                      {/* Violations breakdown */}
                      <td className="py-3 px-4 text-slate-300">
                        <div className="space-y-0.5">
                          <div>Tab Switches: <strong className="text-white">{student.tabSwitches}</strong></div>
                          <div>FS Exits: <strong className="text-white">{student.fullscreenExits}</strong></div>
                        </div>
                      </td>

                      {/* Current Question */}
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {student.currentQuestionId || 'Q1'}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleIssueWarning(student.studentId)}
                            disabled={student.status === 'AUTO_SUBMITTED'}
                            className="px-2 py-1 bg-orange-500/10 hover:bg-orange-500/20 text-[#FF7A00] border border-orange-500/20 rounded font-semibold transition-colors disabled:opacity-40"
                            title="Flash warning modal on student screen"
                          >
                            Warn
                          </button>

                          <button
                            onClick={() => handleResetSession(student.studentId)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold transition-colors"
                            title="Reset Cheating Score"
                          >
                            Pardon
                          </button>

                          <button
                            onClick={() => handleForceSubmit(student.studentId, student.studentName)}
                            disabled={student.status === 'AUTO_SUBMITTED'}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold transition-colors disabled:opacity-40"
                            title="Remote terminate and auto-submit exam"
                          >
                            Terminate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Real-Time Violation Feed Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Live Violation Feed</span>
            </div>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-full">
              {alerts.length} events
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                ✅ No security violations recorded yet across active students.
              </div>
            ) : (
              alerts.map(alert => (
                <div
                  key={alert.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 space-y-1.5 text-xs animate-slide-up"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{alert.studentName}</span>
                    <span className="font-semibold text-red-400">{alert.type}</span>
                  </div>
                  <p className="text-slate-300">{alert.message}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                    <span>Score: <strong className="text-orange-400">{alert.cheatingScore}/50</strong></span>
                    <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Feature 26: Security Rules Admin Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-base">
                <Settings className="w-5 h-5 text-orange-400" />
                <span>Admin Anti-Cheating Settings (Feature 26)</span>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-400">
                Toggle individual browser anti-cheating rules for this exam session.
              </p>

              <div className="space-y-2">
                {[
                  { key: 'forceFullscreen', label: 'Force Fullscreen & Exit Limit (3 Exits -> Submit)' },
                  { key: 'tabSwitchDetection', label: 'Tab Switch, Window Blur & Minimize Tracking' },
                  { key: 'blockCopyPaste', label: 'Block Copy, Paste, Cut & Context Menu' },
                  { key: 'blockDevTools', label: 'Developer Tools & OS Shortcut Blocking' },
                  { key: 'multiMonitorCheck', label: 'Multiple Display Monitor Detection' },
                  { key: 'singleDeviceLogin', label: 'Single Device Login (Evict Duplicate Sessions)' }
                ].map(item => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors"
                  >
                    <span className="font-semibold text-slate-200">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={(securityRules as any)[item.key]}
                      onChange={e => setSecurityRules({ ...securityRules, [item.key]: e.target.checked })}
                      className="w-4 h-4 accent-[#FF7A00] rounded"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button onClick={() => setShowSettingsModal(false)} className="bg-[#FF7A00] hover:bg-[#e06d00] text-white font-bold py-2 px-5 rounded-xl text-xs">
                Save Security Rules
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
