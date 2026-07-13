import React, { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Maximize2, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface SecureTestEnvironmentProps {
    children: React.ReactNode;
    onViolation: (reason: string) => void;
    isTestActive: boolean;
    maxViolations?: number;
}

export const SecureTestEnvironment: React.FC<SecureTestEnvironmentProps> = ({
    children,
    onViolation,
    isTestActive,
    maxViolations = 3
}) => {
    const [violationCount, setViolationCount] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');

    const handleViolation = useCallback((reason: string) => {
        if (!isTestActive) return;

        setViolationCount(prev => {
            const newCount = prev + 1;

            // Show warning toast
            toast.error(`Warning ${newCount}/${maxViolations}: ${reason}`, {
                duration: 4000,
            });

            // Show temporary warning overlay
            setWarningMessage(reason);
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 3000);

            // Trigger callback
            onViolation(reason);

            return newCount;
        });
    }, [isTestActive, maxViolations, onViolation]);

    const enterFullscreen = async () => {
        try {
            await document.documentElement.requestFullscreen();
        } catch (err) {
            console.error('Error attempting to enable fullscreen:', err);
        }
    };

    useEffect(() => {
        if (!isTestActive) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleViolation('Tab switching detected');
            }
        };

        const handleBlur = () => {
            handleViolation('Window focus lost');
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            // Optional: Don't trigger violation for right click, just block it
            // handleViolation('Right-click attempted'); 
        };

        const handleCopyPaste = (e: ClipboardEvent) => {
            e.preventDefault();
            handleViolation('Copy/Paste attempted');
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                setIsFullscreen(false);
                handleViolation('Exited fullscreen mode');
            } else {
                setIsFullscreen(true);
            }
        };

        // Attach listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('copy', handleCopyPaste);
        document.addEventListener('paste', handleCopyPaste);
        document.addEventListener('cut', handleCopyPaste);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        // Initial fullscreen check
        if (!document.fullscreenElement) {
            // We can't auto-trigger fullscreen without user interaction usually, 
            // but we can show the UI to request it.
            setIsFullscreen(false);
        } else {
            setIsFullscreen(true);
        }

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('copy', handleCopyPaste);
            document.removeEventListener('paste', handleCopyPaste);
            document.removeEventListener('cut', handleCopyPaste);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [isTestActive, handleViolation]);

    // If not fullscreen and test is active, block view
    if (isTestActive && !isFullscreen) {
        return (
            <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center text-white p-4 text-center">
                <Lock className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Secure Browser Environment Required</h2>
                <p className="text-gray-300 mb-6 max-w-md">
                    This test must be taken in fullscreen mode. Multiple violations (tab switching, resizing) will result in auto-submission.
                </p>
                <button
                    onClick={enterFullscreen}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2 transition-all"
                >
                    <Maximize2 className="w-5 h-5" />
                    Enter Fullscreen Mode
                </button>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen select-none">
            {/* Warning Overlay */}
            {showWarning && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-4 text-center animate-in slide-in-from-top duration-300 shadow-lg">
                    <div className="flex items-center justify-center gap-2 font-bold text-lg">
                        <AlertTriangle className="w-6 h-6" />
                        WARNING: {warningMessage}
                    </div>
                    <p className="text-sm opacity-90">Violation {violationCount}/{maxViolations}. Further violations will terminate the test.</p>
                </div>
            )}

            {children}
        </div>
    );
};
