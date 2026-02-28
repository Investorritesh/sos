'use client';

import { useState, useEffect, useRef } from 'react';
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
    Navigation,
    Mic,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useAlarm } from '@/hooks/useAlarm';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

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

                L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                    maxZoom: 20
                }).addTo(map);

                L.control.zoom({ position: 'bottomright' }).addTo(map);

                const userIcon = L.divIcon({
                    className: 'user-marker',
                    html: `<div style="background:#6366f1; width:24px; height:24px; border:4px solid white; border-radius:50%; box-shadow:0 0 15px rgba(99,102,241,0.5); position:relative;">
                             <div style="position:absolute; inset:-8px; border:2px solid #6366f1; border-radius:50%; animation:ping 2s infinite;"></div>
                           </div>`,
                    iconSize: [24, 24]
                });
                markers.current.user = L.marker([coords.lat, coords.lng], { icon: userIcon }).addTo(map);

                mapInstance.current = map;
                (window as any).mainMap = map;

                // Handle responsive container resizing
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
                html: `<div style="background:#ef4444; width:20px; height:20px; border:3px solid white; border-radius:50%; box-shadow:0 0 15px rgba(239,68,68,0.6); animation:bounce 1s infinite;"></div>`,
                iconSize: [20, 20]
            });

            const marker = L.marker([signal.location.lat, signal.location.lng], { icon: emergencyIcon })
                .addTo(map)
                .bindPopup(`
                    <div style="padding:10px; min-width:150px;">
                        <b style="color:#ef4444; text-transform:uppercase; font-size:10px;">🚨 SOS SIGNAL</b>
                        <p style="margin:5px 0; font-weight:900;">${signal.userId?.name}</p>
                        <p style="font-size:11px; color:#64748b;">${signal.location.address}</p>
                        <a href="tel:${signal.userId?.phone}" style="display:block; margin-top:10px; background:#ef4444; color:white; text-align:center; padding:8px; border-radius:10px; text-decoration:none; font-weight:bold; font-size:11px;">CALL EMERGENCY</a>
                    </div>
                `);
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
            stopAlarm(10000);
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

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                >
                    <Link href="/safe-route" className="block group">
                        <div className="relative overflow-hidden p-6 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between cursor-pointer shadow-2xl shadow-indigo-200/60 hover:shadow-indigo-300/80 transition-all border border-indigo-400/20">
                            <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:20px_20px]" />
                            <div className="relative flex items-center gap-5 mb-4 md:mb-0">
                                <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                                    <Shield className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-black text-xl tracking-tight leading-none mb-2">Safest Route Navigator</h3>
                                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.2em]">AI Powered · Crime Data · Street Lighting · User Reports</p>
                                </div>
                            </div>
                            <div className="relative flex items-center gap-3 px-8 py-3.5 bg-white text-indigo-700 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl group-hover:scale-105 transition-transform">
                                <Navigation className="w-4 h-4" />
                                Find Safest Path
                            </div>
                        </div>
                    </Link>
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Map View */}
                    <div className="h-[500px] lg:h-auto lg:flex-1 bg-white rounded-[2.5rem] relative overflow-hidden shadow-2xl shadow-indigo-100/50 border border-slate-100 group order-1 lg:order-1">
                        <div id="main-map" className="w-full h-full min-h-full z-0" style={{ background: '#f8fafc' }} />

                        <div className="absolute top-4 left-4 right-4 z-[1001]">
                            <div className="flex flex-col md:flex-row gap-2">
                                <div className="flex-1 flex gap-2 p-1.5 bg-white/95 backdrop-blur-2xl rounded-2xl border border-white shadow-2xl focus-within:ring-2 ring-indigo-500/20 transition-all">
                                    <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                                        <Search className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        id="map-global-search"
                                        placeholder="Search local safe spots, hospitals, or landmarks..."
                                        className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-slate-800 placeholder:text-slate-300"
                                        onKeyDown={async (e) => {
                                            if (e.key === 'Enter') {
                                                const val = (e.target as HTMLInputElement).value;
                                                if (!val.trim()) return;
                                                try {
                                                    const bias = 0.5;
                                                    const viewbox = coords ? `${coords.lng - bias},${coords.lat + bias},${coords.lng + bias},${coords.lat - bias}` : '';
                                                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=1&viewbox=${viewbox}`);
                                                    const data = await res.json();
                                                    if (data.length > 0) {
                                                        const L = (window as any).L;
                                                        const map = (window as any).mainMap;
                                                        if (map && L) {
                                                            const target = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                                                            map.flyTo(target, 16);
                                                            L.marker(target, {
                                                                icon: L.divIcon({
                                                                    html: `<div style="background:#6366f1; width:12px; height:12px; border:3px solid white; border-radius:50%; box-shadow:0 0 10px rgba(99,102,241,0.5);"></div>`
                                                                })
                                                            }).addTo(map).bindPopup(`<b>${data[0].display_name}</b>`).openPopup();
                                                        }
                                                    } else {
                                                        toast.error('Location not found in your area.');
                                                    }
                                                } catch (err) {
                                                    toast.error('Search failed.');
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => coords && (window as any).mainMap?.flyTo([coords.lat, coords.lng], 16)}
                                        className="p-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 group"
                                    >
                                        <MapPin className="w-4 h-4 group-hover:text-indigo-600" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4 z-[1001] md:bottom-8 md:left-8 md:right-8">
                            <div className="bg-white/95 backdrop-blur-xl p-3 md:p-6 flex items-center justify-between rounded-[2rem] md:rounded-3xl border border-white shadow-2xl">
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 rounded-xl md:rounded-2xl flex items-center justify-center">
                                        <Shield className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-[8px] md:text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Encrypted Data Active</p>
                                        <p className="text-xs md:text-base font-black text-slate-900 flex items-center gap-2">
                                            LIVE SECURE PERIMETER
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 md:gap-3">
                                    {receivedSignals.length > 0 && (
                                        <div className="px-3 py-1.5 md:px-4 md:py-2 bg-red-50 text-red-600 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-red-100 animate-pulse hidden sm:block">
                                            {receivedSignals.length} Active
                                        </div>
                                    )}
                                    <Link href="/safe-route" className="px-4 py-2.5 md:px-6 md:py-3 bg-indigo-600 text-white rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200">
                                        Navigator AI
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {!coords && (
                            <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-md z-[2000] flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Satellite Data...</span>
                            </div>
                        )}
                    </div>

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
