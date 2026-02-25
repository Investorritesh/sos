'use client';

import { useState, useEffect } from 'react';
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
    Mic
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

export default function IncidentReport() {
    const [description, setDescription] = useState('');
    const [incidentType, setIncidentType] = useState('Other');
    const [severity, setSeverity] = useState('Medium');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [loading, setLoading] = useState(false);
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

    return (
        <main className="pt-24 pb-12 px-6 bg-slate-50/50 min-h-screen">
            <Navbar />
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-bold uppercase tracking-tight text-sm">
                        <ArrowLeft className="w-4 h-4" /> Operations Hub
                    </Link>
                    <div className={`px-5 py-2 bg-white border rounded-2xl flex items-center gap-2 shadow-sm transition-all ${isRecording ? 'border-red-100 bg-red-50/50' : 'border-slate-100'}`}>
                        {isRecording ? (
                            <Mic className="w-4 h-4 text-red-500 animate-pulse" />
                        ) : (
                            <Clock className="w-4 h-4 text-primary" />
                        )}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isRecording ? 'text-red-600' : 'text-slate-900'}`}>
                            {isRecording ? 'Digital Witness Active' : 'Evidence Standby'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-primary p-10 rounded-[3rem] text-white shadow-2xl shadow-indigo-200">
                            <Shield className="w-12 h-12 mb-6 opacity-50" />
                            <h2 className="text-3xl font-black mb-4 leading-tight">Evidence <br />Collection</h2>
                            <p className="text-sm font-medium text-indigo-100 leading-relaxed mb-8 opacity-80">
                                Every detail matters. Your report is encrypted and timestamped for legal integrity.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">End-to-End Encryption</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Verified GPS Stamp</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-indigo-100/10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Locked Sector</h4>
                            </div>
                            <p className="text-base font-black text-slate-900">
                                {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Sychronizing Grid...'}
                            </p>
                        </div>
                    </div>

                    <div className="lg:col-span-3">
                        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-indigo-100/20 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Incident Category</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 outline-none focus:bg-white focus:border-primary transition-all font-bold text-slate-700 appearance-none"
                                        value={incidentType}
                                        onChange={(e) => setIncidentType(e.target.value)}
                                    >
                                        {['Harassment', 'Stalking', 'Physical Abuse', 'Theft', 'Medical Emergency', 'Other'].map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Urgency Level</label>
                                    <select
                                        className={`w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 outline-none focus:bg-white transition-all font-bold appearance-none ${severity === 'Critical' ? 'text-red-500 border-red-100' : 'text-slate-700'
                                            }`}
                                        value={severity}
                                        onChange={(e) => setSeverity(e.target.value)}
                                    >
                                        {['Low', 'Medium', 'High', 'Critical'].map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" /> Narrative Intel
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setIsAnonymous(!isAnonymous)}
                                        className={`text-[9px] font-black uppercase px-3 py-1 rounded-full transition-all border ${isAnonymous
                                            ? 'bg-slate-900 border-slate-900 text-white'
                                            : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        {isAnonymous ? 'Masked Identity' : 'Public Profile'}
                                    </button>
                                </div>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-6 outline-none focus:bg-white focus:border-primary transition-all font-medium text-slate-700 h-40 resize-none leading-relaxed"
                                    placeholder="Describe the incident with total precision (appearance, vehicle tags, direction of travel)..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex gap-4">
                                <button type="button" className="flex-1 flex items-center justify-center gap-3 p-5 bg-slate-50 border border-slate-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-white hover:border-indigo-200 transition-all group shadow-sm">
                                    <Camera className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                                    Attach Media
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !description}
                                className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] ${severity === 'Critical'
                                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-100'
                                    : 'bg-slate-900 hover:bg-primary text-white shadow-slate-200'
                                    }`}
                            >
                                {loading ? 'Transmitting...' : 'Log Secure Report'}
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}
