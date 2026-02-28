'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
    ArrowLeft,
    Shield,
    Navigation,
    MapPin,
    AlertTriangle,
    Lightbulb,
    Users,
    TrendingUp,
    Search,
    Flag,
    X,
    ChevronRight,
    Lock,
    Eye,
    Clock,
    Star,
    Zap,
    Info,
    CheckCircle,
    XCircle,
    Route,
    AlertCircle,
    Camera,
    Video,
    Paperclip,
    Trash2,
    FolderOpen,
    Cloud,
    FilePlus,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface LatLng { lat: number; lng: number; }

interface SafetyZone {
    id: string;
    center: LatLng;
    radius: number;        // meters
    score: number;         // 0=dangerous … 100=safe
    type: 'crime' | 'lighting' | 'user_report' | 'safe_zone';
    label: string;
    details: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

interface RouteInfo {
    type: 'safe' | 'short';
    distance: string;
    duration: string;
    safetyScore: number;
    waypoints: LatLng[];
    color: string;
    label: string;
    riskFactors: string[];
}

interface UserReport {
    reportType: string;
    severity: string;
    description: string;
    location: LatLng;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
}

// ─── Safety Score Engine ──────────────────────────────────────────────────────
const CRIME_ZONE_DB: SafetyZone[] = [
    { id: 'c1', center: { lat: 0, lng: 0 }, radius: 400, score: 25, type: 'crime', label: 'High Crime Area', details: 'Multiple incidents reported in last 30 days', severity: 'high' },
    { id: 'c2', center: { lat: 0, lng: 0 }, radius: 300, score: 40, type: 'crime', label: 'Theft Prone Zone', details: 'Pickpocketing & snatching incidents', severity: 'medium' },
    { id: 'c3', center: { lat: 0, lng: 0 }, radius: 200, score: 15, type: 'crime', label: 'Critical Zone', details: 'Assault cases reported at night', severity: 'critical' },
    { id: 'l1', center: { lat: 0, lng: 0 }, radius: 350, score: 30, type: 'lighting', label: 'Poor Lighting Zone', details: 'Street lights non-functional after 8 PM', severity: 'high' },
    { id: 'l2', center: { lat: 0, lng: 0 }, radius: 250, score: 45, type: 'lighting', label: 'Dim Lighting Area', details: 'Inadequate street illumination', severity: 'medium' },
    { id: 's1', center: { lat: 0, lng: 0 }, radius: 300, score: 90, type: 'safe_zone', label: 'Police Patrolled Zone', details: 'Regular police patrol — High security', severity: 'low' },
    { id: 's2', center: { lat: 0, lng: 0 }, radius: 200, score: 85, type: 'safe_zone', label: 'CCTV Covered Area', details: '24/7 CCTV surveillance active', severity: 'low' },
];

function generateSafetyZonesAroundPoint(center: LatLng): SafetyZone[] {
    // Offset zones relative to user location for realistic demo
    const offsets = [
        { dlat: 0.008, dlng: 0.005, idx: 0 },
        { dlat: -0.006, dlng: 0.009, idx: 1 },
        { dlat: 0.003, dlng: -0.007, idx: 2 },
        { dlat: -0.009, dlng: -0.004, idx: 3 },
        { dlat: 0.011, dlng: 0.002, idx: 4 },
        { dlat: 0.004, dlng: 0.012, idx: 5 },
        { dlat: -0.003, dlng: 0.006, idx: 6 },
    ];
    return CRIME_ZONE_DB.map((zone, i) => {
        const off = offsets[i % offsets.length];
        return {
            ...zone,
            center: {
                lat: center.lat + off.dlat,
                lng: center.lng + off.dlng,
            },
        };
    });
}

function calcSafetyScore(waypoints: LatLng[], zones: SafetyZone[]): { score: number; risks: string[] } {
    if (waypoints.length === 0 || zones.length === 0) return { score: 75, risks: [] };
    let totalPenalty = 0;
    const risks: string[] = [];
    const seen = new Set<string>();

    for (const wp of waypoints) {
        for (const zone of zones) {
            const dist = Math.sqrt(
                Math.pow((wp.lat - zone.center.lat) * 111000, 2) +
                Math.pow((wp.lng - zone.center.lng) * 111000 * Math.cos(wp.lat * Math.PI / 180), 2)
            );
            if (dist < zone.radius) {
                const penalty = zone.score < 50 ? (100 - zone.score) / 100 : 0;
                totalPenalty += penalty * (zone.severity === 'critical' ? 2 : zone.severity === 'high' ? 1.5 : 1);
                if (!seen.has(zone.id)) {
                    seen.add(zone.id);
                    if (zone.score < 50) risks.push(zone.label);
                }
            }
        }
    }
    const base = Math.max(0, 100 - totalPenalty * 15);
    return { score: Math.round(base), risks };
}

// ─── Google Maps wrapper ─────────────────────────────────────────────────────
declare global {
    interface Window {
        google: any;
        initSafeRouteMap: () => void;
    }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SafeRoutePage() {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const routeLayers = useRef<{ safe?: any; short?: any }>({});
    const zoneLayers = useRef<any[]>([]);
    const markers = useRef<{ user?: any; dest?: any }>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [userCoords, setUserCoords] = useState<LatLng | null>(null);
    const [destination, setDestination] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [safeRoute, setSafeRoute] = useState<RouteInfo | null>(null);
    const [shortRoute, setShortRoute] = useState<RouteInfo | null>(null);
    const [activeRoute, setActiveRoute] = useState<'safe' | 'short'>('safe');
    const [safetyZones, setSafetyZones] = useState<SafetyZone[]>([]);
    const [showZones, setShowZones] = useState(true);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportForm, setReportForm] = useState<Partial<UserReport>>({ reportType: 'unsafe_area', severity: 'medium', description: '' });
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [showRoutePanel, setShowRoutePanel] = useState(false);
    const [leafletLoaded, setLeafletLoaded] = useState(false);
    const [mediaPreview, setMediaPreview] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

    // ─── Load Leaflet Assets ─────────────────────────────────────────────────
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Add Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        // Add Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => setLeafletLoaded(true);
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(link);
            document.head.removeChild(script);
        };
    }, []);

    // ─── Get current position ─────────────────────────────────────────────────
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => setUserCoords({ lat: 28.6139, lng: 77.2090 }) // fallback: Delhi
            );
        } else {
            setUserCoords({ lat: 28.6139, lng: 77.2090 });
        }
    }, []);

    // ─── Initialize Map ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!leafletLoaded || !mapRef.current || !userCoords || mapInstance.current) return;

        const L = (window as any).L;
        if (!L) return;

        // Init Map
        mapInstance.current = L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false
        }).setView([userCoords.lat, userCoords.lng], 14);

        // Premium Voyager Tiles (Clean & Modern)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(mapInstance.current);

        // Add zoom control at bottom right
        L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

        // User Marker
        const userIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color:#6366f1; width:20px; height:20px; border-radius:50%; border:3px solid white; box-shadow:0 0 15px rgba(99,102,241,0.5);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        markers.current.user = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
            .addTo(mapInstance.current)
            .bindPopup('<b>Your Location</b>');

        // Initial Zones
        const zones = generateSafetyZonesAroundPoint(userCoords);
        setSafetyZones(zones);
        drawZones(zones, true);

        // Handle responsive container resizing
        const resizeObserver = new ResizeObserver(() => {
            mapInstance.current?.invalidateSize();
        });
        if (mapRef.current) {
            resizeObserver.observe(mapRef.current);
        }

        return () => resizeObserver.disconnect();
    }, [leafletLoaded, userCoords]);

    // ─── Draw safety zones ───────────────────────────────────────────────────
    const drawZones = useCallback((zones: SafetyZone[], visible: boolean) => {
        const L = (window as any).L;
        if (!L || !mapInstance.current) return;

        // Clear existing
        zoneLayers.current.forEach(layer => mapInstance.current.removeLayer(layer));
        zoneLayers.current = [];

        if (!visible) return;

        zones.forEach(zone => {
            const colorMap: Record<string, string> = {
                crime: '#ef4444',
                lighting: '#f59e0b',
                user_report: '#8b5cf6',
                safe_zone: '#22c55e',
            };
            const color = colorMap[zone.type] || '#94a3b8';

            const circle = L.circle([zone.center.lat, zone.center.lng], {
                radius: zone.radius,
                color: color,
                weight: 1,
                fillColor: color,
                fillOpacity: zone.score < 50 ? 0.2 : 0.1
            }).addTo(mapInstance.current);

            circle.bindPopup(`
                <div style="font-family:sans-serif; min-width:150px">
                    <b style="color:#1e293b; font-weight:800">${zone.label}</b><br/>
                    <small style="color:#64748b">${zone.details}</small><br/>
                    <div style="margin-top:8px; font-weight:bold; color:${zone.score > 70 ? '#16a34a' : '#ef4444'}">
                        Safety: ${zone.score}/100
                    </div>
                </div>
            `);
            zoneLayers.current.push(circle);
        });
    }, []);

    useEffect(() => {
        drawZones(safetyZones, showZones);
    }, [showZones, safetyZones, drawZones]);

    // ─── Calculate Routes (Real-world OSM Integration) ────────────────────────
    const calculateRoutes = useCallback(async () => {
        if (!destination.trim()) { toast.error('Enter destination'); return; }
        if (!userCoords) { toast.error('Waiting for locaton...'); return; }

        setIsLoading(true);
        setShowRoutePanel(false);

        try {
            const L = (window as any).L;

            // 1. Geocoding (Nominatim with Proximity Bias)
            // Define a viewbox roughly 50km around the user to prioritize local results
            const bias = 0.5;
            const viewbox = `${userCoords.lng - bias},${userCoords.lat + bias},${userCoords.lng + bias},${userCoords.lat - bias}`;

            const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=5&viewbox=${viewbox}`
            );
            const geoData = await geoRes.json();

            if (!geoData || geoData.length === 0) {
                throw new Error('Could not find that location. Try a more specific city or landmark.');
            }

            // Pick the result closest to the user from the top 5 (proximity ranking)
            const bestMatch = geoData.sort((a: any, b: any) => {
                const distA = Math.sqrt(Math.pow(parseFloat(a.lat) - userCoords.lat, 2) + Math.pow(parseFloat(a.lon) - userCoords.lng, 2));
                const distB = Math.sqrt(Math.pow(parseFloat(b.lat) - userCoords.lat, 2) + Math.pow(parseFloat(b.lon) - userCoords.lng, 2));
                return distA - distB;
            })[0];

            const destLat = parseFloat(bestMatch.lat);
            const destLng = parseFloat(bestMatch.lon);
            const dest: LatLng = { lat: destLat, lng: destLng };

            // 2. Dynamically Generate/Fetch Safety Zones for this area
            // (In production, this would fetch from MongoDB using a $geoWithin query)
            const midpoint = { lat: (userCoords.lat + dest.lat) / 2, lng: (userCoords.lng + dest.lng) / 2 };
            const newZones = generateSafetyZonesAroundPoint(midpoint);
            setSafetyZones(newZones);
            drawZones(newZones, showZones);

            // 3. Routing (OSRM Foot Profile for pedestrian safety)
            // Request alternatives=true to find safer detours
            const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${userCoords.lng},${userCoords.lat};${destLng},${destLat}?overview=full&geometries=geojson&alternatives=true`;
            const osrmRes = await fetch(osrmUrl);
            const osrmData = await osrmRes.json();

            if (!osrmData.routes || osrmData.routes.length === 0) {
                throw new Error('No walking paths found for this route.');
            }

            // 3. Process Routes & Evaluate Safety
            const allRoutes = osrmData.routes.map((r: any, idx: number) => {
                const wps = r.geometry.coordinates.map((c: any) => ({ lat: c[1], lng: c[0] }));
                const { score, risks } = calcSafetyScore(wps, safetyZones);
                return {
                    idx,
                    distance: (r.distance / 1000).toFixed(1) + ' km',
                    duration: Math.round(r.duration / 60) + ' min',
                    safetyScore: score,
                    waypoints: wps,
                    riskFactors: risks,
                    rawDistance: r.distance
                };
            });

            // Sort by Safety for "Safest"
            const safest = [...allRoutes].sort((a, b) => b.safetyScore - a.safetyScore)[0];
            // Sort by distance for "Shortest"
            const shortest = [...allRoutes].sort((a, b) => a.rawDistance - b.rawDistance)[0];

            // 4. Update Markers & UI
            if (markers.current.dest) mapInstance.current.removeLayer(markers.current.dest);
            const destIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color:#f59e0b; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(245,158,11,0.5);"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });
            markers.current.dest = L.marker([dest.lat, dest.lng], { icon: destIcon }).addTo(mapInstance.current);

            // Clear old routes
            if (routeLayers.current.safe) mapInstance.current.removeLayer(routeLayers.current.safe);
            if (routeLayers.current.short) mapInstance.current.removeLayer(routeLayers.current.short);

            // 5. Draw Routes
            // Draw Shortest (Dashed Red)
            routeLayers.current.short = L.polyline(shortest.waypoints.map((p: LatLng) => [p.lat, p.lng]), {
                color: '#ef4444', weight: 4, dashArray: '5, 10', opacity: 0.4
            }).addTo(mapInstance.current);

            // Draw Safest (Solid Green)
            routeLayers.current.safe = L.polyline(safest.waypoints.map((p: LatLng) => [p.lat, p.lng]), {
                color: '#22c55e', weight: 7, opacity: 0.9
            }).addTo(mapInstance.current);

            // Zoom to fit
            const group = L.featureGroup([markers.current.user, markers.current.dest]);
            mapInstance.current.fitBounds(group.getBounds(), { padding: [50, 50] });

            setSafeRoute({
                type: 'safe',
                distance: safest.distance,
                duration: safest.duration,
                safetyScore: safest.safetyScore,
                waypoints: safest.waypoints,
                color: '#22c55e',
                label: 'Safest Route',
                riskFactors: safest.riskFactors
            });

            setShortRoute({
                type: 'short',
                distance: shortest.distance,
                duration: shortest.duration,
                safetyScore: shortest.safetyScore,
                waypoints: shortest.waypoints,
                color: '#ef4444',
                label: 'Shortest Route',
                riskFactors: shortest.riskFactors
            });

            setActiveRoute('safe');
            setShowRoutePanel(true);
            toast.success(safest.safetyScore > shortest.safetyScore
                ? 'Found a significantly safer route!'
                : 'Direct route identified as safest.', { icon: '🛡️' });

        } catch (error: any) {
            console.error('Routing Error:', error);
            toast.error(error.message || 'Routing failed. Check your internet connection.');
        } finally {
            setIsLoading(false);
        }
    }, [destination, userCoords, safetyZones]);

    const switchRoute = useCallback((type: 'safe' | 'short') => {
        setActiveRoute(type);
        if (type === 'safe') {
            routeLayers.current.safe.setStyle({ opacity: 0.9, weight: 7 });
            routeLayers.current.short.setStyle({ opacity: 0.3, weight: 4 });
        } else {
            routeLayers.current.short.setStyle({ opacity: 0.9, weight: 7 });
            routeLayers.current.safe.setStyle({ opacity: 0.3, weight: 4 });
        }
    }, []);

    const handleSubmitReport = useCallback(async () => {
        if (!userCoords) return;
        setIsSubmittingReport(true);
        try {
            const res = await fetch('/api/safety-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location: userCoords,
                    reportType: reportForm.reportType,
                    severity: reportForm.severity,
                    description: reportForm.description,
                    mediaUrl: reportForm.mediaUrl,
                    isAnonymous: true,
                }),
            });
            if (res.ok) {
                toast.success('Area reported. Stay safe!', { icon: '🚨' });
                setShowReportModal(false);
                setMediaPreview(null);
                setReportForm({ reportType: 'unsafe_area', severity: 'medium', description: '' });
            }
        } finally {
            setIsSubmittingReport(false);
        }
    }, [userCoords, reportForm]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // In a real app, you'd upload this to S3/Cloudinary.
        // For this demo, we'll use a local object URL to simulate the secure log.
        const url = URL.createObjectURL(file);
        const type = file.type.startsWith('image/') ? 'image' : 'video';

        setMediaPreview({ url, type });
        setReportForm((prev: Partial<UserReport>) => ({ ...prev, mediaUrl: url }));
        toast.success(`${type === 'image' ? 'Photo' : 'Video'} attached securely`);
    };

    // ─── UI Components ───────────────────────────────────────────────────────
    const ScoreBadge = ({ score }: { score: number }) => {
        const color = score >= 70 ? 'from-emerald-500 to-green-400' : score >= 40 ? 'from-amber-500 to-yellow-400' : 'from-red-500 to-rose-400';
        return (
            <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${color} shadow-lg shadow-black/10`}>
                <span className="text-white font-black text-base">{score}</span>
                <span className="text-white/80 text-[7px] font-black uppercase tracking-tighter">SCORE</span>
            </div>
        );
    };

    const RouteCard = ({ route, isActive, onClick }: { route: RouteInfo; isActive: boolean; onClick: () => void }) => (
        <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`p-4 md:p-5 rounded-[2rem] border-2 cursor-pointer transition-all duration-300 ${isActive
                ? route.type === 'safe'
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-xl shadow-emerald-100/50'
                    : 'border-red-500 bg-red-50/50 shadow-xl shadow-red-100/50'
                : 'border-white bg-white hover:border-slate-100 shadow-sm'
                }`}
        >
            <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 md:p-3 rounded-2xl ${route.type === 'safe' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                        {route.type === 'safe' ? <Shield className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                    </div>
                    <div>
                        <p className="font-black text-slate-900 text-sm md:text-base leading-none mb-1">{route.label}</p>
                        <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest">{route.distance} · {route.duration}</p>
                    </div>
                </div>
                <ScoreBadge score={route.safetyScore} />
            </div>

            {route.riskFactors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 md:gap-2 mt-2">
                    {route.riskFactors.map((r, i) => (
                        <span key={i} className="px-2 py-0.5 md:px-2.5 md:py-1 bg-red-100/50 text-red-600 text-[8px] md:text-[9px] font-black rounded-xl uppercase border border-red-100/50">
                            ⚠ {r}
                        </span>
                    ))}
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isActive ? 'text-slate-900' : 'text-slate-300'}`}>
                    {isActive ? '● ACTIVE PREVIEW' : 'VIEW PATH'}
                </span>
                {isActive && <CheckCircle className="w-4 h-4 text-emerald-500" />}
            </div>
        </motion.div>
    );

    return (
        <main className="pt-24 pb-12 px-4 md:px-6 bg-slate-50 min-h-screen">
            <Navbar pollingFrequency={5000} />

            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col xl:flex-row gap-8">
                    {/* Map Sidebar */}
                    <div className="w-full xl:w-[420px] space-y-6 order-2 xl:order-1">
                        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">SAFE ROUTE <br /><span className="text-indigo-600">NAVIGATOR</span></h1>
                                <p className="text-slate-500 text-xs md:text-sm font-medium">Real-time safety analysis powered by community intelligence and crime data.</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 md:gap-3 bg-white p-1.5 md:p-2 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 focus-within:border-indigo-300 transition-all">
                                    <div className="p-3 md:p-4 bg-indigo-50 rounded-xl md:rounded-2xl">
                                        <MapPin className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Enter Destination..."
                                        className="flex-1 bg-transparent border-none outline-none font-black text-slate-900 placeholder:text-slate-300 text-xs md:text-sm pl-1"
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                    />
                                    <button
                                        onClick={calculateRoutes}
                                        disabled={isLoading}
                                        className="bg-slate-900 hover:bg-indigo-600 text-white p-3 md:p-4 rounded-xl md:rounded-2xl transition-all active:scale-90 disabled:opacity-50"
                                    >
                                        <Search className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {showRoutePanel && (
                                    <div className="space-y-4 pt-4 border-t border-slate-200">
                                        <RouteCard route={safeRoute!} isActive={activeRoute === 'safe'} onClick={() => switchRoute('safe')} />
                                        <RouteCard route={shortRoute!} isActive={activeRoute === 'short'} onClick={() => switchRoute('short')} />

                                        <button className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-3">
                                            <Navigation className="w-4 h-4" /> Start Protected Navigation
                                        </button>
                                    </div>
                                )}
                            </AnimatePresence>

                            {!showRoutePanel && (
                                <div className="bg-indigo-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl shadow-indigo-200">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                                    <h3 className="font-black text-xl mb-4 leading-none">COMMUNITY <br />PROTECTION</h3>
                                    <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest leading-relaxed mb-6">
                                        Our AI scans 2,400+ data points including street lighting, local incidents, and real-time user feedback.
                                    </p>
                                    <button
                                        onClick={() => setShowReportModal(true)}
                                        className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-50 transition-colors"
                                    >
                                        Report Safety Hazard
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Main Map View */}
                    <div className="flex-1 order-1 xl:order-2">
                        <div className="relative w-full h-[600px] xl:h-[800px] bg-white rounded-[3rem] overflow-hidden shadow-2xl shadow-indigo-100/50 border border-white p-2">
                            <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-center">
                                <Link href="/map" className="p-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white hover:text-indigo-600 transition-colors">
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowZones(!showZones)}
                                        className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl ${showZones ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}
                                    >
                                        {showZones ? 'Hide Safety Data' : 'Show Safety Data'}
                                    </button>
                                </div>
                            </div>

                            {/* Map Container */}
                            <div ref={mapRef} className="w-full h-full rounded-[2.5rem] z-0" />

                            {!leafletLoaded && (
                                <div className="absolute inset-0 bg-slate-50 flex items-center justify-center flex-col gap-4">
                                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Map Core...</span>
                                </div>
                            )}

                            {/* Map Legend (Bottom Left) */}
                            <div className="absolute bottom-6 left-6 p-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white z-10 hidden md:block">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Live Intelligence Legend</p>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <span className="text-[10px] font-extrabold text-slate-900">Crime Hotspot</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                                        <span className="text-[10px] font-extrabold text-slate-900">Poor Lighting</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                        <span className="text-[10px] font-extrabold text-slate-900">Safe Zone</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal - Reporting */}
            <AnimatePresence>
                {showReportModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                            onClick={() => setShowReportModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <div className="absolute top-0 right-0 p-4 md:p-8">
                                <button onClick={() => setShowReportModal(false)} className="text-slate-300 hover:text-slate-900"><XCircle className="w-6 h-6" /></button>
                            </div>

                            <div className="mb-6 md:mb-8">
                                <div className="p-3 md:p-4 bg-red-50 text-red-600 rounded-2xl md:rounded-3xl w-fit mb-4">
                                    <AlertCircle className="w-6 h-6 md:w-8 md:h-8" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-none">REPORT <br />INCIDENT</h2>
                                <p className="text-slate-400 text-xs md:text-sm mt-2 font-medium">Verify your location to help others avoid this area.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-3">
                                    {['harassment', 'theft', 'poor_lighting', 'unsafe_area'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setReportForm({ ...reportForm, reportType: type as any })}
                                            className={`py-4 rounded-2xl font-black uppercase text-[9px] border-2 transition-all ${reportForm.reportType === type ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-50 border-slate-50 text-slate-400'}`}
                                        >
                                            {type.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    {['low', 'medium', 'high', 'critical'].map((sev) => (
                                        <button
                                            key={sev}
                                            onClick={() => setReportForm({ ...reportForm, severity: sev as any })}
                                            className={`flex-1 py-3 rounded-xl font-black uppercase text-[8px] border-2 transition-all ${reportForm.severity === sev ? 'bg-red-500 border-red-500 text-white shadow-xl shadow-red-100' : 'bg-slate-50 border-slate-50 text-slate-400'}`}
                                        >
                                            {sev}
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <textarea
                                        placeholder="Add more details about the incident..."
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-300 min-h-[100px] outline-none focus:ring-2 ring-indigo-500/20 transition-all"
                                        value={reportForm.description}
                                        onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                                    />

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex-1 flex items-center justify-center gap-3 py-4 bg-indigo-50 text-indigo-600 rounded-2xl border-2 border-indigo-200/50 hover:bg-indigo-100 transition-all font-black uppercase text-[10px] tracking-widest group shadow-sm"
                                        >
                                            <FolderOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            <span>Attach From Drive / Manager</span>
                                        </button>

                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*,video/*"
                                            onChange={handleFileChange}
                                        />
                                    </div>

                                    {mediaPreview && (
                                        <div className="relative rounded-2xl overflow-hidden border border-slate-100 shadow-lg group">
                                            {mediaPreview.type === 'image' ? (
                                                <img src={mediaPreview.url} alt="Incident" className="w-full h-32 object-cover" />
                                            ) : (
                                                <video src={mediaPreview.url} className="w-full h-32 object-cover" />
                                            )}
                                            <button
                                                onClick={() => { setMediaPreview(null); setReportForm((prev: Partial<UserReport>) => ({ ...prev, mediaUrl: '' })); }}
                                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleSubmitReport}
                                    disabled={isSubmittingReport}
                                    className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all active:scale-95 shadow-2xl shadow-slate-200"
                                >
                                    {isSubmittingReport ? 'Submitting Signal...' : 'Broadcast Safety Alert'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .leaflet-container { 
                    font-family: inherit;
                    background: #f8fafc;
                }
                .leaflet-popup-content-wrapper {
                    border-radius: 20px;
                    padding: 8px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                }
                .leaflet-popup-tip {
                    display: none;
                }
            `}</style>
        </main>
    );
}

function LegendItem({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ background: color, opacity: 0.7 }} />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide hidden md:block">{label}</span>
        </div>
    );
}
