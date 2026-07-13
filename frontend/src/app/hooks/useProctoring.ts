import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

// Types
export type ViolationType = 'MULTIPLE_FACES' | 'NO_FACE' | 'FORBIDDEN_OBJECT' | 'AUDIO_SPIKE' | 'TAB_SWITCH' | 'FULLSCREEN_EXIT' | 'DEV_TOOLS';

export interface Violation {
    type: ViolationType;
    timestamp: number;
    message: string;
    snapshot?: string;
}

interface UseProctoringProps {
    onViolation: (violation: Violation) => void;
    isExamActive: boolean;
}

export const useProctoring = ({ onViolation, isExamActive }: UseProctoringProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [strikes, setStrikes] = useState(0);

    // Model refs
    const objectModelRef = useRef<cocoSsd.ObjectDetection | null>(null);

    // Audio refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);

    // Performance optimization refs
    const canvasRef = useRef<HTMLCanvasElement | null>(null); // REUSE canvas
    const lastViolationTimeRef = useRef<{ [key: string]: number }>({});
    const faceIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const objectIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const faceAbsenceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Constants - OPTIMIZED FOR NORMAL LAPTOPS
    const VIOLATION_COOLDOWN = 5000; // 5 seconds between same violation type
    const AUDIO_THRESHOLD = 35;
    const FACE_CHECK_INTERVAL = 400; // ms - Reduced frequency
    const OBJECT_CHECK_INTERVAL = 500; // ms - FASTER for phone detection (was 1000)
    const VIDEO_WIDTH = 320; // Lower resolution for performance
    const VIDEO_HEIGHT = 240;
    const SNAPSHOT_WIDTH = 160; // Even smaller snapshots
    const SNAPSHOT_HEIGHT = 120;

    // Load Models & Initialize Camera
    useEffect(() => {
        const init = async () => {
            try {
                // Camera with LOW RESOLUTION for performance
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            facingMode: 'user',
                            width: { ideal: VIDEO_WIDTH },
                            height: { ideal: VIDEO_HEIGHT }
                        },
                        audio: false
                    });

                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.onloadedmetadata = () => {
                            videoRef.current?.play();
                        };
                    }
                }
            } catch (err) {
                console.error("Camera Error:", err);
                onViolation({ type: 'NO_FACE', timestamp: Date.now(), message: "Camera access denied." });
            }

            // Load AI Models
            try {
                console.log("⚡ Loading AI Models (Lite Mode)...");

                // COCO-SSD Lite
                const objectModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
                objectModelRef.current = objectModel;
                console.log("✅ COCO-SSD Loaded");

                // Face API - ONLY TinyFaceDetector (NO LANDMARKS for performance)
                const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
                await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
                console.log("✅ FaceAPI Loaded (Tiny)");

                setModelsLoaded(true);
            } catch (err) {
                console.error("Failed to load AI models:", err);
                setModelsLoaded(true);
            }
        };

        if (isExamActive) {
            init();
        }

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isExamActive, onViolation]);

    // Audio Monitoring (VAD)
    const setupAudioMonitoring = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStreamRef.current = stream;

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);

            // High-pass filter
            const filter = audioContext.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 100;

            microphone.connect(filter);
            filter.connect(analyser);

            analyser.fftSize = 256; // Smaller FFT for performance
            analyser.smoothingTimeConstant = 0.5;

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
        } catch (err) {
            console.error("Audio permission denied:", err);
        }
    };

    // Helper: OPTIMIZED Snapshot Capture (REUSE CANVAS)
    const captureSnapshot = useCallback((): string | undefined => {
        if (!videoRef.current) return undefined;
        try {
            // REUSE canvas instead of creating new one
            if (!canvasRef.current) {
                canvasRef.current = document.createElement('canvas');
            }
            const canvas = canvasRef.current;
            canvas.width = SNAPSHOT_WIDTH;
            canvas.height = SNAPSHOT_HEIGHT;

            const ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha for performance
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, SNAPSHOT_WIDTH, SNAPSHOT_HEIGHT);
                const dataURL = canvas.toDataURL('image/jpeg', 0.3); // Low quality for size
                return dataURL;
            }
        } catch (e) {
            return undefined;
        }
        return undefined;
    }, []);

    // Helper: Throttled Violation Handler
    const handleViolationThrottled = useCallback((type: ViolationType, message: string, includeSnapshot = false) => {
        const now = Date.now();
        const lastTime = lastViolationTimeRef.current[type] || 0;

        if (now - lastTime > VIOLATION_COOLDOWN) {
            lastViolationTimeRef.current[type] = now;
            setStrikes(prev => {
                const newStrikes = prev + 1;
                onViolation({
                    type,
                    message,
                    timestamp: now,
                    snapshot: includeSnapshot ? captureSnapshot() : undefined
                });
                return newStrikes;
            });
        }
    }, [captureSnapshot, onViolation]);

    // STAGGERED Detection - Face Detection Loop
    useEffect(() => {
        if (!isExamActive || !modelsLoaded) return;

        const faceDetectionLoop = async () => {
            if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

            if (faceapi.nets.tinyFaceDetector.isLoaded) {
                try {
                    const detections = await faceapi.detectAllFaces(
                        videoRef.current,
                        new faceapi.TinyFaceDetectorOptions({ inputSize: 128 }) // Smaller input for speed
                    );

                    if (detections.length === 0) {
                        if (!faceAbsenceTimerRef.current) {
                            faceAbsenceTimerRef.current = setTimeout(() => {
                                handleViolationThrottled('NO_FACE', "Face not visible for 5 seconds.", false);
                                faceAbsenceTimerRef.current = null;
                            }, 5000);
                        }
                    } else {
                        if (faceAbsenceTimerRef.current) {
                            clearTimeout(faceAbsenceTimerRef.current);
                            faceAbsenceTimerRef.current = null;
                        }

                        if (detections.length > 1 && detections[1].score > 0.7) {
                            handleViolationThrottled('MULTIPLE_FACES', "Multiple faces detected!", true);
                        }
                    }
                } catch (e) {
                    console.error("Face Detection Error:", e);
                }
            }
        };

        faceIntervalRef.current = setInterval(faceDetectionLoop, FACE_CHECK_INTERVAL);

        return () => {
            if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
            if (faceAbsenceTimerRef.current) clearTimeout(faceAbsenceTimerRef.current);
        };
    }, [isExamActive, modelsLoaded, handleViolationThrottled]);

    // STAGGERED Detection - Object Detection Loop
    useEffect(() => {
        if (!isExamActive || !modelsLoaded || !objectModelRef.current) return;

        const objectDetectionLoop = async () => {
            if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

            try {
                const predictions = await objectModelRef.current!.detect(videoRef.current, undefined, 0.35);

                const phone = predictions.find(p =>
                    (p.class === 'cell phone' || p.class === 'mobile phone') && p.score > 0.40
                );

                if (phone) {
                    handleViolationThrottled('FORBIDDEN_OBJECT', "CRITICAL: Phone detected", true);
                }
            } catch (e) {
                console.error("Object Detection Error:", e);
            }
        };

        objectIntervalRef.current = setInterval(objectDetectionLoop, OBJECT_CHECK_INTERVAL);

        return () => {
            if (objectIntervalRef.current) clearInterval(objectIntervalRef.current);
        };
    }, [isExamActive, modelsLoaded, handleViolationThrottled]);

    // Audio Detection
    useEffect(() => {
        if (!isExamActive) return;

        setupAudioMonitoring();

        const audioInterval = setInterval(() => {
            if (analyserRef.current) {
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;

                if (average > AUDIO_THRESHOLD) {
                    handleViolationThrottled('AUDIO_SPIKE', "High noise detected.", false);
                }
            }
        }, 1000); // Check every 1s

        return () => {
            clearInterval(audioInterval);
            if (audioContextRef.current) audioContextRef.current.close();
            if (audioStreamRef.current) audioStreamRef.current.getTracks().forEach(t => t.stop());
        };
    }, [isExamActive, handleViolationThrottled]);

    // Browser Security
    useEffect(() => {
        if (!isExamActive) return;

        const handleVisibilityChange = () => {
            if (document.hidden) handleViolationThrottled('TAB_SWITCH', "Tab switched.", false);
        };

        const handleBlur = () => handleViolationThrottled('TAB_SWITCH', "Window lost focus.", false);

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) handleViolationThrottled('FULLSCREEN_EXIT', "Exited fullscreen.", false);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey || e.altKey) &&
                ['c', 'v', 'p', 's', 'x'].includes(e.key.toLowerCase())) {
                e.preventDefault();
                e.stopPropagation();
                handleViolationThrottled('DEV_TOOLS', `Blocked: ${e.key.toUpperCase()}`, false);
            }
        };

        const handleContextMenu = (e: Event) => {
            e.preventDefault();
            handleViolationThrottled('DEV_TOOLS', "Right-click disabled.", false);
        };

        const EVENTS = ['copy', 'paste', 'cut', 'drag', 'drop'];
        const preventDefault = (e: Event) => e.preventDefault();

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('contextmenu', handleContextMenu);
        EVENTS.forEach(ev => document.addEventListener(ev, preventDefault));

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('contextmenu', handleContextMenu);
            EVENTS.forEach(ev => document.removeEventListener(ev, preventDefault));
        };
    }, [isExamActive, handleViolationThrottled]);

    // Cleanup function to stop all streams
    const stopAllStreams = useCallback(() => {
        // Stop video stream
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => {
                track.stop();
                console.log('🛑 Stopped track:', track.kind);
            });
            videoRef.current.srcObject = null;
        }

        // Stop audio stream
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log('🛑 Stopped audio track');
            });
            audioStreamRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        console.log('✅ All streams stopped');
    }, []);

    return {
        videoRef,
        modelsLoaded,
        strikes,
        stopAllStreams
    };
};
