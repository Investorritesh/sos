'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Cpu, AlertTriangle, ShieldCheck, ChevronLeft, Power, Crosshair, MapPin } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { toast } from 'react-hot-toast';
import { ParticleCanvas } from '@/components/ParticleCanvas';

export default function ThreatScanner() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [isModelLoading, setIsModelLoading] = useState(true);
    const [modelReady, setModelReady] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [detections, setDetections] = useState<cocoSsd.DetectedObject[]>([]);
    const [threatLevel, setThreatLevel] = useState<'Safe' | 'Elevated' | 'Critical'>('Safe');

    const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
    const requestRef = useRef<number | null>(null);
    const [scanPulse, setScanPulse] = useState(0);
    const [lastDetectionTime, setLastDetectionTime] = useState<number>(0);
    const [sysLogs, setSysLogs] = useState<string[]>(['INITIALIZING NEURAL LINK...', 'STANDBY MODE']);

    // Load Model
    useEffect(() => {
        const loadModel = async () => {
            try {
                await tf.ready();
                modelRef.current = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
                setModelReady(true);
                setIsModelLoading(false);
            } catch (err) {
                console.error('Error loading AI model', err);
                toast.error('Failed to load neural network core.');
                setIsModelLoading(false);
            }
        };
        loadModel();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    // Control Camera & Scanning
    useEffect(() => {
        if (isScanning && modelReady) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isScanning, modelReady]);

    const startCamera = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' },
                    audio: false,
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        if (videoRef.current && canvasRef.current) {
                            videoRef.current.play();
                            canvasRef.current.width = videoRef.current.videoWidth;
                            canvasRef.current.height = videoRef.current.videoHeight;
                            detectFrame();
                        }
                    };
                }
            } catch (err) {
                console.error('Error accessing camera:', err);
                toast.error('Camera access denied or unavailable.');
                setIsScanning(false);
            }
        }
    };

    const stopCamera = () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setDetections([]);
        setThreatLevel('Safe');
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const detectFrame = async () => {
        if (!videoRef.current || !modelRef.current || !canvasRef.current || !isScanning) return;

        // Check if video is playing
        if (videoRef.current.readyState === 4) {
            const predictions = await modelRef.current.detect(videoRef.current);
            setDetections(predictions);
            drawPredictions(predictions);

            // Determine Threat Level based on detections (Refined Logic)
            const people = predictions.filter(p => p.class === 'person' && p.score > 0.6);
            const vehicles = predictions.filter(p => ['car', 'truck', 'motorcycle'].includes(p.class) && p.score > 0.5);

            const hasClosePerson = people.some(p => {
                const [,, w, h] = p.bbox;
                return (w * h) / (canvasRef.current!.width * canvasRef.current!.height) > 0.15;
            });

            if (people.length >= 3 || (people.length >= 1 && hasClosePerson)) {
                setThreatLevel('Critical');
                if (Date.now() - lastDetectionTime > 2000) {
                    setSysLogs(prev => [`CRITICAL: TARGET PROXIMITY BREACHED [${new Date().toLocaleTimeString()}]`, ...prev.slice(0, 5)]);
                    setLastDetectionTime(Date.now());
                }
            } else if (people.length > 0 || vehicles.length > 0) {
                setThreatLevel('Elevated');
                if (Date.now() - lastDetectionTime > 3000) {
                    setSysLogs(prev => [`VECTORS IDENTIFIED: ${people.length}P ${vehicles.length}V`, ...prev.slice(0, 5)]);
                    setLastDetectionTime(Date.now());
                }
            } else {
                setThreatLevel('Safe');
            }
        }

        if (isScanning) {
            requestRef.current = requestAnimationFrame(detectFrame);
        }
    };

    const drawPredictions = (predictions: cocoSsd.DetectedObject[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Scanning Line
        const time = Date.now() / 1000;
        const scanLineY = (Math.sin(time * 2) + 1) / 2 * canvas.height;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
        ctx.lineWidth = 2;
        ctx.moveTo(0, scanLineY);
        ctx.lineTo(canvas.width, scanLineY);
        ctx.stroke();

        predictions.forEach(prediction => {
            const [x, y, width, height] = prediction.bbox;
            const isPerson = prediction.class === 'person';
            const color = isPerson ? '#ef4444' : '#6366f1';
            const proximity = Math.round((width * height) / (canvas.width * canvas.height) * 100);

            // 1. Draw Bounding Box (Corner Style)
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            const cornerSize = 15;
            
            // Top Left
            ctx.beginPath();
            ctx.moveTo(x, y + cornerSize);
            ctx.lineTo(x, y);
            ctx.lineTo(x + cornerSize, y);
            ctx.stroke();

            // Top Right
            ctx.beginPath();
            ctx.moveTo(x + width - cornerSize, y);
            ctx.lineTo(x + width, y);
            ctx.lineTo(x + width, y + cornerSize);
            ctx.stroke();

            // Bottom Left
            ctx.beginPath();
            ctx.moveTo(x, y + height - cornerSize);
            ctx.lineTo(x, y + height);
            ctx.lineTo(x + cornerSize, y + height);
            ctx.stroke();

            // Bottom Right
            ctx.beginPath();
            ctx.moveTo(x + width - cornerSize, y + height);
            ctx.lineTo(x + width, y + height);
            ctx.lineTo(x + width, y + height - cornerSize);
            ctx.stroke();

            // 2. Draw Digital Shadow
            ctx.fillStyle = isPerson ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)';
            ctx.fillRect(x, y, width, height);

            // 3. Tactical Label
            ctx.fillStyle = color;
            ctx.font = 'bold 9px "Inter", sans-serif';
            ctx.textBaseline = 'bottom';
            const labelText = `${prediction.class.toUpperCase()} // PROX: ${proximity}%`;
            ctx.fillText(labelText, x, y - 5);

            // 4. Telemetry lines
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.setLineDash([2, 4]);
            ctx.lineWidth = 1;
            ctx.moveTo(x + width, y + height / 2);
            ctx.lineTo(x + width + 20, y + height / 2);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = color;
            ctx.fillText(`CONF: ${Math.round(prediction.score * 100)}%`, x + width + 25, y + height / 2 + 3);

            // 5. Targeting Crosshair on high confidence
            if (prediction.score > 0.7) {
                const cx = x + width/2;
                const cy = y + height/2;
                ctx.beginPath();
                ctx.arc(cx, cy, 5, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
    };

    return (
        <main className="relative min-h-screen pb-32 overflow-hidden">
            <ParticleCanvas />
            <Navbar pollingFrequency={10000} />

            <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32">
                <Link href="/" className="inline-flex items-center gap-2 mb-8 text-sm font-semibold tracking-wide" style={{ color: 'var(--fg-muted)' }}>
                    <ChevronLeft className="w-4 h-4" /> Return to Dashboard
                </Link>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"
                                style={{ background: 'rgba(var(--primary-rgb),0.1)', color: 'var(--primary)', border: '1px solid rgba(var(--primary-rgb),0.2)' }}>
                                <Cpu className="w-3 h-3" /> Core AI Engine
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{ color: 'var(--fg)' }}>
                            Real-time <span className="text-gradient">Threat Scanner</span>
                        </h1>
                        <p className="max-w-xl" style={{ color: 'var(--fg-muted)', fontSize: '15px', lineHeight: '1.6' }}>
                            Advanced neural object detection system. Analyzes your surroundings continuously for potential environmental threats and situational tracking.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsScanning(!isScanning)}
                            disabled={isModelLoading}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-wide text-xs transition-all duration-300 ${isScanning ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]' :
                                    'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 hover:bg-indigo-500/20'
                                } ${isModelLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Power className="w-4 h-4" />
                            {isModelLoading ? 'Booting Engine...' : isScanning ? 'Disarm Scanner' : 'Arm Scanner'}
                        </button>
                    </div>
                </div>

                {/* Main UI */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Scanner Viewport */}
                    <div className="lg:col-span-2 relative">
                        <div className="glass-card rounded-3xl overflow-hidden relative shadow-2xl" style={{ border: '1px solid var(--glass-border)', aspectRatio: '16/9', background: '#0a0a0b' }}>

                            {/* HUD Frame */}
                            <div className="absolute inset-0 z-20 pointer-events-none">
                                {/* Corner Accents */}
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-indigo-500/50 m-6" />
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-indigo-500/50 m-6" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-indigo-500/50 m-6" />
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-indigo-500/50 m-6" />

                                {/* Center Crosshair Optional */}
                                {isScanning && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
                                        <Crosshair className="w-16 h-16 text-indigo-400" />
                                    </div>
                                )}
                            </div>

                            {/* Status Overlay */}
                            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                                <span className={`w-2 h-2 rounded-full shadow-lg ${isScanning ? 'bg-green-500 shadow-green-500/50 animate-pulse' : 'bg-red-500 shadow-red-500/50'}`} />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-white/80">
                                    {isScanning ? 'LIVE OPTICAL FEED' : 'OPTIC SENSOR OFFLINE'}
                                </span>
                            </div>

                            {/* Video and Canvas Stack */}
                            <video
                                ref={videoRef}
                                playsInline
                                muted
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isScanning ? 'opacity-100' : 'opacity-0'}`}
                            />
                            <canvas
                                ref={canvasRef}
                                className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
                            />

                            {/* Offline Placeholder */}
                            {!isScanning && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gradient-to-br from-indigo-950/20 to-black/80">
                                    <Camera className="w-16 h-16 text-white/10 mb-6" />
                                    <p className="text-white/40 text-sm font-semibold uppercase tracking-widest">Scanner Down</p>
                                </div>
                            )}
                        </div>

                        {/* System Log Strip below video */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 px-2">
                            <div className="flex gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-semibold text-white/40 tracking-wider">Engine Status</span>
                                    <span className="text-xs font-bold text-indigo-400">MobileNet v2 Active</span>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-semibold text-white/40 tracking-wider">Latency</span>
                                    <span className="text-xs font-bold text-emerald-400">14ms</span>
                                </div>
                            </div>
                            <div className="text-[10px] text-indigo-400/80 font-mono tracking-wider flex items-center gap-4 overflow-hidden h-4">
                                <span className="flex-shrink-0">SYSLOG:</span>
                                <div className="flex gap-4 animate-in slide-in-from-right-full repeat-infinite duration-[10000ms]">
                                    {sysLogs.map((log, i) => (
                                        <span key={i} className="whitespace-nowrap">{log} //</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Telemetry Sidebar */}
                    <div className="flex flex-col gap-6">

                        {/* Threat Level Panel */}
                        <div className="glass-card p-6 h-auto flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                            <h3 className="text-[11px] uppercase tracking-widest text-white/50 mb-4 font-bold">Current Threat Assessment</h3>
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${threatLevel === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.3)]' :
                                        threatLevel === 'Elevated' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                            'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                                    }`}>
                                    {threatLevel === 'Critical' ? <AlertTriangle className="w-6 h-6" /> :
                                        threatLevel === 'Elevated' ? <MapPin className="w-6 h-6" /> :
                                            <ShieldCheck className="w-6 h-6" />}
                                </div>
                                <div>
                                    <div className="text-2xl font-bold tracking-wide" style={{ color: 'var(--fg)' }}>{isScanning ? threatLevel.toUpperCase() : 'UNKNOWN'}</div>
                                    <div className="text-xs text-white/40 font-semibold">{isScanning ? 'Analyzing Scene Dynamics' : 'Waiting for telemetry...'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Detections Panel */}
                        <div className="glass-card p-6 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[11px] uppercase tracking-widest text-white/50 font-bold">Identified Vectors</h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-white/60">{detections.length} TARGETS</span>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                                {!isScanning ? (
                                    <div className="h-full flex items-center justify-center text-xs text-white/30 text-center px-4">
                                        System disarmed. Activate scanner to populate telemetry.
                                    </div>
                                ) : detections.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-xs text-white/30 text-center px-4">
                                        No measurable vectors detected in visual field.
                                    </div>
                                ) : (
                                    detections.map((det, i) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            key={i + det.class}
                                            className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                                                <span className="text-sm font-semibold capitalize text-white/90">{det.class}</span>
                                            </div>
                                            <span className="text-xs font-mono font-semibold text-white/50">
                                                {(det.score * 100).toFixed(1)}%
                                            </span>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
      `}</style>
        </main>
    );
}
