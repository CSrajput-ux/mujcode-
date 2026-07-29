// Secure Exam Mode — Production Barrel Exports
// Use these exports across MujCode / Csrexus for Quizzes, Coding Contests, University Exams, and Live Proctoring

export { SecureExamOverlay, type SecureExamOverlayProps } from './SecureExamOverlay';
export { LiveProctorDashboard, type LiveProctorDashboardProps, type ProctorStudentStatus, type ProctorAlertEvent } from './LiveProctorDashboard';
export { useSecureExamMode, type SecurityViolationType, type SecurityEventLog, type UseSecureExamModeProps } from '../../hooks/useSecureExamMode';
export { useExamRecovery, shuffleArray, type ExamAnswerState, type RecoverySnapshot, type UseExamRecoveryProps } from '../../hooks/useExamRecovery';
