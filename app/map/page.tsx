'use client';

import { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    Shield,
    PhoneCall,
    AlertTriangle,
    Building2,
    ArrowLeft,
    Search,
    User as UserIcon,
    Navigation,
    Mic,
    Cpu,
    Zap,
    Radio,
    CircleDot,
    Wifi
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useAlarm } from '@/hooks/useAlarm';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { ParticleCanvas } from '@/components/ParticleCanvas';
import { TiltCard } from '@/components/TiltCard';

interface ReceivedSignal {
    _id: string;
    userId: {
        _id: string;
        name: string;
        phone: string;
        profileImage?: string;
    };
    location: {
        lat: number;
        lng: number;
        address: string;
    };
    startedAt: string;
    batteryLevel?: number;
}

export default function MapPage() {
    const [activeCategory, setActiveCategory] = useState<'police' | 'hospital' | 'helpline'>('police');
    const [isScanning, setIsScanning] = useState(true);
    const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [receivedSignals, setReceivedSignals] = useState<ReceivedSignal[]>([]);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
    const [isSOSActive, setIsSOSActive] = useState(false);
    const [activeSOSId, setActiveSOSId] = useState<string | null>(null);
    const { startAlarm, stopAlarm } = useAlarm();
    const { startRecording, stopRecording, isRecording } = useAudioRecorder();

    const mapInstance = useRef<any>(null);
    const markers = useRef<{ user?: any; signals: any[] }>({ signals: [] });

    // ─── Map Initialization ───────────────────────────────────────────────
    useEffect(() => {
        if (!coords || mapInstance.current) return;

        const initMap = async () => {
            if (typeof window === 'undefined') return;

            if (!document.getElementById('leaflet-css')) {
                const link = document.createElement('link');
                link.id = 'leaflet-css';
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(link);
            }

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.async = true;
            script.onload = () => {
                const L = (window as any).L;
                if (!L) return;

                const map = L.map('main-map', {
                    zoomControl: false,
                    attributionControl: false
                }).setView([coords.lat, coords.lng], 15);

                // Use Dark Matter tiles for a more tactical look
                L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    maxZoom: 20
                }).addTo(map);

                L.control.zoom({ position: 'bottomright' }).addTo(map);

                const userIcon = L.divIcon({
                    className: 'user-marker',
                    html: `
                        <div class="relative">
                            <div class="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center border border-primary/40 shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]">
                                <div class="w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_white]"></div>
                            </div>
                            <div class="absolute inset-0 -m-4 border-2 border-primary/20 rounded-full animate-ping"></div>
                        </div>
                    `,
                    iconSize: [32, 32]
                });
                markers.current.user = L.marker([coords.lat, coords.lng], { icon: userIcon }).addTo(map);

                mapInstance.current = map;
                (window as any).mainMap = map;

                const resizeObserver = new ResizeObserver(() => {
                    map.invalidateSize();
                });
                if (document.getElementById('main-map')) {
                    resizeObserver.observe(document.getElementById('main-map')!);
                }
            };
            document.head.appendChild(script);
        };

        const timer = setTimeout(initMap, 100);
        return () => clearTimeout(timer);
    }, [coords]);

    // ─── Render Signal Markers ───────────────────────────────────────────
    useEffect(() => {
        const L = (window as any).L;
        const map = mapInstance.current;
        if (!L || !map) return;

        markers.current.signals.forEach(m => map.removeLayer(m));
        markers.current.signals = [];

        receivedSignals.forEach(signal => {
            const emergencyIcon = L.divIcon({
                className: 'emergency-marker',
                html: `
                    <div class="relative">
                        <div class="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.6)]">
                            <div class="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_white]"></div>
                        </div>
                        <div class="absolute inset-0 -m-6 border-2 border-red-500/30 rounded-full animate-ping" style="animation-duration: 1.5s"></div>
                        <div class="absolute inset-0 -m-10 border border-red-500/10 rounded-full animate-ping" style="animation-duration: 3s"></div>
                    </div>
                `,
                iconSize: [40, 40]
            });

            const marker = L.marker([signal.location.lat, signal.location.lng], { icon: emergencyIcon })
                .addTo(map)
                .bindPopup(`
                    <div class="glass-card p-4 min-w-[200px] border-red-500/20">
                        <div class="flex items-center gap-2 mb-3">
                            <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span class="text-[9px] font-black text-red-500 uppercase tracking-[0.2em]">CRITICAL SOS</span>
                        </div>
                        <p class="text-sm font-black text-white mb-1">${signal.userId?.name}</p>
                        <p class="text-[10px] text-white/40 leading-relaxed mb-4">${signal.location.address}</p>
                        <a href="tel:${signal.userId?.phone}" class="flex items-center justify-center gap-2 w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20">
                            <PhoneCall className="w-3.5 h-3.5" /> INTERCEPT & RESPOND
                        </a>
                    </div>
                `, { className: 'custom-popup' });
            markers.current.signals.push(marker);
        });
    }, [receivedSignals]);

    useEffect(() => {
        if (isSOSActive) {
            startRecording();
        } else {
            stopRecording();
        }
    }, [isSOSActive, startRecording, stopRecording]);

    useEffect(() => {
        if ('getBattery' in (navigator as any)) {
            (navigator as any).getBattery().then((battery: any) => {
                setBatteryLevel(Math.round(battery.level * 100));
                battery.addEventListener('levelchange', () => {
                    setBatteryLevel(Math.round(battery.level * 100));
                });
            });
        }

        const timer = setTimeout(() => setIsScanning(false), 3000);

        fetch('/api/sos')
            .then(res => res.json())
            .then(data => {
                if (data?._id) {
                    setIsSOSActive(true);
                    setActiveSOSId(data._id);
                    startAlarm();
                }
            });

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(pos => {
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            });
        }

        const fetchSignals = async () => {
            try {
                const res = await fetch('/api/sos/received');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        if (data.length > receivedSignals.length) {
                            toast.error('NEW EMERGENCY SIGNAL RECEIVED!', {
                                duration: 5000,
                                icon: '🚨',
                            });
                        }
                        setReceivedSignals(data);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch signals', error);
            }
        };

        fetchSignals();
        const signalInterval = setInterval(fetchSignals, 10000);

        return () => {
            clearTimeout(timer);
            clearInterval(signalInterval);
        };
    }, [receivedSignals.length]);

    const handleBroadcast = async () => {
        if (isSOSActive) {
            stopAlarm();
            setIsSOSActive(false);

            if (!activeSOSId) {
                toast.success('SOS DEACTIVATED');
                return;
            }

            try {
                const res = await fetch('/api/sos', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: activeSOSId }),
                });
                setActiveSOSId(null);
                toast.success(res.ok ? 'PROTOCOL TERMINATED' : 'PROTOCOL TERMINATED (Local)');
            } catch (error) {
                setActiveSOSId(null);
                toast.success('PROTOCOL TERMINATED (Offline)');
            }
            return;
        }

        setIsBroadcasting(true);
        startAlarm();
        setIsSOSActive(true);

        try {
            const res = await fetch('/api/sos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location: coords || { lat: 0, lng: 0, address: 'Live Coordinates' },
                    triggerType: 'Manual',
                    batteryLevel: batteryLevel,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setActiveSOSId(data._id);
                toast.success('SIGNAL BROADCASTED TO GUARDIANS', {
                    duration: 4000,
                    icon: '📡',
                });
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to broadcast signal');
                setIsSOSActive(false);
                stopAlarm();
            }
        } catch (error) {
            toast.error('Connection Error');
            setIsSOSActive(false);
            stopAlarm();
        } finally {
            setIsBroadcasting(false);
        }
    };

    const mockData = {
        police: [
            { name: 'Tactical HQ Sector 7', dist: '0.8 km', status: 'ACTIVE', phone: '100' },
            { name: 'Patrol Unit Alpha-9', dist: '1.2 km', status: 'ON MISSION', phone: '101' },
            { name: 'Regional Defense Hub', dist: '2.5 km', status: 'STANDBY', phone: '112' },
        ],
        hospital: [
            { name: 'Bio-Medical Emergency Care', dist: '0.5 km', status: 'URGENT', phone: '102' },
            { name: 'Central Trauma Center', dist: '1.4 km', status: 'ACTIVE', phone: '911' },
        ],
        helpline: [
            { name: 'Crisis Mitigation Link', dist: 'N/A', status: 'AVAILABLE', phone: '181' },
            { name: 'Tactical Advice Channel', dist: 'N/A', status: 'AVAILABLE', phone: '1091' },
            { name: 'Legal Protocol Cell', dist: 'N/A', status: 'ACTIVE', phone: '15100' },
        ]
    };

    return (
        <main className="relative min-h-screen pt-24 md:pt-32 pb-20 px-4 md:px-6 overflow-hidden">
            <ParticleCanvas />
            <Navbar pollingFrequency={5000} />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
                    <Link href="/" className="flex items-center gap-3 text-foreground/60 hover:text-primary transition-all font-bold uppercase tracking-widest text-[10px]">
                        <ArrowLeft className="w-4 h-4" /> Operations Hub
                    </Link>
                    {coords && (
                        <div className="px-6 py-2.5 bg-primary/10 border border-primary/20 rounded-full flex items-center gap-3 backdrop-blur-xl">
                            <Radio className="w-4 h-4 text-primary animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                                {coords.lat.toFixed(6)}° N, {coords.lng.toFixed(6)}° E
                            </span>
                        </div>
                    )}
                </div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-12"
                >
                    <Link href="/safe-route">
                        <div className="relative overflow-hidden p-8 md:p-12 bg-primary/95 rounded-[3rem] flex flex-col md:flex-row items-center justify-between cursor-pointer group shadow-[0_30px_60px_rgba(var(--primary-rgb),0.3)] border border-white/20">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
                            <div className="absolute inset-0 opacity-10 pointer-events-none">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                            </div>

                            <div className="relative flex items-center gap-8 mb-8 md:mb-0">
                                <div className="p-5 bg-white/10 backdrop-blur-2xl rounded-[2rem] border border-white/20 shadow-2xl group-hover:scale-110 transition-transform">
                                    <Shield className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-3xl tracking-tight mb-2 flex items-center gap-4">
                                        Tactical Navigator
                                        <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] uppercase font-black tracking-widest border border-white/10">AI-Core v4.0</div>
                                    </h3>
                                    <p className="text-white/60 text-[11px] font-bold uppercase tracking-[0.3em]">Sector Analysis · Kinetic Risk Evaluation · High-Fidelity Routing</p>
                                </div>
                            </div>

                            <div className="relative flex items-center gap-4 px-10 py-5 bg-white text-primary rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl group-hover:shadow-[0_0_30px_white] hover:scale-105 transition-all">
                                <Navigation className="w-5 h-5" />
                                Execute Pathing
                            </div>
                        </div>
                    </Link>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Main Tactical Map */}
                    <div className="lg:col-span-8 order-2 lg:order-1 space-y-8">
                        <div className="h-[400px] lg:h-[750px] glass-card p-2 relative overflow-hidden shadow-2xl border-white/10">
                            <div className="absolute top-6 left-6 right-6 z-[1001] flex flex-col gap-4">
                                <div className="flex gap-2 sm:gap-4 p-2 bg-background/80 backdrop-blur-3xl rounded-[2rem] border border-white/10 shadow-2xl w-full md:w-2/3">
                                    <div className="p-3 sm:p-4 bg-primary/10 rounded-2xl text-primary flex-shrink-0">
                                        <Search className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Scan sector for safe nodes..."
                                        className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-foreground placeholder:text-foreground/20"
                                        onKeyDown={async (e) => {
                                            if (e.key === 'Enter') {
                                                const val = (e.target as HTMLInputElement).value;
                                                if (!val.trim()) return;
                                                try {
                                                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=1`);
                                                    const data = await res.json();
                                                    if (data.length > 0) {
                                                        const L = (window as any).L;
                                                        const map = (window as any).mainMap;
                                                        if (map && L) {
                                                            const target = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                                                            map.flyTo(target, 16);
                                                        }
                                                    }
                                                } catch (err) { }
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => coords && (window as any).mainMap?.flyTo([coords.lat, coords.lng], 16)}
                                        className="p-4 bg-primary rounded-2xl text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                    >
                                        <CircleDot className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div id="main-map" className="w-full h-full rounded-[2.5rem] z-0 grayscale-[0.5] invert-[0.05]" />

                            <div className="absolute bottom-10 left-10 right-10 z-[1001]">
                                <div className="bg-background/90 backdrop-blur-3xl p-6 md:p-8 flex items-center justify-between rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center border border-emerald-500/20">
                                            <Shield className="w-8 h-8 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-foreground/40 uppercase font-black tracking-widest mb-1.5">Defense Status</p>
                                            <p className="text-xl font-bold text-foreground tracking-tight flex items-center gap-3">
                                                Tactical Shield Active
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            </p>
                                        </div>
                                    </div>
                                    <Link href="/safe-route" className="btn-liquid px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-primary/20">
                                        Execute Scan
                                    </Link>
                                </div>
                            </div>

                            {!coords && (
                                <div className="absolute inset-0 bg-background/60 backdrop-blur-2xl z-[2000] flex flex-col items-center justify-center gap-6">
                                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40">Synchronizing Global Grid...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Components */}
                    <div className="lg:col-span-4 order-1 lg:order-2 space-y-10">
                        {receivedSignals.length > 0 && (
                            <TiltCard className="p-8 border-red-500/20 bg-red-500/5 relative overflow-hidden transition-all duration-500">
                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                    <AlertTriangle className="w-16 h-16 text-red-500" />
                                </div>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                                        <Radio className="w-6 h-6 text-red-500 animate-pulse" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-foreground tracking-tight">SOS INBOUND</h2>
                                        <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mt-1">Live Intercept Feed</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {receivedSignals.map((signal) => (
                                        <div key={signal._id} className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between group hover:bg-red-500/10 hover:border-red-500/20 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-500 font-black text-xl border border-red-500/30">
                                                    {signal.userId?.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground text-lg">{signal.userId?.name}</p>
                                                    <p className="text-[10px] text-foreground/40 font-black uppercase tracking-widest">Digital Witness Connected</p>
                                                </div>
                                            </div>
                                            <a href={`tel:${signal.userId?.phone}`} className="p-5 bg-red-500 rounded-2xl text-white hover:scale-110 active:scale-90 transition-all shadow-xl shadow-red-500/20">
                                                <PhoneCall className="w-6 h-6" />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </TiltCard>
                        )}

                        <div className="relative p-2 gap-2 rounded-[3.5rem] flex border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-[50px] bg-background/40 isolation-auto">
                            <div className="absolute inset-0 bg-gradient-to-b from-white-5 to-transparent rounded-[3.5rem] pointer-events-none" />
                            {(['police', 'hospital', 'helpline'] as const).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`flex-1 py-5 text-[11px] font-black uppercase tracking-[0.3em] rounded-[3rem] transition-all duration-500 relative overflow-hidden group ${activeCategory === cat ? 'text-white shadow-[0_10px_30px_rgba(var(--primary-rgb),0.5)]' : 'text-foreground/40 hover:bg-white/5 hover:text-foreground'}`}
                                >
                                    {activeCategory === cat && (
                                        <motion.div
                                            layoutId="activeCategoryMap"
                                            className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary rounded-[3rem] z-0 border border-white/20"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        >
                                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                                        </motion.div>
                                    )}
                                    <span className="relative z-10">{cat === 'police' ? 'Tactical' : cat === 'hospital' ? 'Triage' : 'Comms'}</span>
                                </button>
                            ))}
                        </div>

                        <div className="space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar pr-4">
                            {mockData[activeCategory].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="glass-card p-8 border-white/5 group hover:bg-primary/5 hover:border-primary/20 transition-all cursor-pointer relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-150 transition-transform">
                                        <Zap className="w-12 h-12" />
                                    </div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="font-bold text-foreground text-xl leading-none mb-3 group-hover:text-primary transition-colors">{item.name}</h3>
                                            <div className="flex items-center gap-3 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">
                                                <div className={`w-2 h-2 rounded-full ${item.status === 'ACTIVE' || item.status === 'ON MISSION' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                                                <span>{item.status}</span>
                                            </div>
                                        </div>
                                        <div className="px-4 py-1.5 bg-primary/10 rounded-full text-[10px] font-black text-primary uppercase tracking-widest border border-primary/20">
                                            {item.dist}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-6 border-t border-white/5 leading-none">
                                        <p className="text-[11px] font-black font-mono text-foreground/30 tracking-[0.2em]">{item.phone}</p>
                                        <a
                                            href={`tel:${item.phone}`}
                                            className="flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl"
                                        >
                                            <PhoneCall className="w-4 h-4" /> Initialize
                                        </a>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <TiltCard className="p-10 relative overflow-hidden group shadow-[0_30px_80px_-20px_rgba(var(--primary-rgb),0.5)] border border-primary/20 bg-background/80 backdrop-blur-3xl rounded-[3rem]">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent z-0" />
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none z-0 mix-blend-overlay" />

                            <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/30 rounded-full blur-[100px] pointer-events-none z-0 transition-opacity group-hover:opacity-70 opacity-30"></div>
                            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none z-0 transition-opacity group-hover:opacity-50 opacity-20"></div>

                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform pointer-events-none z-10 duration-700">
                                <Cpu className="w-32 h-32 text-primary" />
                            </div>

                            <div className="relative z-20">
                                <div className="flex items-center justify-between mb-8">
                                    <h4 className="flex items-center gap-4 text-foreground font-black text-2xl uppercase tracking-[0.3em] leading-none">
                                        <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 custom-shadow">
                                            <Radio className="w-8 h-8 text-primary animate-pulse" />
                                        </div>
                                        <span>Broadcast <span className="text-primary">Hub</span></span>
                                    </h4>
                                    <div className="px-4 py-2 rounded-full border border-primary/20 text-[10px] font-black tracking-widest uppercase text-primary bg-primary/5">
                                        v4.Core
                                    </div>
                                </div>

                                <p className="text-sm font-bold text-foreground/50 mb-10 leading-relaxed uppercase tracking-widest max-w-sm">
                                    Transmit encrypted bio-telemetry to all regional Guardians for deep-link monitoring.
                                </p>

                                <button
                                    onClick={handleBroadcast}
                                    disabled={isBroadcasting}
                                    className={`w-full py-8 rounded-[2.5rem] text-[13px] font-black uppercase tracking-[0.4em] shadow-2xl transition-all duration-500 relative overflow-hidden group/btn active:scale-[0.98] ${isSOSActive
                                        ? 'bg-red-500/10 text-red-500 shadow-[0_0_50px_rgba(239,68,68,0.2)] border border-red-500/30 hover:bg-red-500/20'
                                        : 'bg-gradient-to-r from-primary via-primary to-primary text-white shadow-[0_20px_50px_rgba(var(--primary-rgb),0.4)] border border-white/20 hover:shadow-[0_20px_60px_rgba(var(--primary-rgb),0.6)]'
                                        } ${isBroadcasting ? 'opacity-50' : 'hover:-translate-y-2'}`}
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-out" />

                                    <span className="relative z-10 flex items-center justify-center gap-4">
                                        {isBroadcasting ? 'PROCESSING PACKETS...' : isSOSActive ? 'TERMINATE PROTOCOL' : 'INITIALIZE BROADCAST'}
                                        {!isBroadcasting && !isSOSActive && <Wifi className="w-6 h-6 group-hover/btn:scale-125 transition-transform duration-500 drop-shadow-[0_0_10px_white]" />}
                                    </span>

                                    {isSOSActive && <div className="absolute inset-0 border-2 border-red-500 rounded-[2.5rem] animate-ping opacity-20 [animation-duration:2s]" />}
                                </button>
                            </div>
                        </TiltCard>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-popup .leaflet-popup-content-wrapper {
                    background: transparent !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                    margin: 0 !important;
                }
                .custom-popup .leaflet-popup-content {
                    margin: 0 !important;
                    width: auto !important;
                }
                .custom-popup .leaflet-popup-tip-container {
                    display: none !important;
                }
                .leaflet-container {
                    background: #000 !important;
                }
            `}</style>
        </main>
    );
}
