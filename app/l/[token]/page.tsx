'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Lock, ShieldAlert, Cpu, Check, XCircle, MapPin, Zap, RefreshCw, AlertTriangle } from 'lucide-react';
import { ParticleCanvas } from '@/components/ParticleCanvas';

export default function SecureViewer({ params }: { params: { token: string } }) {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Poll for SOS updates (only if not burned)
    useEffect(() => {
        let interval: any;

        const fetchData = async () => {
            try {
                const res = await fetch(`/api/secure-link/${params.token}`);
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.message || 'Link Severed');
                }
                const json = await res.json();
                setData(json);
            } catch (err: any) {
                setError(err.message);
                if (interval) clearInterval(interval);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Re-poller every 10s as it could have active SOS live location
        // Note: the backend handles "ViewedAt" and burnAfterRead on First Request, subsequent requests will fail if burned.
        interval = setInterval(fetchData, 10000);

        return () => clearInterval(interval);
    }, [params.token]);

    if (loading) {
        return (
            <main className="relative min-h-screen bg-black flex items-center justify-center">
                <ParticleCanvas />
                <div className="z-10 flex flex-col items-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-16 h-16 border border-white/20 border-t-rose-500 rounded-full mb-6" />
                    <div className="text-white font-bold tracking-widest uppercase text-xs">Decrypting Signal...</div>
                </div>
            </main>
        )
    }

    if (error || !data) {
        return (
            <main className="relative min-h-screen bg-black flex items-center justify-center pt-10">
                <ParticleCanvas />
                <div className="z-10 max-w-lg w-full px-6">
                    <div className="glass-card p-12 flex flex-col items-center text-center rounded-3xl border border-rose-500/20 shadow-[0_0_40px_rgba(244,63,94,0.1)] relative overflow-hidden">
                        <div className="absolute inset-0 bg-red-500/5 mix-blend-overlay" />
                        <XCircle className="w-16 h-16 text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] mb-6" />
                        <h1 className="text-3xl font-bold text-white mb-2">Connection Severed</h1>
                        <p className="text-white/50 text-sm">
                            {error === 'Link Invalid or Destroyed' ? 'This quantum asset has self-destructed or does not exist.' : error}
                        </p>
                    </div>
                </div>
            </main>
        )
    }

    const sosActive = !!data.activeSos;

    return (
        <main className="relative min-h-screen pb-32 bg-black overflow-hidden font-sans">
            <ParticleCanvas />

            {/* Top Warning Strip if SOS Active */}
            <AnimatePresence>
                {sosActive && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="w-full bg-red-600/90 text-white py-3 px-6 text-center text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 relative z-30"
                    >
                        <ShieldAlert className="w-4 h-4 animate-pulse" /> LIVE EMERGENCY SIGNAL DETECTED
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10 max-w-4xl mx-auto px-6 pt-24">

                {/* Header Ribbon */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
                    <div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-full w-fit mb-3">
                            <Lock className="w-3 h-3" /> E2E Decrypted Target
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                            Telemetry <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-600">Established</span>
                        </h1>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Secure Tunnel ID</span>
                            <span className="text-xs font-mono text-white/80">{params.token.slice(0, 8)}...</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Broadcaster</span>
                            <span className="text-xs font-bold text-emerald-400">{data.sharedBy}</span>
                        </div>
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Map / Location Asset */}
                    <div className="glass-card rounded-3xl p-6 relative overflow-hidden flex flex-col shadow-2xl">
                        <h2 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-500" /> Geographic Coordinates
                        </h2>

                        <div className="flex-1 bg-black/50 border border-white/5 rounded-2xl flex flex-col items-center justify-center p-8 relative">
                            {sosActive && data.activeSos.location ? (
                                <>
                                    <div className="absolute inset-0 rounded-2xl border-2 border-red-500/30 animate-pulse pointer-events-none" />
                                    <AlertTriangle className="w-12 h-12 text-red-500 mb-4 animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                                    <div className="text-white font-mono text-sm">{data.activeSos.location.lat?.toFixed(5)}</div>
                                    <div className="text-white font-mono text-sm">{data.activeSos.location.lng?.toFixed(5)}</div>
                                    <div className="mt-4 text-[10px] text-red-400 font-bold uppercase tracking-widest">LIVE SOS PING</div>
                                </>
                            ) : data.location ? (
                                <>
                                    <MapPin className="w-12 h-12 text-emerald-500/50 mb-4 drop-shadow-md" />
                                    <div className="text-white/80 font-mono text-sm">{data.location.lat?.toFixed(5)}</div>
                                    <div className="text-white/80 font-mono text-sm">{data.location.lng?.toFixed(5)}</div>
                                    <div className="mt-4 text-[10px] text-emerald-400/50 font-bold uppercase tracking-widest">Captured at Request</div>
                                </>
                            ) : (
                                <div className="text-white/30 text-xs font-mono uppercase tracking-widest">No Coordinates Linked</div>
                            )}
                        </div>

                        <a
                            href={`https://www.google.com/maps?q=${sosActive && data.activeSos.location ? `${data.activeSos.location.lat},${data.activeSos.location.lng}` : data.location ? `${data.location.lat},${data.location.lng}` : ''}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-4 w-full py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-colors ${!data.location && !sosActive ? 'bg-white/5 text-white/20 cursor-not-allowed pointer-events-none' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border border-emerald-500/20'
                                }`}
                        >
                            Open Grid Map
                        </a>
                    </div>

                    {/* Status Telemetry */}
                    <div className="flex flex-col gap-6">

                        {/* SOS Block */}
                        <div className={`glass-card rounded-3xl p-6 border ${sosActive ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.15)]' : 'border-white/5'}`}>
                            <h2 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                                <ShieldAlert className={`w-4 h-4 ${sosActive ? 'text-red-500' : 'text-white/20'}`} /> Threat Sensor Protocol
                            </h2>

                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sosActive ? 'bg-red-500 text-white shadow-lg' : 'bg-white/5 text-white/20'}`}>
                                    {sosActive ? <AlertTriangle className="w-6 h-6 animate-pulse" /> : <Check className="w-6 h-6" />}
                                </div>
                                <div>
                                    <div className={`text-xl font-bold tracking-wide ${sosActive ? 'text-red-500' : 'text-white/60'}`}>
                                        {sosActive ? 'CRITICAL ALERT' : 'SECURE'}
                                    </div>
                                    <div className="text-[10px] text-white/40 font-mono mt-1">
                                        {sosActive ? `Trigger: ${data.activeSos.triggerType}` : 'No anomalies detected'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Device Status Block */}
                        <div className="glass-card rounded-3xl p-6 border border-white/5 flex-1 flex flex-col justify-between">
                            <h2 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-white/30" /> Node Telemetry
                            </h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/40 uppercase tracking-widest font-bold">Battery Res.</span>
                                    <span className={`text-xs font-mono font-bold ${sosActive && data.activeSos.batteryLevel < 20 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                        {sosActive ? `${data.activeSos.batteryLevel}%` : 'UNKNOWN'}
                                    </span>
                                </div>
                                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                    <div className={`h-full ${sosActive && data.activeSos.batteryLevel < 20 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: sosActive ? `${data.activeSos.batteryLevel}%` : '0%' }} />
                                </div>
                            </div>

                            <hr className="border-white/5 my-4" />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <RefreshCw className="w-3 h-3 text-white/30 animate-spin" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Link Heartbeat</span>
                                </div>
                                <span className="text-[10px] uppercase font-bold text-white/30">Stable</span>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </main>
    );
}
