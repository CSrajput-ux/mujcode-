import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs'; // Warning: This might be heavy, ensure it's needed for coco-ssd backend

// Types
export type ViolationType = 'MULTIPLE_FACES' | 'NO_FACE' | 'GAZE_AWAY' | 'FORBIDDEN_OBJECT' | 'AUDIO_NOISE' | 'TAB_SWITCH' | 'FULLSCREEN_EXIT' | 'MOUSE_LEAVE' | 'DEV_TOOLS' | 'UNAUTHORIZED_EXTENSION';

export interface Violation {
    type: ViolationType;
    timestamp: number;
    message: string;
    snapshot?: string; // Base64 image
}

interface UseProctoringProps {
    onViolation: (violation: Violation) => void;
    isExamActive: boolean;
}

export const useProctoring = ({ onViolation, isExamActive }: UseProctoringProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [strikes, setStrikes] = useState(0);

    // Model refs to persist across renders
    const faceModelRef = useRef<any>(null); // keeping generic to avoid strict face-api types issues if not perfectly matched
    const objectModelRef = useRef<cocoSsd.ObjectDetection | null>(null);

    // Audio refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);

    // Constants
    const MOVEMENT_THRESHOLD = 50; // Simple gaze approximation logic
    const AUDIO_THRESHOLD = 50; // Decibel-like threshold (needs calibration)
    const FORBIDDEN_OBJECTS = ['cell phone', 'book', 'laptop'];

    // Load Models & Initialize Camera
    useEffect(() => {
        const init = async () => {
            // 1. Setup Camera First
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'user' },
                        audio: false // Audio is handled separately
                    });

                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        // Determine when video is ready
                        videoRef.current.onloadedmetadata = () => {
                            videoRef.current?.play();
                        };
                    }
                }
            } catch (err) {
                console.error("Camera Error:", err);
                // We could likely notify parent here about permission denial
            }

            // 2. Load Models
            try {
                console.log("Loading AI Models...");

                // Load COCO-SSD First (It's critical for object detection)
                try {
                    const objectModel = await cocoSsd.load();
                    objectModelRef.current = objectModel;
                    console.log("COCO-SSD Loaded");
                } catch (e) {
                    console.error("Failed to load COCO-SSD", e);
                }

                // Load Face API models
                // Using a faster/lighter model set or ensure URL is correct
                // Alternative: '/models' if hosted locally
                const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                ]);
                console.log("FaceAPI Loaded");

                setModelsLoaded(true);
            } catch (err) {
                console.error("Failed to load AI models:", err);
                setModelsLoaded(true); // Allow proceed even if partial fail
            }
        };

        if (isExamActive) {
            init();
        }

        // Cleanup function for stream
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isExamActive]);

    // Audio Monitoring Setup
    const setupAudioMonitoring = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);

            microphone.connect(analyser);
            analyser.fftSize = 256;

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            microphoneRef.current = microphone;
        } catch (err) {
            console.error("Audio permission denied or error:", err);
        }
    };

    // Helper: Capture Snapshot
    const captureSnapshot = useCallback((): string | undefined => {
        if (!videoRef.current) return undefined;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/jpeg', 0.5);
        }
        return undefined;
    }, []);

    // Main Detection Loop
    useEffect(() => {
        if (!isExamActive) return;

        // Start Audio
        setupAudioMonitoring();

        const interval = setInterval(async () => {
            if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

            // 1. Face & Gaze Detection
            try {
                // Ensure models are actually loaded before using
                if (faceapi.nets.tinyFaceDetector.isLoaded) {
                    const detection = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();

                    if (detection.length === 0) {
                        handleViolation('NO_FACE', "No face detected. Please stay in frame.");
                    } else if (detection.length > 1) {
                        handleViolation('MULTIPLE_FACES', "Multiple faces detected.");
                    } else {
                        // Gaze Tracking (Simple logic)
                        // If needed
                    }
                }
            } catch (e) {
                console.error("Face Detection Error", e);
            }

            // 2. Object Detection
            if (objectModelRef.current) {
                try {
                    const predictions = await objectModelRef.current.detect(videoRef.current);
                    const forbidden = predictions.find(p => FORBIDDEN_OBJECTS.includes(p.class) && p.score > 0.7);
                    if (forbidden) {
                        handleViolation('FORBIDDEN_OBJECT', `Forbidden object detected: ${forbidden.class}`);
                    }
                } catch (e) {
                    console.error("Object Detection Error", e);
                }
            }

            // 3. Audio Detection
            if (analyserRef.current) {
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
                if (average > AUDIO_THRESHOLD) {
                    // console.warn("Audio spike:", average);
                }
            }

        }, 1000);

        return () => {
            clearInterval(interval);
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        };
    }, [isExamActive, modelsLoaded]);


    // Browser Lockdown & DOM Police
    useEffect(() => {
        if (!isExamActive) return;

        // 1. Visibility Change (Tab Switching)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleViolation('TAB_SWITCH', "You switched tabs or minimized the browser.");
            }
        };

        // 2. Blur (Lost Focus)
        const handleBlur = () => {
            handleViolation('TAB_SWITCH', "Browser lost focus.");
        };

        // 3. Fullscreen Check
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                handleViolation('FULLSCREEN_EXIT', "You exited fullscreen mode.");
            }
        };

        // 4. Keyboard Bans
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent Copy/Paste/Print
            if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'p', 's'].includes(e.key.toLowerCase())) {
                e.preventDefault();
                handleViolation('DEV_TOOLS', `Blocked Shortcut: Ctrl+${e.key.toUpperCase()}`);
            }
            // Prevent Alt+Tab (browser catches this hard, but on blur triggers anyway)
        };

        // 5. Context Menu
        const handleContextMenu = (e: Event) => e.preventDefault();

        // 6. DOM Police (MutationObserver)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node instanceof HTMLElement) {
                        const content = (node.className + " " + node.id + " " + node.innerText).toLowerCase();
                        const banned = ['grammarly', 'gpt', 'ai-helper', 'sidebar', 'overlay', 'monica'];
                        if (banned.some(k => content.includes(k))) {
                            node.remove();
                            handleViolation('UNAUTHORIZED_EXTENSION', `Unauthorized overlay removed: ${node.tagName}`);
                        }
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // Listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('contextmenu', handleContextMenu);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('contextmenu', handleContextMenu);
            observer.disconnect();
        };
    }, [isExamActive]);

    const handleViolation = (type: ViolationType, message: string) => {
        setStrikes(prev => {
            const newStrikes = prev + 1;
            // Logic to notify parent
            onViolation({
                type,
                message,
                timestamp: Date.now(),
                snapshot: captureSnapshot()
            });
            return newStrikes;
        });
    };

    return {
        videoRef,
        modelsLoaded,
        strikes
    };
};
