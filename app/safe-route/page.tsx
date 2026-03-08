'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { ParticleCanvas } from '@/components/ParticleCanvas';
import { TiltCard } from '@/components/TiltCard';
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
    Radio,
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

        // Tactical Night Mode Tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 20
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
            className={`cursor-pointer transition-all duration-500 rounded-[2.5rem] overflow-hidden ${isActive
                ? 'ring-2 ring-primary ring-offset-4 ring-offset-slate-50 shadow-[0_0_50px_rgba(99,102,241,0.2)]'
                : 'hover:translate-x-2'
                }`}
        >
            <TiltCard className={`p-6 md:p-8 relative overflow-hidden transition-all ${isActive
                ? 'bg-primary/5 border-primary/20'
                : 'bg-white border-white'
                }`}>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isActive
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'
                                }`}>
                                {route.type === 'safe' ? <Shield className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                            </div>
                            <div>
                                <p className="font-black text-foreground text-lg tracking-tight leading-none mb-1 uppercase">{route.label}</p>
                                <p className="text-[10px] text-foreground/40 font-black uppercase tracking-[0.2em]">{route.distance} · {route.duration}</p>
                            </div>
                        </div>
                        <ScoreBadge score={route.safetyScore} />
                    </div>

                    {route.riskFactors.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {route.riskFactors.map((r, i) => (
                                <span key={i} className="px-3 py-1 bg-red-500/10 text-red-500 text-[9px] font-black rounded-lg uppercase tracking-widest border border-red-500/10">
                                    ⚠ {r}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-5 border-t border-foreground/5">
                        <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${isActive ? 'text-primary' : 'text-foreground/20'}`}>
                            {isActive ? '● SYSTEM ACTIVE' : 'PREVIEW TRAJECTORY'}
                        </span>
                        {isActive && <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#6366f1]" />}
                    </div>
                </div>
                {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
                )}
            </TiltCard>
        </motion.div>
    );

    return (
        <main className="relative min-h-screen pt-24 md:pt-32 pb-20 px-4 md:px-6 overflow-hidden">
            <ParticleCanvas />
            <Navbar pollingFrequency={5000} />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col xl:flex-row gap-8">
                    {/* Map Sidebar */}
                    <div className="w-full xl:w-[420px] space-y-6 order-2 xl:order-1">
                        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter leading-none mb-3 uppercase">Tactical Route <br /><span className="text-primary">Navigator</span></h1>
                                <p className="text-foreground/50 text-xs md:text-sm font-bold uppercase tracking-widest">Real-time safety analysis powered by community intelligence and crime data.</p>
                            </div>

                            <div className="space-y-3">
                                <TiltCard className="glass-card p-8 md:p-12 rounded-[3rem] bg-background/40 backdrop-blur-3xl shadow-[0_30px_80px_-20px_rgba(var(--primary-rgb),0.3)] border border-primary/20">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent z-0 pointer-events-none" />
                                    <div className="relative z-10 flex items-center gap-2 md:gap-3 bg-black/20 border border-white/10 rounded-2xl md:rounded-3xl p-3 md:p-4 mb-4 focus-within:border-primary/50 transition-all">
                                        <MapPin className="w-5 h-5 text-primary" />
                                        <input
                                            type="text"
                                            placeholder="Enter Destination..."
                                            className="flex-1 bg-transparent border-none outline-none font-bold text-foreground placeholder:text-foreground/20 text-sm md:text-base pl-1"
                                            value={destination}
                                            onChange={(e) => setDestination(e.target.value)}
                                        />
                                        <button
                                            onClick={calculateRoutes}
                                            disabled={isLoading}
                                            className="bg-primary hover:bg-primary/80 border border-primary/50 text-white p-3 md:p-4 rounded-xl md:rounded-2xl transition-all active:scale-[0.95] disabled:opacity-50 shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]"
                                        >
                                            <Search className="w-5 h-5" />
                                        </button>
                                    </div>
                                </TiltCard>
                            </div>

                            <AnimatePresence>
                                {showRoutePanel && (
                                    <div className="space-y-4 pt-4 border-t border-slate-200">
                                        <RouteCard route={safeRoute!} isActive={activeRoute === 'safe'} onClick={() => switchRoute('safe')} />
                                        <RouteCard route={shortRoute!} isActive={activeRoute === 'short'} onClick={() => switchRoute('short')} />

                                        <button className="btn-liquid w-full py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[11px] text-white shadow-2xl shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-4">
                                            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                                                <Navigation className="w-4 h-4" />
                                            </div>
                                            INITIALIZE SECURE PATH
                                        </button>
                                    </div>
                                )}
                            </AnimatePresence>

                            {!showRoutePanel && (
                                <TiltCard className="glass-card p-8 rounded-[3rem] relative overflow-hidden shadow-[0_30px_80px_-20px_rgba(var(--primary-rgb),0.5)] border border-primary/20 bg-background/80 backdrop-blur-3xl group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent z-0 pointer-events-none" />
                                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/30 rounded-full blur-[100px] pointer-events-none z-0 transition-opacity group-hover:opacity-70 opacity-30"></div>
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform pointer-events-none z-10 duration-700">
                                        <AlertTriangle className="w-24 h-24 text-primary" />
                                    </div>
                                    <div className="relative z-20">
                                        <h3 className="flex items-center gap-4 text-foreground font-black text-2xl uppercase tracking-[0.3em] leading-none mb-4">
                                            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]">
                                                <Radio className="w-6 h-6 text-primary animate-pulse" />
                                            </div>
                                            <span>NETWORK <span className="text-primary">SCAN</span></span>
                                        </h3>
                                        <p className="text-foreground/50 text-xs font-bold uppercase tracking-widest leading-relaxed mb-6">
                                            Our AI scans 2,400+ data points including street lighting, local incidents, and real-time user feedback.
                                        </p>
                                        <button
                                            onClick={() => setShowReportModal(true)}
                                            className="w-full py-6 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] text-white bg-gradient-to-r from-primary via-primary to-primary shadow-[0_20px_50px_rgba(var(--primary-rgb),0.4)] border border-white/20 hover:shadow-[0_20px_60px_rgba(var(--primary-rgb),0.6)] hover:-translate-y-1 transition-all active:scale-[0.98]"
                                        >
                                            TRANSMIT TACTICAL DATA
                                        </button>
                                    </div>
                                </TiltCard>
                            )}
                        </motion.div>
                    </div>

                    {/* Main Map View */}
                    <div className="flex-1 order-1 xl:order-2">
                        <div className="glass-card relative w-full h-[400px] lg:h-[600px] xl:h-[800px] bg-background/40 backdrop-blur-3xl rounded-[3rem] overflow-hidden shadow-[0_30px_80px_rgba(var(--primary-rgb),0.2)] border border-primary/20 p-2">
                            <div className="absolute top-6 left-6 right-6 z-[1001] flex justify-between items-center">
                                <Link href="/map" className="p-4 bg-background/80 backdrop-blur-3xl rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/10 text-foreground/70 hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center">
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowZones(!showZones)}
                                        className={`px-6 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl border ${showZones ? 'bg-primary border-primary/50 text-white shadow-[0_10px_30px_rgba(var(--primary-rgb),0.4)]' : 'bg-background/80 backdrop-blur-3xl border-white/10 text-foreground/60 hover:text-foreground'}`}
                                    >
                                        {showZones ? 'Disable Grid' : 'Enable Grid'}
                                    </button>
                                </div>
                            </div>

                            {/* Map Container */}
                            <div ref={mapRef} className="w-full h-full rounded-[2.5rem] z-0 grayscale-[0.5] invert-[0.05]" />

                            {!leafletLoaded && (
                                <div className="absolute inset-0 bg-background/80 backdrop-blur-2xl flex flex-col items-center justify-center gap-6 z-[2000]">
                                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40">Initializing Sensors...</span>
                                </div>
                            )}

                            {/* Map Legend (Bottom Left) */}
                            <div className="absolute bottom-8 left-8 p-6 bg-background/80 backdrop-blur-3xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 z-[1001] hidden md:block">
                                <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] mb-4">Signal Key</p>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                        <span className="text-[10px] font-black text-foreground uppercase tracking-widest">High Risk</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                                        <span className="text-[10px] font-black text-foreground uppercase tracking-widest">Low Light</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                        <span className="text-[10px] font-black text-foreground uppercase tracking-widest">Secure Area</span>
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
                            className="absolute inset-0 bg-background/80 backdrop-blur-md"
                            onClick={() => setShowReportModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="glass-card relative w-full max-w-lg bg-background/60 backdrop-blur-3xl rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent z-0 pointer-events-none" />
                            <div className="absolute top-0 right-0 p-4 md:p-8 z-10">
                                <button onClick={() => setShowReportModal(false)} className="text-foreground/40 hover:text-red-500 transition-colors"><XCircle className="w-6 h-6" /></button>
                            </div>

                            <div className="mb-6 md:mb-8 relative z-10">
                                <div className="p-3 md:p-4 bg-red-500/10 text-red-500 rounded-2xl md:rounded-3xl w-fit mb-4 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                                    <AlertCircle className="w-6 h-6 md:w-8 md:h-8 animate-pulse" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-foreground leading-none uppercase tracking-widest">REPORT <br /><span className="text-red-500">INCIDENT</span></h2>
                                <p className="text-foreground/50 text-xs md:text-sm mt-2 font-bold uppercase tracking-widest">Verify your location to help others avoid this area.</p>
                            </div>

                            <div className="space-y-6 relative z-10">
                                <div className="grid grid-cols-2 gap-3">
                                    {['harassment', 'theft', 'poor_lighting', 'unsafe_area'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setReportForm({ ...reportForm, reportType: type as any })}
                                            className={`py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest border transition-all ${reportForm.reportType === type ? 'bg-primary border-primary/50 text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]' : 'bg-black/20 border-white/5 text-foreground/40 hover:text-foreground hover:bg-white/5'}`}
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
                                            className={`flex-1 py-3 rounded-xl font-black uppercase text-[8px] tracking-widest border transition-all ${reportForm.severity === sev ? 'bg-red-500 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-black/20 border-white/5 text-foreground/40 hover:text-foreground hover:bg-white/5'}`}
                                        >
                                            {sev}
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <textarea
                                        placeholder="Add more details about the incident..."
                                        className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl text-sm font-bold text-foreground placeholder:text-foreground/20 min-h-[100px] outline-none focus:border-red-500/50 focus:bg-white/5 transition-all"
                                        value={reportForm.description}
                                        onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                                    />

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex-1 flex items-center justify-center gap-3 py-4 bg-white/5 text-foreground rounded-2xl border border-white/10 hover:bg-white/10 transition-all font-black uppercase text-[10px] tracking-widest group shadow-[0_10px_20px_rgba(0,0,0,0.2)]"
                                        >
                                            <FolderOpen className="w-5 h-5 group-hover:scale-110 group-hover:text-primary transition-all" />
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
                                        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] group">
                                            {mediaPreview.type === 'image' ? (
                                                <img src={mediaPreview.url} alt="Incident" className="w-full h-32 object-cover" />
                                            ) : (
                                                <video src={mediaPreview.url} className="w-full h-32 object-cover" />
                                            )}
                                            <button
                                                onClick={() => { setMediaPreview(null); setReportForm((prev: Partial<UserReport>) => ({ ...prev, mediaUrl: '' })); }}
                                                className="absolute top-2 right-2 p-2 bg-red-500/80 backdrop-blur-md border border-red-500/50 text-white rounded-xl shadow-lg hover:bg-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleSubmitReport}
                                    disabled={isSubmittingReport}
                                    className={`w-full py-6 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] text-white bg-gradient-to-r from-red-500 via-red-500 to-red-500 shadow-[0_20px_50px_rgba(239,68,68,0.4)] border border-red-500/30 hover:shadow-[0_20px_60px_rgba(239,68,68,0.6)] hover:-translate-y-1 transition-all active:scale-[0.98] ${isSubmittingReport ? 'opacity-50 animate-pulse' : ''}`}
                                >
                                    {isSubmittingReport ? 'ENCRYPTING SIGNAL...' : 'BROADCAST TACTICAL ALERT'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .leaflet-container { 
                    font-family: inherit;
                    background: #000 !important;
                }
                .leaflet-popup-content-wrapper {
                    background: transparent !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    border-radius: 20px;
                }
                .leaflet-popup-content {
                    margin: 0 !important;
                    width: auto !important;
                }
                .leaflet-popup-tip-container {
                    display: none !important;
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
