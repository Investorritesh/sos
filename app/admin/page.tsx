'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    AlertCircle,
    FileCheck,
    Activity,
    Download,
    AlertTriangle,
    ArrowRight,
    MapPin,
    Shield,
    PhoneCall,
    Battery,
    Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeSignals, setActiveSignals] = useState<any[]>([]);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 10000); // 10s refresh
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
                setActiveSignals(data.activeSOSSignals || []);
            } else {
                toast.error('Tactical Link Failed');
            }
        } catch (error) {
            console.error('Admin fetch error', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
            <Shield className="w-16 h-16 text-primary animate-pulse mb-6" />
            <h2 className="text-sm font-black uppercase tracking-[0.5em] animate-pulse">Initializing Command Center...</h2>
        </div>
    );

    return (
        <main className="pt-24 pb-12 px-6 bg-slate-50 min-h-screen">
            <Navbar />
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">System Online // HERSECURE-OS</span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Command <br />Center</h1>
                    </div>
                    <div className="flex gap-4">
                        <button className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-sm hover:shadow-xl hover:border-primary transition-all">
                            <Download className="w-4 h-4 text-primary" /> Intelligence Export
                        </button>
                        <div className="px-6 py-4 bg-slate-900 rounded-2xl flex items-center gap-4 text-white shadow-2xl">
                            <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-widest opacity-50">Global Load</p>
                                <p className="text-xs font-black">99.9% UPTIME</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tactical Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <StatCard title="Registered Citizens" value={stats?.totalUsers} icon={<Users />} color="text-indigo-600" />
                    <StatCard title="Active SOS Pulses" value={stats?.activeSOSCount} icon={<AlertTriangle />} color="text-red-500" isEmergency={stats?.activeSOSCount > 0} />
                    <StatCard title="Evidence Logs" value={stats?.totalIncidents} icon={<FileCheck />} color="text-emerald-600" />
                    <StatCard title="Monitored Sectors" value="24/7" icon={<Activity />} color="text-amber-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Live Emergency Feed */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                            <h2 className="text-lg font-black flex items-center gap-3 text-slate-900 border-l-4 border-red-500 pl-4 uppercase tracking-tighter">
                                Live Priority Feed
                            </h2>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Real-Time Sync</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <AnimatePresence mode="popLayout">
                                {activeSignals.length > 0 ? (
                                    activeSignals.map((signal: any, i: number) => (
                                        <motion.div
                                            key={signal._id}
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: 20, opacity: 0 }}
                                            className="bg-white p-6 md:p-8 rounded-[2.5rem] border-2 border-red-500/10 hover:border-red-500 transition-all shadow-xl shadow-red-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden group"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />

                                            <div className="flex items-center gap-6 z-10">
                                                <div className="w-20 h-20 bg-red-500 rounded-3xl flex flex-col items-center justify-center text-white shadow-2xl shadow-red-200">
                                                    <AlertTriangle className="w-8 h-8 mb-1 animate-pulse" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">ACTIVE</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{signal.userId?.name}</h3>
                                                        <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-100">SOS-SIGNAL</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-4 items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                            <PhoneCall className="w-3 h-3 text-primary" /> {signal.userId?.phone}
                                                        </span>
                                                        <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                            <Battery className={`w-3 h-3 ${signal.batteryLevel < 20 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`} /> {signal.batteryLevel}% ENERGY
                                                        </span>
                                                        <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                            <Clock className="w-3 h-3 text-amber-500" /> {new Date(signal.startedAt).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 w-full md:w-auto z-10">
                                                <button className="flex-1 md:flex-none p-5 bg-slate-900 text-white rounded-2xl hover:bg-primary transition-all shadow-xl active:scale-95 group">
                                                    <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                </button>
                                                <a href={`tel:${signal.userId?.phone}`} className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95">
                                                    <PhoneCall className="w-4 h-4" /> Deploy Help
                                                </a>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="bg-white p-20 rounded-[3rem] border border-dashed border-slate-200 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Shield className="w-10 h-10 text-slate-200" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 mb-2">No Active Emergencies</h3>
                                        <p className="text-slate-400 text-sm font-medium">All monitored citizens are currently within safe perimeters.</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Infrastructure Monitor */}
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16" />
                            <h3 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs flex items-center gap-2">
                                <Activity className="w-4 h-4 text-primary" /> Subsystems
                            </h3>
                            <div className="space-y-4">
                                <StatusLine label="SOS DISPATCH" status="Active" />
                                <StatusLine label="GEO-MAPPING" status="Encrypted" />
                                <StatusLine label="AI GUIDANCE" status="V3.0 Online" />
                                <StatusLine label="SMS RELAY" status="Synced" />
                                <StatusLine label="AUDIO LOG" status="Recording..." />
                            </div>
                        </div>

                        <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <h3 className="text-xl font-black mb-4 leading-tight relative z-10">Real-Time <br />Intelligence</h3>
                            <p className="text-xs text-slate-400 mb-8 font-medium relative z-10 leading-relaxed">
                                Monitoring 1,248 encrypted nodes across the network. Automatic priority routing is active.
                            </p>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                                    <Shield className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Node Status</p>
                                    <p className="text-sm font-black">SECURE-ALPHA</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity Mini-Feed */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Recent Evidence Logs</h3>
                            <div className="space-y-6">
                                {stats?.recentIncidents.map((incident: any) => (
                                    <div key={incident._id} className="flex gap-4">
                                        <div className="w-1.5 h-12 bg-slate-100 rounded-full self-start overflow-hidden">
                                            <div className="w-full h-1/2 bg-amber-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900 line-clamp-1">{incident.description}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                {new Date(incident.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

function StatCard({ title, value, icon, color, isEmergency }: any) {
    return (
        <div className={`bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-2xl group ${isEmergency ? 'border-red-500/50 shadow-red-50' : ''}`}>
            <div className={`p-3 md:p-4 bg-slate-50 rounded-2xl w-fit mb-4 md:mb-6 group-hover:bg-slate-900 group-hover:text-white transition-all ${color}`}>
                {icon}
            </div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2 leading-none">{title}</p>
            <h2 className={`text-3xl md:text-4xl font-black tracking-tighter leading-none ${isEmergency ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>{value || 0}</h2>
        </div>
    );
}

function StatusLine({ label, status }: any) {
    return (
        <div className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{label}</span>
            <span className="text-[10px] text-primary font-black uppercase tracking-tighter">{status}</span>
        </div>
    );
}
