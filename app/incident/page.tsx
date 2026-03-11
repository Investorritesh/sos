'use client';

import { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    MapPin,
    Camera,
    Send,
    ArrowLeft,
    FileText,
    Shield,
    Clock,
    Mic,
    Zap,
    Cpu
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { ParticleCanvas } from '@/components/ParticleCanvas';
import { TiltCard } from '@/components/TiltCard';

export default function IncidentReport() {
    const [description, setDescription] = useState('');
    const [incidentType, setIncidentType] = useState('Other');
    const [severity, setSeverity] = useState('Medium');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { startRecording, stopRecording, isRecording } = useAudioRecorder();

    useEffect(() => {
        if (description.length > 5 && !isRecording) {
            startRecording();
        }
    }, [description, isRecording, startRecording]);

    useEffect(() => {
        return () => stopRecording();
    }, [stopRecording]);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(pos => {
                setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            });
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/incident', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description,
                    location,
                    mediaUrl: '',
                    incidentType,
                    severity,
                    isAnonymous,
                }),
            });

            if (res.ok) {
                toast.success('Evidence Logged Successfully');
                setDescription('');
            } else {
                toast.error('Failed to transmit report');
            }
        } catch (error) {
            toast.error('Connection Error');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = "w-full bg-primary/5 border border-white/10 rounded-2xl p-5 outline-none focus:bg-primary/10 focus:border-primary/40 transition-all font-bold text-foreground appearance-none backdrop-blur-md";

    return (
        <main className="relative min-h-screen pt-32 pb-20 px-6 overflow-hidden">
            <ParticleCanvas />
            <Navbar pollingFrequency={5000} />

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="flex items-center justify-between mb-12">
                    <Link href="/" className="flex items-center gap-3 text-foreground/60 hover:text-primary transition-all font-bold uppercase tracking-widest text-[10px]">
                        <ArrowLeft className="w-4 h-4" /> Hub Dashboard
                    </Link>
                    <div className={`px-6 py-2.5 bg-white/5 border rounded-full flex items-center gap-3 backdrop-blur-xl transition-all ${isRecording ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}>
                        {isRecording ? (
                            <Mic className="w-4 h-4 text-red-500 animate-pulse" />
                        ) : (
                            <Clock className="w-4 h-4 text-primary" />
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isRecording ? 'text-red-500' : 'text-foreground/60'}`}>
                            {isRecording ? 'Digital Witness Active' : 'Evidence Standby'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4 space-y-8">
                        <TiltCard className="p-10 bg-primary/90 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                <Shield className="w-24 h-24" />
                            </div>
                            <Cpu className="w-10 h-10 mb-8 opacity-50" />
                            <h2 className="text-4xl font-bold mb-4 tracking-tight leading-tight">Evidence Collection</h2>
                            <p className="text-sm font-medium text-white/70 leading-relaxed mb-10">
                                Transmit high-fidelity metadata for forensic logging. Your report is cryptographically sealed and timestamped.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white]" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Quantum-Shield Encryption</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white]" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Verified GPS Telemetry</span>
                                </div>
                            </div>
                        </TiltCard>

                        <TiltCard className="p-8 md:p-12 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-150 transition-transform">
                                <MapPin className="w-16 h-16 text-emerald-500" />
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                                    <MapPin className="w-8 h-8" />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 mb-1">LOCKED SECTOR</h4>
                                    <p className="text-xl font-black text-foreground tracking-tighter">
                                        {location ? `${location.lat.toFixed(6)}° N, ${location.lng.toFixed(6)}° E` : 'SYNCHRONIZING GRID...'}
                                    </p>
                                </div>
                            </div>
                        </TiltCard>
                    </div>

                    <div className="lg:col-span-8">
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                        >
                            <form onSubmit={handleSubmit} className="glass-card p-10 md:p-14 space-y-12 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                                    style={{ background: 'linear-gradient(90deg, transparent, rgba(var(--primary-rgb),0.5), transparent)' }} />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.3em] ml-2">INCIDENT CATEGORY</label>
                                        <div className="relative group">
                                            <select
                                                className={inputStyle}
                                                value={incidentType}
                                                onChange={(e) => setIncidentType(e.target.value)}
                                            >
                                                {['Harassment', 'Stalking', 'Physical Abuse', 'Theft', 'Medical Emergency', 'Other'].map(type => (
                                                    <option key={type} value={type} className="bg-slate-900 text-white font-bold">{type}</option>
                                                ))}
                                            </select>
                                            <Zap className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary group-hover:scale-110 transition-transform pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.3em] ml-2">URGENCY PROTOCOL</label>
                                        <div className="relative group">
                                            <select
                                                className={`${inputStyle} ${severity === 'Critical' ? 'text-red-500 !border-red-500/40 bg-red-500/5' : ''}`}
                                                value={severity}
                                                onChange={(e) => setSeverity(e.target.value)}
                                            >
                                                {['Low', 'Medium', 'High', 'Critical'].map(s => (
                                                    <option key={s} value={s} className="bg-slate-900 text-white font-bold">{s}</option>
                                                ))}
                                            </select>
                                            <AlertTriangle className={`absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none group-hover:scale-110 transition-transform ${severity === 'Critical' ? 'text-red-500' : 'text-primary'}`} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-primary" /> Narrative Intel
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setIsAnonymous(!isAnonymous)}
                                            className={`text-[9px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full transition-all border ${isAnonymous
                                                ? 'bg-primary border-primary text-white shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]'
                                                : 'bg-white/5 border-white/10 text-foreground/40 hover:text-foreground'
                                                }`}
                                        >
                                            {isAnonymous ? 'IDENTITY MASKED' : 'PUBLIC PROFILE'}
                                        </button>
                                    </div>
                                    <textarea
                                        className={`${inputStyle} h-48 py-8 resize-none leading-relaxed placeholder:text-foreground/20`}
                                        placeholder="Provide surgical precision on incident details (physical traits, vehicle IDs, tactical direction)..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-4">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                        accept="image/*,video/*"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`flex-1 flex items-center justify-center gap-4 p-6 border rounded-3xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all group backdrop-blur-md ${selectedFile
                                            ? 'bg-primary/20 border-primary/40 text-primary'
                                            : 'bg-white/5 border-white/10 text-foreground/60 hover:bg-white/10 hover:border-primary/40 hover:text-primary'
                                            }`}
                                    >
                                        <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        {selectedFile ? 'Change Media Evidence' : 'Attach Media Evidence'}
                                    </button>
                                    {selectedFile && (
                                        <div className="flex items-center justify-between px-6 py-3 bg-primary/5 border border-primary/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                            <span className="text-[10px] font-bold text-primary/80 truncate max-w-[200px]">
                                                {selectedFile.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedFile(null)}
                                                className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !description}
                                    className={`btn-liquid w-full py-8 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[12px] text-white shadow-2xl transition-all flex items-center justify-center gap-5 active:scale-[0.98] ${severity === 'Critical'
                                        ? '!bg-gradient-to-r !from-red-600 !to-red-500 !shadow-red-500/40'
                                        : 'shadow-primary/30'
                                        }`}
                                >
                                    {loading ? 'TRANSMITTING ENCRYPTED PACKETS...' : 'LOG SECURE EVIDENCE'}
                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Send className="w-5 h-5" />
                                    </div>
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </div>
        </main>
    );
}
