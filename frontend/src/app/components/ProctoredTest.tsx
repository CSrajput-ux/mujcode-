import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { AlertTriangle, Camera, ShieldAlert, Maximize } from 'lucide-react';

interface ProctoredTestProps {
    onViolation?: (reason: string) => void;
    onSubmitTest: () => void;
    children: React.ReactNode;
    testStarted: boolean;
}

export default function ProctoredTest({ onViolation, onSubmitTest, children, testStarted }: ProctoredTestProps) {
    // State
    const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [warningsLeft, setWarningsLeft] = useState(3);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const requestRef = useRef<number>();
    const isProcessingRef = useRef(false);

    // --- 1. Load AI Model & Camera ---
    useEffect(() => {
        const initCamera = async () => {
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'user' },
                        audio: false
                    });

                    streamRef.current = stream;

                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.onloadedmetadata = () => {
                            videoRef.current?.play();
                            setIsCameraReady(true);
                        };
                    }
                }
            } catch (error) {
                console.error('Camera Error:', error);
                toast.error('Camera permission is required to start the test.');
            }
        };

        const loadModel = async () => {
            try {
                // Optimization: Enable Prod Mode & force WebGL (GPU)
                tf.enableProdMode();
                await tf.setBackend('webgl');
                await tf.ready();

                console.log(`Current TF Backend: ${tf.getBackend()}`);

                const loadedModel = await cocoSsd.load();
                setModel(loadedModel);
                console.log('AI Model Loaded with WebGL Acceleration');
            } catch (error) {
                console.error('AI Model Error:', error);
                // Fallback to CPU if WebGL fails
                try {
                    await tf.setBackend('cpu');
                    await tf.ready();
                    const loadedModel = await cocoSsd.load();
                    setModel(loadedModel);
                    console.log('AI Model Loaded (CPU Fallback)');
                } catch (cpuError) {
                    console.error('AI Model Critical Failure:', cpuError);
                }
            }
        };

        if (testStarted) {
            initCamera();
            loadModel();
        }

        return () => {
            // Cleanup camera stream
            // Cleanup camera stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };
    }, [testStarted]);

    // --- 2. AI Detection Loop (Optimized) ---
    useEffect(() => {
        let animationFrameId: number;
        let isCancelled = false;

        const detectFrame = async () => {
            if (isCancelled) return;

            if (model && videoRef.current && isCameraReady && !isProcessingRef.current) {
                isProcessingRef.current = true;
                try {
                    const predictions = await model.detect(videoRef.current);

                    // Check for cell phone
                    const phoneDetected = predictions.find(
                        p => p.class === 'cell phone' && p.score > 0.60
                    );

                    if (phoneDetected) {
                        handleViolation('Mobile Phone Detected');
                    }
                } catch (err) {
                    console.error('Detection Error', err);
                } finally {
                    isProcessingRef.current = false;
                }
            }

            // Schedule the next frame only after the current one is done, 
            // with a small delay to yield to the main thread (less CPU hogging)
            if (!isCancelled) {
                setTimeout(() => {
                    animationFrameId = requestAnimationFrame(detectFrame);
                }, 500);
            }
        };

        if (testStarted && model && isCameraReady) {
            detectFrame();
        }

        return () => {
            isCancelled = true;
            cancelAnimationFrame(animationFrameId);
        };
    }, [model, isCameraReady, warningsLeft, testStarted]);

    // --- 3. Fullscreen & Tab Switching Enforcement ---
    useEffect(() => {
        if (!testStarted) return;

        // Enter Fullscreen
        const enterFullscreen = async () => {
            try {
                const elem = document.documentElement;
                if (elem.requestFullscreen) {
                    await elem.requestFullscreen();
                    setIsFullscreen(true);
                }
            } catch (err) {
                console.error('Fullscreen Error:', err);
                toast.error('Fullscreen mode is required!');
            }
        };
        enterFullscreen();

        // Listeners
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                setIsFullscreen(false);
                handleViolation('Exited Fullscreen');
            } else {
                setIsFullscreen(true);
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleViolation('Tab Switch / Minimized');
            }
        };

        const handleWindowBlur = () => {
            handleViolation('Window Focus Lost');
        };

        // Add Listeners
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, [testStarted]);


    // --- 4. Violation Handler ---
    const handleViolation = (reason: string) => {
        // Prevent multiple simultaneous triggers if already submitting
        if (warningsLeft <= 0) return;

        // Calculate new warnings left
        // We use functional state update to ensure we have the latest value if called rapidly
        setWarningsLeft(prev => {
            const newList = prev - 1;

            // Notification
            if (newList > 0) {
                toast.error(`SECURITY WARNING: ${reason}`, {
                    description: `You have ${newList} warnings remaining.`,
                    duration: 5000,
                });
            } else {
                toast.error(`SECURITY VIOLATION: ${reason}`, {
                    description: 'Test is being submitted automatically.',
                    duration: 10000,
                });

                // Trigger auto-submit
                setTimeout(() => {
                    onSubmitTest();
                }, 1000);
            }

            return newList;
        });

        if (onViolation) onViolation(reason);
    };

    // --- Render ---
    return (
        <div className="relative min-h-screen bg-gray-50">
            {/* Warning Overlay (Persistent) */}
            <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
                <div className="bg-white border text-red-600 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-5 h-5" />
                    Warnings Left: {warningsLeft}
                </div>
            </div>

            {/* Camera Overlay (Small, Bottom Right) */}
            <div className="fixed bottom-4 right-4 z-50 w-48 h-36 bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-gray-800">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover transform scale-x-[-1]" // Mirror
                    muted
                    playsInline
                />
                {!isCameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs">
                        <Camera className="w-6 h-6 mb-1" />
                        Loading Cam...
                    </div>
                )}
                <div className="absolute bottom-1 right-1">
                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                </div>
            </div>

            {/* Main Content (The Exam) */}
            <div className={warningsLeft <= 0 ? "pointer-events-none opacity-50 filter grayscale" : ""}>
                {children}
            </div>

            {/* Fullscreen Block Overlay */}
            {!isFullscreen && testStarted && warningsLeft > 0 && (
                <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center text-white text-center p-8">
                    <ShieldAlert className="w-16 h-16 text-red-500 mb-6" />
                    <h2 className="text-3xl font-bold mb-4">Security Violation</h2>
                    <p className="text-xl mb-8">You must be in fullscreen mode to continue the test.</p>
                    <button
                        onClick={() => document.documentElement.requestFullscreen()}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition"
                    >
                        <Maximize className="w-5 h-5" />
                        Return to Fullscreen
                    </button>
                </div>
            )}
        </div>
    );
}
