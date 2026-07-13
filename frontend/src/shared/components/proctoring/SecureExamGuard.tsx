import React, { useEffect, useState } from 'react';
import { useProctoring, Violation } from '@/shared/hooks/useProctoring';
import { toast } from 'sonner';
import { ShieldAlert } from 'lucide-react';

interface SecureExamGuardProps {
    onTerminate: () => void; // Call when exam is terminated
    isExamActive: boolean;
    children: React.ReactNode;
    onViolation?: (reason: string) => void;
}

const SecureExamGuard: React.FC<SecureExamGuardProps> = ({ onTerminate, isExamActive, children, onViolation }) => {
    const [violations, setViolations] = useState<Violation[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [pauseTimer, setPauseTimer] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(true); // Assume true initially to avoid flicker, corrected by effect

    const handleViolation = (violation: Violation) => {
        setViolations(prev => [...prev, violation]);
        const currentStrikes = violations.length + 1; // +1 because state update is async

        console.log(`Violation: ${violation.type} - ${violation.message}`);

        // Notify parent
        if (onViolation) {
            onViolation(violation.message);
        }

        // Strike System
        if (currentStrikes === 1) {
            // STRIKE 1: Yellow Warning
            toast.warning("Strike 1: Warning", {
                description: violation.message + " Eyes on screen!",
            });
        } else if (currentStrikes === 2) {
            // STRIKE 2: Red Warning & Pause
            toast.error("Strike 2: Final Warning", {
                description: "Exam paused for 10 seconds. Next violation terminates the exam.",
            });
            setIsPaused(true);
            setPauseTimer(10);
        } else if (currentStrikes >= 3) {
            // STRIKE 3: Terminate
            toast.error("Strike 3: Exam Terminated", {
                description: "You have exceeded the violation limit.",
            });
            onTerminate();
        }
    };

    const { videoRef, modelsLoaded, strikes } = useProctoring({
        onViolation: handleViolation,
        isExamActive: isExamActive && !isPaused
    });

    // Pause Timer properties
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPaused && pauseTimer > 0) {
            interval = setInterval(() => {
                setPauseTimer(prev => prev - 1);
            }, 1000);
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
            console.error("Error attempting to enable fullscreen:", err);
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        if (isExamActive) {
            enforceFullscreen();
        }

        const handleFSChange = () => {
            if (!document.fullscreenElement) {
                setIsFullscreen(false);
            } else {
                setIsFullscreen(true);
            }
        };
        document.addEventListener('fullscreenchange', handleFSChange);
        return () => document.removeEventListener('fullscreenchange', handleFSChange);
    }, [isExamActive]);

    return (
        <div className="relative w-full h-full bg-white">
            {/* Fullscreen Recovery Overlay */}
            {!isFullscreen && isExamActive && (
                <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center text-white text-center p-8">
                    <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
                    <h2 className="text-3xl font-bold mb-4">Fullscreen Required</h2>
                    <p className="text-xl mb-8 max-w-lg text-slate-300">
                        Secure Mode requires the exam to be taken in fullscreen.
                        Press the button below to resume.
                    </p>
                    <button
                        onClick={enforceFullscreen}
                        className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition shadow-lg hover:shadow-red-500/20"
                    >
                        Enable Fullscreen
                    </button>
                </div>
            )}

            {/* Main Exam Content - Blurred if Paused */}
            <div className={`transition-all duration-300 ${isPaused ? 'blur-md pointer-events-none select-none' : ''}`}>
                {children}
            </div>

            {/* Webcam Feed (Small & Draggable-ish look via absolute) */}
            <div className="fixed bottom-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-slate-700 z-50 group">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                />
                <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1 rounded flex items-center gap-1 backdrop-blur-sm">
                    {modelsLoaded ? <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> : <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />}
                    {modelsLoaded ? "AI Active" : "Loading..."}
                </div>

                {/* Tooltip to explain limitations */}
                <div className="hidden group-hover:flex absolute -top-24 right-0 w-64 bg-black/80 text-white text-xs p-2 rounded backdrop-blur-md">
                    <p>Protection Active: Face, Object, & Audio.</p>
                    <p className="mt-1 text-red-300">Warning: Alt+Tab or Tab Switching triggers a violation.</p>
                </div>

                {/* Strike Counter Overlay on Video */}
                <div className="absolute bottom-1 right-1 flex gap-1">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i < strikes ? 'bg-red-500' : 'bg-gray-500'}`} />
                    ))}
                </div>
            </div>

            {/* Pause / Lockout Modal */}
            {isPaused && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center text-white space-y-6 animate-in fade-in duration-300">
                    <ShieldAlert className="w-24 h-24 text-red-500 animate-bounce" />
                    <h1 className="text-4xl font-bold tracking-tight text-red-500">EXAM PAUSED</h1>
                    <div className="text-center space-y-2 max-w-md">
                        <p className="text-xl">Suspicious activity detected.</p>
                        <p className="text-slate-400">Please clear your desk and look at the screen.</p>
                    </div>

                    <div className="text-6xl font-mono text-yellow-400 border-4 border-yellow-400 rounded-full w-32 h-32 flex items-center justify-center">
                        {pauseTimer}
                    </div>

                    <p className="text-sm text-slate-500 uppercase tracking-widest mt-8">Resuming shortly...</p>
                </div>
            )}
        </div>
    );
};

export default SecureExamGuard;
