import React, { useEffect, useState, useRef } from 'react';
import { useProctoring, Violation } from '../hooks/useProctoring';
import { toast } from 'sonner';
import { ShieldAlert } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface SecureExamGuardProps {
    onTerminate: () => void;
    isExamActive: boolean;
    children: React.ReactNode;
    onViolation?: (reason: string) => void;
    testId?: string;
    studentId?: string;
}

const SecureExamGuard: React.FC<SecureExamGuardProps> = ({
    onTerminate,
    isExamActive,
    children,
    onViolation,
    testId = 'test_123',
    studentId = 'student_123'
}) => {
    const [violations, setViolations] = useState<Violation[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [pauseTimer, setPauseTimer] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(true);
    const socketRef = useRef<Socket | null>(null);

    // BATCHING for performance
    const violationBatchRef = useRef<Violation[]>([]);
    const batchTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Socket Connection
    useEffect(() => {
        if (isExamActive) {
            const socket = io((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '', {
                transports: ['websocket'],
                autoConnect: true
            });

            socket.on('connect', () => {
                console.log('⚡ Socket connected:', socket.id);
                socket.emit('join_test', { testId, studentId });
            });

            socket.on('force_submit', (data) => {
                toast.error("Exam Auto-Submitted", { description: data.reason });
                handleTermination();
            });

            socketRef.current = socket;

            return () => {
                // Flush remaining violations before disconnect
                flushViolationBatch();
                socket.disconnect();
            };
        }
    }, [isExamActive, testId, studentId, onTerminate]);

    // BATCHED Violation Emission (Performance Optimization)
    const flushViolationBatch = () => {
        if (violationBatchRef.current.length > 0 && socketRef.current?.connected) {
            // Send batch
            socketRef.current.emit('violation_batch', {
                testId,
                studentId,
                violations: violationBatchRef.current.map(v => ({
                    type: v.type,
                    message: v.message,
                    timestamp: v.timestamp,
                    snapshot: v.snapshot
                }))
            });

            console.log(`📦 Sent ${violationBatchRef.current.length} violations in batch`);
            violationBatchRef.current = [];
        }
    };

    const handleViolation = (violation: Violation) => {
        setViolations(prev => {
            const updated = [...prev, violation];
            // Keep only last 50 for memory
            return updated.slice(-50);
        });

        const currentStrikes = violations.length + 1;

        console.log(`⚠️ Violation: ${violation.type}`);

        // Add to batch
        violationBatchRef.current.push(violation);

        // Schedule batch send (debounced to 2 seconds)
        if (batchTimerRef.current) {
            clearTimeout(batchTimerRef.current);
        }
        batchTimerRef.current = setTimeout(flushViolationBatch, 2000);

        // Notify parent
        if (onViolation) {
            onViolation(violation.message);
        }

        // Critical: Phone Detection
        if (violation.message.includes("CRITICAL: Phone")) {
            toast.error("PHONE DETECTED", {
                description: "Test auto-submitted.",
                duration: 5000,
                className: "bg-red-600 text-white"
            });
            flushViolationBatch(); // Immediate flush
            handleTermination();
            return;
        }

        // Strike System
        if (currentStrikes === 1) {
            toast.warning("Strike 1", { description: violation.message });
        } else if (currentStrikes === 2) {
            toast.error("Strike 2: Final Warning", {
                description: "Exam paused 10s. Next = Termination.",
            });
            setIsPaused(true);
            setPauseTimer(10);
        } else if (currentStrikes >= 3) {
            toast.error("Strike 3: Terminated", {
                description: "Violation limit exceeded.",
            });
            flushViolationBatch(); // Immediate flush
            handleTermination();
        }
    };

    const { videoRef, modelsLoaded, strikes, stopAllStreams } = useProctoring({
        onViolation: handleViolation,
        isExamActive: isExamActive && !isPaused
    });

    // Cleanup streams on termination
    const handleTermination = () => {
        console.log('📛 Test terminating - stopping all streams');
        stopAllStreams();
        onTerminate();
    };

    // Pause Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPaused && pauseTimer > 0) {
            interval = setInterval(() => setPauseTimer(prev => prev - 1), 1000);
        } else if (isPaused && pauseTimer === 0) {
            setIsPaused(false);
        }
        return () => clearInterval(interval);
    }, [isPaused, pauseTimer]);

    // Fullscreen Enforcer
    const enforceFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                setIsFullscreen(true);
            }
        } catch (err) {
            console.error("Fullscreen error:", err);
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        if (isExamActive) enforceFullscreen();

        const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFSChange);
        return () => document.removeEventListener('fullscreenchange', handleFSChange);
    }, [isExamActive]);

    // Cleanup batching on unmount
    useEffect(() => {
        return () => {
            if (batchTimerRef.current) {
                clearTimeout(batchTimerRef.current);
                flushViolationBatch();
            }
        };
    }, []);

    return (
        <div className="relative w-full h-full bg-white">
            {/* Fullscreen Overlay */}
            {!isFullscreen && isExamActive && (
                <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center text-white text-center p-8">
                    <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
                    <h2 className="text-3xl font-bold mb-4">Fullscreen Required</h2>
                    <p className="text-xl mb-8 max-w-lg text-slate-300">
                        Secure Mode requires fullscreen.
                    </p>
                    <button
                        onClick={enforceFullscreen}
                        className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold text-lg"
                    >
                        Enable Fullscreen
                    </button>
                </div>
            )}

            {/* Main Content */}
            <div className={`transition-all ${isPaused ? 'blur-md pointer-events-none' : ''}`}>
                {children}
            </div>

            {/* Webcam Feed - SMALLER for performance */}
            <div className="fixed bottom-4 right-4 w-40 h-30 bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-slate-700 z-50 group">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover transform scale-x-[-1]"
                />
                <div className="absolute top-1 left-1 bg-black/50 text-white text-[9px] px-1 rounded flex items-center gap-1">
                    {modelsLoaded ?
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> :
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                    }
                    {modelsLoaded ? "AI" : "..."}
                </div>

                {/* Strike Counter */}
                <div className="absolute bottom-1 right-1 flex gap-0.5">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < strikes ? 'bg-red-500' : 'bg-gray-500'}`} />
                    ))}
                </div>
            </div>

            {/* Pause Modal */}
            {isPaused && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center text-white space-y-6">
                    <ShieldAlert className="w-24 h-24 text-red-500 animate-bounce" />
                    <h1 className="text-4xl font-bold text-red-500">PAUSED</h1>
                    <div className="text-center space-y-2">
                        <p className="text-xl">Suspicious activity detected.</p>
                        <p className="text-slate-400">Clear desk. Look at screen.</p>
                    </div>
                    <div className="text-6xl font-mono text-yellow-400 border-4 border-yellow-400 rounded-full w-32 h-32 flex items-center justify-center">
                        {pauseTimer}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecureExamGuard;
