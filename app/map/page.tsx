'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    Shield,
    PhoneCall,
    AlertCircle,
    Building2,
    ArrowLeft,
    Search,
    User as UserIcon,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useAlarm } from '@/hooks/useAlarm';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { Mic } from 'lucide-react';

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

    useEffect(() => {
        if (isSOSActive) {
            startRecording();
        } else {
            stopRecording();
        }
    }, [isSOSActive, startRecording, stopRecording]);

    useEffect(() => {
        // Battery Status API
        if ('getBattery' in (navigator as any)) {
            (navigator as any).getBattery().then((battery: any) => {
                setBatteryLevel(Math.round(battery.level * 100));
                battery.addEventListener('levelchange', () => {
                    setBatteryLevel(Math.round(battery.level * 100));
                });
            });
        }

        const timer = setTimeout(() => setIsScanning(false), 3000);

        // Fetch own SOS status
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

        // Fetch received signals
        const fetchSignals = async () => {
            try {
                const res = await fetch('/api/sos/received');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        // If new signals found that weren't there before, notify
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
        const signalInterval = setInterval(fetchSignals, 10000); // Poll every 10s

        return () => {
            clearTimeout(timer);
            clearInterval(signalInterval);
        };
    }, [receivedSignals.length]);

    const handleBroadcast = async () => {
        if (isSOSActive) {
            // Deactivate — stop immediately with 10s suppression
            stopAlarm(10000);
            setIsSOSActive(false);

            // If no server ID exists, just deactivate locally
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
                // Regardless of server response, we're already deactivated locally
                setActiveSOSId(null);
                toast.success(res.ok ? 'SOS DEACTIVATED' : 'SOS DEACTIVATED (Local)');
            } catch (error) {
                setActiveSOSId(null);
                toast.success('SOS DEACTIVATED (Offline)');
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
            { name: 'City Police Headquarters', dist: '0.8 km', status: 'Active', phone: '100' },
            { name: 'Suburban Patrol Station', dist: '1.2 km', status: 'Active', phone: '101' },
            { name: 'Central Security Hub', dist: '2.5 km', status: 'Open 24h', phone: '112' },
        ],
        hospital: [
            { name: 'City Emergency Care', dist: '0.5 km', status: 'Active', phone: '102' },
            { name: 'Metropolitan Hospital', dist: '1.4 km', status: 'Active', phone: '911' },
        ],
        helpline: [
            { name: 'National Women Helpline', dist: 'N/A', status: 'Available', phone: '181' },
            { name: 'Domestic Abuse Support', dist: 'N/A', status: 'Available', phone: '1091' },
            { name: 'Legal Aid Cell', dist: 'N/A', status: 'Active', phone: '15100' },
        ]
    };

    return (
        <main className="pt-24 pb-12 px-6 bg-slate-50/50 min-h-screen">
            <Navbar pollingFrequency={5000} />
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-bold uppercase tracking-tighter text-sm">
                        <ArrowLeft className="w-4 h-4" /> Safety Hub
                    </Link>
                    {coords && (
                        <div className="flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-black font-mono text-slate-900 tracking-tight">
                                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Map Simulation */}
                    <div className="flex-1 min-h-[550px] bg-white rounded-[2.5rem] relative overflow-hidden shadow-2xl shadow-indigo-100/50 border border-slate-100 group">
                        <div className="absolute inset-0 bg-[#f8fafc]">
                            {/* Premium Grid Pattern */}
                            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-60" />

                            <div className="relative w-full h-full">
                                {/* Indigo Radar Effect - Scaled for mobile */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <div className="w-[300px] h-[300px] md:w-[450px] md:h-[450px] bg-indigo-50/50 rounded-full animate-ping opacity-30" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] md:w-[350px] md:h-[350px] border border-indigo-100 rounded-full" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150px] h-[150px] md:w-[200px] md:h-[200px] border border-indigo-200/50 rounded-full" />
                                </div>

                                {/* Current User Marker */}
                                <motion.div
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 3 }}
                                >
                                    <div className="p-4 bg-primary rounded-full shadow-2xl shadow-indigo-400 ring-8 ring-indigo-50">
                                        <Shield className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-white px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border border-slate-100 shadow-xl text-primary whitespace-nowrap">
                                        MY LOCATION
                                    </div>
                                </motion.div>

                                {/* Received Signal Markers */}
                                <AnimatePresence>
                                    {receivedSignals.map((signal, idx) => (
                                        <motion.div
                                            key={signal._id}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="absolute z-30"
                                            style={{
                                                top: `${30 + (idx * 15)}%`,
                                                left: `${20 + (idx * 25)}%`,
                                            }}
                                        >
                                            <div className="relative group/marker">
                                                <div className="p-3 bg-red-500 rounded-full shadow-2xl shadow-red-200 animate-bounce cursor-pointer ring-4 ring-red-100">
                                                    <AlertCircle className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white p-3 rounded-2xl shadow-2xl border border-red-100 min-w-[200px] hidden group-hover/marker:block z-50">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                                                            <UserIcon className="w-5 h-5 text-red-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900">{signal.userId?.name}</p>
                                                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Active SOS</p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1 py-2 border-t border-slate-50">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Started: {new Date(signal.startedAt).toLocaleTimeString()}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Energy: {signal.batteryLevel || '--'}%</p>
                                                    </div>
                                                    <a href={`tel:${signal.userId?.phone}`} className="w-full mt-2 flex items-center justify-center gap-2 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors">
                                                        <PhoneCall className="w-3 h-3" /> Call Emergency
                                                    </a>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {/* Points of Interest */}
                                <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-blue-500 rounded-full shadow-lg ring-4 ring-blue-50" />
                                <div className="absolute top-2/3 left-1/4 w-4 h-4 bg-emerald-500 rounded-full shadow-lg ring-4 ring-emerald-50" />
                                <div className="absolute top-1/3 left-2/3 w-4 h-4 bg-amber-500 rounded-full shadow-lg ring-4 ring-amber-50" />
                            </div>
                        </div>

                        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 w-[calc(100%-2rem)] md:w-auto">
                            <div className="bg-white/90 backdrop-blur-md px-4 md:px-5 py-2.5 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 shadow-lg">
                                <div className={`w-3 h-3 rounded-full ${isScanning ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                                <span className="text-[10px] font-black tracking-widest text-slate-900 uppercase">
                                    {isScanning ? 'Syncing...' : 'Encrypted Link Active'}
                                </span>
                                {isRecording && (
                                    <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-500 rounded-xl animate-pulse border border-red-100">
                                        <Mic className="w-3 h-3" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Digital Witness Live</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-8 z-10">
                            <div className="bg-white/95 backdrop-blur-xl p-4 md:p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-0 rounded-3xl border border-slate-100 shadow-2xl">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Current Sector</p>
                                    <p className="text-sm md:text-base font-black flex items-center gap-2 text-slate-900">
                                        <Shield className="w-5 h-5 text-emerald-500" /> SECURE PERIMETER
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 md:gap-4">
                                    {receivedSignals.length > 0 && (
                                        <div className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-red-100 animate-pulse text-center">
                                            {receivedSignals.length} Active Signal(s)
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setIsScanning(true)}
                                        className="flex-1 md:flex-none bg-slate-900 text-white px-5 md:px-6 py-2.5 md:py-3 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                                    >
                                        Scan Area
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Infrastructure Sidebar */}
                    <div className="w-full lg:w-[450px] space-y-6">
                        {receivedSignals.length > 0 && (
                            <div className="bg-white border-2 border-red-500/20 rounded-[2.5rem] p-6 shadow-2xl shadow-red-100/50">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-red-100 rounded-2xl">
                                        <AlertCircle className="w-6 h-6 text-red-600 animate-pulse" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 leading-none">SOS SIGNALS</h2>
                                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em] mt-1">Live Broadcasts</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {receivedSignals.map((signal) => (
                                        <div key={signal._id} className="p-5 bg-red-50 rounded-3xl border border-red-100 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-500 font-black text-lg">
                                                    {signal.userId?.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900">{signal.userId?.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Signal</p>
                                                </div>
                                            </div>
                                            <a href={`tel:${signal.userId?.phone}`} className="p-4 bg-white rounded-2xl text-red-500 hover:scale-110 active:scale-90 transition-all shadow-sm">
                                                <PhoneCall className="w-5 h-5" />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="p-1.5 bg-white rounded-[2rem] flex gap-1 border border-slate-100 shadow-lg shadow-indigo-50/50">
                            {(['police', 'hospital', 'helpline'] as const).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all duration-300 ${activeCategory === cat ? 'bg-primary text-white shadow-xl shadow-indigo-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {cat === 'police' ? 'Patrols' : cat === 'hospital' ? 'Medical' : 'Priority Line'}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar pr-3">
                            {mockData[activeCategory].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-white p-6 rounded-3xl border border-slate-100 group hover:shadow-2xl hover:border-indigo-100 transition-all cursor-pointer shadow-sm"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-black text-slate-900 text-lg group-hover:text-primary transition-colors leading-none mb-2">{item.name}</h3>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <Building2 className="w-3.5 h-3.5 text-primary" />
                                                <span>{item.status}</span>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 bg-indigo-50 rounded-lg text-[9px] font-black text-primary uppercase tracking-widest">
                                            {item.dist}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                        <p className="text-sm font-mono font-bold text-slate-500 tracking-tighter">{item.phone}</p>
                                        <a
                                            href={`tel:${item.phone}`}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-200"
                                        >
                                            <PhoneCall className="w-4 h-4" /> Connect
                                        </a>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="p-8 bg-red-50 rounded-[2.5rem] border border-red-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-100/50 rounded-full -mr-16 -mt-16 blur-3xl" />
                            <h4 className="flex items-center gap-3 text-red-600 font-extrabold text-sm mb-4 uppercase tracking-widest">
                                <AlertCircle className="w-6 h-6 animate-pulse" /> Emergency Hub
                            </h4>
                            <p className="text-xs text-red-700/60 font-medium mb-6 leading-relaxed">
                                Share your encrypted live path with your Guardians for high-priority monitoring.
                            </p>
                            <button
                                onClick={handleBroadcast}
                                disabled={isBroadcasting}
                                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all border-b-4 active:border-b-0 active:translate-y-1 ${isSOSActive
                                    ? 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                                    : 'bg-red-600 text-white border-red-800 hover:bg-red-700 shadow-red-200'
                                    } ${isBroadcasting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isBroadcasting ? 'SYSTEM BUSY...' : isSOSActive ? 'DEACTIVATE SIGNAL' : 'BROADCAST SIGNAL'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
