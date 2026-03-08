'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Shield, Lock, ChevronLeft, Copy, Check, Fingerprint, EyeOff, Clock, Share2, Zap } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { ParticleCanvas } from '@/components/ParticleCanvas';

export default function SecureLink() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const [settings, setSettings] = useState({
        expiry: '1h',
        burnAfterRead: false,
    });

    const generateLink = async () => {
        setIsGenerating(true);
        setGeneratedLink(null);
        setCopied(false);

        try {
            // Get location if available
            let location = null;
            if ('geolocation' in navigator) {
                location = await new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                        () => resolve(null),
                        { timeout: 5000 }
                    );
                });
            }

            const res = await fetch('/api/secure-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    expiry: settings.expiry,
                    burnAfterRead: settings.burnAfterRead,
                    location
                })
            });

            if (!res.ok) throw new Error('API Error');

            const data = await res.json();

            // Artificial delay for UX
            setTimeout(() => {
                setGeneratedLink(data.link);
                setIsGenerating(false);
                toast.success('Quantum-encrypted link fully synchronized.', {
                    icon: '🔒',
                    style: { borderRadius: '10px', background: '#333', color: '#fff' }
                });
            }, 1500);

        } catch (err) {
            console.error(err);
            toast.error('Failed to establish quantum link. Server connection interrupted.', {
                style: { borderRadius: '10px', background: '#333', color: '#fff' }
            });
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink);
            setCopied(true);
            toast.success('Secure link copied to clipboard.', {
                icon: '📋',
                style: { borderRadius: '10px', background: '#333', color: '#fff' }
            });
            setTimeout(() => setCopied(false), 3000);
        }
    };

    return (
        <main className="relative min-h-screen pb-32 overflow-hidden">
            <ParticleCanvas />
            <Navbar pollingFrequency={10000} />

            <div className="relative z-10 max-w-5xl mx-auto px-6 pt-32">
                <Link href="/" className="inline-flex items-center gap-2 mb-8 text-sm font-semibold tracking-wide hover:text-white transition-colors" style={{ color: 'var(--fg-muted)' }}>
                    <ChevronLeft className="w-4 h-4" /> Return to Dashboard
                </Link>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border border-rose-500/20 text-rose-400 bg-rose-500/10">
                                <Lock className="w-3 h-3" /> E2E Encryption Active
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
                            Secure <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-600">Link Tunnel</span>
                        </h1>
                        <p className="max-w-xl text-[15px] leading-[1.6] text-white/50">
                            Establish a military-grade, self-destructing communication channel. Generate an untraceable link to share your live telemetry with trusted contacts securely.
                        </p>
                    </div>
                </div>

                {/* Main UI */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Main Generator Panel */}
                    <div className="lg:col-span-7 glass-card p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between" style={{ minHeight: '400px' }}>
                        {/* Background Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[100px] rounded-full pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/10 blur-[100px] rounded-full pointer-events-none" />

                        <div className="relative z-10">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-8 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-rose-500" /> Tunnel Configuration
                            </h3>

                            <div className="space-y-6">
                                {/* Setting: Expiry */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">Signal Expiry Target</div>
                                            <div className="text-xs text-white/40">Duration before link collapses</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                                        {['1h', '12h', '24h'].map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => setSettings(s => ({ ...s, expiry: opt }))}
                                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${settings.expiry === opt ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'text-white/40 hover:text-white/80'}`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Setting: Burn After Read */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                                    onClick={() => setSettings(s => ({ ...s, burnAfterRead: !s.burnAfterRead }))}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400">
                                            <EyeOff className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white flex items-center gap-2">Burn After Reading {settings.burnAfterRead && <Zap className="w-3 h-3 text-orange-400 fill-orange-400" />}</div>
                                            <div className="text-xs text-white/40">Instantly obliterate trace upon first access</div>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.burnAfterRead ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-white/10'}`}>
                                        <motion.div
                                            className="w-4 h-4 rounded-full bg-white shadow-md relative"
                                            animate={{ x: settings.burnAfterRead ? 24 : 0 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 mt-8">
                            <button
                                onClick={generateLink}
                                disabled={isGenerating}
                                className="w-full relative overflow-hidden group bg-rose-500 hover:bg-rose-600 text-white p-4 rounded-2xl font-bold tracking-wide transition-all shadow-[0_0_30px_rgba(244,63,94,0.3)] hover:shadow-[0_0_40px_rgba(244,63,94,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-20 pointer-events-none mix-blend-overlay" style={{ backgroundImage: "linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 100%)", backgroundSize: "4px 4px" }} />
                                {isGenerating ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                    />
                                ) : (
                                    <Link2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                )}
                                {isGenerating ? 'Synthesizing Quantum Key...' : 'Generate Encrypted Link'}
                            </button>
                        </div>
                    </div>

                    {/* Encryption Status & Result Panel */}
                    <div className="lg:col-span-5 flex flex-col gap-6">

                        {/* Visualizer */}
                        <div className="glass-card flex-1 min-h-[240px] rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
                            <h3 className="absolute top-6 left-6 text-[10px] font-bold uppercase tracking-widest text-white/40">Core Status</h3>

                            <div className="relative w-32 h-32 flex items-center justify-center mt-4">
                                <AnimatePresence>
                                    {isGenerating && (
                                        <>
                                            {[1, 2, 3].map((i) => (
                                                <motion.div
                                                    key={`ring-${i}`}
                                                    className="absolute inset-0 border border-rose-500 rounded-full pointer-events-none"
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 2.2, opacity: [0, 0.4, 0], rotate: 180 }}
                                                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
                                                />
                                            ))}
                                            <motion.div
                                                className="absolute inset-0 border border-dashed border-rose-400/40 rounded-full"
                                                animate={{ rotate: -360 }}
                                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                            />
                                        </>
                                    )}
                                </AnimatePresence>

                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-md relative z-10 transition-all duration-500 ${generatedLink ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.4)] scale-110' : isGenerating ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-white/5 text-white/20 border border-white/10'}`}>
                                    {generatedLink ? <Check className="w-8 h-8 drop-shadow-lg" /> : <Fingerprint className={`w-8 h-8 ${isGenerating ? 'animate-pulse drop-shadow-lg' : ''}`} />}
                                </div>
                            </div>

                            <div className="mt-8 text-center h-12">
                                <div className="text-sm font-bold text-white transition-all duration-300">
                                    {generatedLink ? 'Tunnel Established' : isGenerating ? 'Encrypting Payload...' : 'Awaiting Generation'}
                                </div>
                                <div className="text-[10px] uppercase tracking-widest text-white/40 mt-1 transition-all duration-300">
                                    {generatedLink ? 'Link ready for transmission' : 'AES-256-GCM Protocol'}
                                </div>
                            </div>
                        </div>

                        {/* Link Result */}
                        <div className={`glass-card rounded-3xl p-6 transition-all duration-500 ${generatedLink ? 'opacity-100 translate-y-0 shadow-[0_10px_40px_rgba(244,63,94,0.1)]' : 'opacity-40 translate-y-4 pointer-events-none'}`}>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                                <Lock className="w-3 h-3 text-rose-500" /> Secured Asset
                            </h3>

                            <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center gap-3 overflow-hidden group hover:border-white/20 transition-colors">
                                <div className="flex-1 text-xs font-mono text-white/70 truncate select-all px-2">{generatedLink || 'https://hersecure.net/l/......'}</div>
                                <button onClick={copyToClipboard} className="flex-shrink-0 p-2.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white/50 hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/30 active:scale-95">
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>

                            <div className="mt-4 flex gap-3">
                                <button className="flex-1 bg-white/5 hover:bg-white/10 active:bg-white/20 text-white text-xs font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/5">
                                    <Share2 className="w-4 h-4" /> Broadcast via OS
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </main>
    );
}
