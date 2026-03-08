'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { motion } from 'framer-motion';
import {
    User,
    Phone,
    Droplets,
    Activity,
    Home as HomeIcon,
    Briefcase,
    Save,
    ArrowLeft,
    Shield,
    Cpu,
    Fingerprint
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { ParticleCanvas } from '@/components/ParticleCanvas';
import { TiltCard } from '@/components/TiltCard';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        bloodGroup: '',
        medicalConditions: '',
        homeAddress: '',
        workAddress: '',
    });

    useEffect(() => {
        fetch('/api/profile')
            .then(res => res.json())
            .then(data => {
                setUser(data);
                setFormData({
                    name: data.name || '',
                    phone: data.phone || '',
                    bloodGroup: data.bloodGroup || 'Unknown',
                    medicalConditions: data.medicalConditions || '',
                    homeAddress: data.homeAddress || '',
                    workAddress: data.workAddress || '',
                });
                setLoading(false);
            });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                toast.success('Biological Data Synchronized');
            } else {
                toast.error('Sync failed');
            }
        } catch (error) {
            toast.error('Network Anomaly Detected');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Synchronizing Bio-Link...</p>
            </div>
        </div>
    );

    const inputStyle = "w-full bg-primary/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 outline-none focus:bg-primary/10 focus:border-primary/40 transition-all font-bold text-foreground placeholder:text-foreground/20 backdrop-blur-md";

    return (
        <main className="relative min-h-screen pt-32 pb-20 px-6 overflow-hidden">
            <ParticleCanvas />
            <Navbar pollingFrequency={5000} />

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="flex items-center justify-between mb-12">
                    <Link href="/" className="flex items-center gap-3 text-foreground/60 hover:text-primary transition-all font-bold uppercase tracking-widest text-[10px]">
                        <ArrowLeft className="w-4 h-4" /> Operations Hub
                    </Link>
                    <div className="px-6 py-2.5 bg-primary/10 border border-primary/20 rounded-full flex items-center gap-3 backdrop-blur-xl">
                        <Fingerprint className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Biometric Auth Active</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Identity Sidebar */}
                    <div className="lg:col-span-4 space-y-8">
                        <TiltCard className="p-10 flex flex-col items-center text-center relative overflow-hidden group">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                            <div className="relative mb-8 group">
                                <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20 shadow-2xl relative z-10 overflow-hidden">
                                    <User className="w-16 h-16 text-primary group-hover:scale-110 transition-transform" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                                    className="absolute inset-0 -m-4 border-t-2 border-primary/40 rounded-full opacity-20"
                                />
                                <div className="absolute inset-0 -m-8 border border-primary/10 rounded-full animate-ping [animation-duration:3s] opacity-20" />
                            </div>

                            <h2 className="text-3xl font-black tracking-tighter mb-2 text-foreground uppercase">{user?.name}</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40 mb-8">{user?.email}</p>

                            <div className="w-full space-y-4">
                                <div className="flex justify-between p-5 bg-primary/5 rounded-2xl border border-white/5 backdrop-blur-xl group-hover:bg-primary/10 transition-all">
                                    <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest text-left">NODE ACCESS</span>
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest text-right">{user?.role}</span>
                                </div>
                                <div className="flex justify-between p-5 bg-primary/5 rounded-2xl border border-white/5 backdrop-blur-xl group-hover:bg-primary/10 transition-all">
                                    <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest text-left">SECTOR STATUS</span>
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest text-right flex items-center gap-2">
                                        SECURE <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    </span>
                                </div>
                            </div>
                        </TiltCard>

                        <TiltCard className="p-10 bg-primary rounded-[2.5rem] text-white shadow-2xl shadow-primary/30 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-primary/60" />
                            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-150 transition-transform pointer-events-none">
                                <Shield className="w-24 h-24" />
                            </div>
                            <div className="relative z-10">
                                <Cpu className="w-10 h-10 mb-8 text-white/50" />
                                <h4 className="text-2xl font-black mb-4 tracking-tighter uppercase">ENCRYPTED CORE</h4>
                                <p className="text-sm font-medium text-white/70 leading-relaxed mb-10">Your biological and tactical data is shielded with Layer-7 quantum encryption for total network privacy.</p>
                                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden relative">
                                    <motion.div
                                        animate={{ x: ['-100%', '100%'] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                        className="absolute inset-0 w-1/2 h-full bg-white opacity-40 shadow-[0_0_20px_white]"
                                    />
                                </div>
                            </div>
                        </TiltCard>
                    </div>

                    {/* Data Configuration */}
                    <div className="lg:col-span-8">
                        <form onSubmit={handleSave} className="glass-card p-10 md:p-14 space-y-12 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                                style={{ background: 'linear-gradient(90deg, transparent, rgba(var(--primary-rgb),0.5), transparent)' }} />

                            <div className="flex items-center gap-4">
                                <div className="w-2 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                                <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-foreground">
                                    Biological Identification Hub
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em] ml-2">Legal Identity</label>
                                    <div className="relative group">
                                        <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 group-focus-within:text-primary transition-colors" />
                                        <input
                                            className={inputStyle}
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em] ml-2">Primary Comms Link</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 group-focus-within:text-primary transition-colors" />
                                        <input
                                            className={inputStyle}
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em] ml-2">Biosignature Group</label>
                                    <div className="relative group">
                                        <Droplets className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/60 group-focus-within:text-accent transition-colors" />
                                        <select
                                            className={inputStyle}
                                            value={formData.bloodGroup}
                                            onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                                        >
                                            <option value="Unknown" className="bg-background text-foreground">Select Blood Group</option>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                                <option key={bg} value={bg} className="bg-background text-foreground">{bg}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em] ml-2">Operational Base (Work)</label>
                                    <div className="relative group">
                                        <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 group-focus-within:text-primary transition-colors" />
                                        <input
                                            className={inputStyle}
                                            placeholder="Sector Alpha, Hub B..."
                                            value={formData.workAddress}
                                            onChange={(e) => setFormData({ ...formData, workAddress: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em] ml-2">Static Resident Sector</label>
                                <div className="relative group">
                                    <HomeIcon className="absolute left-6 top-8 w-4 h-4 text-foreground/30 group-focus-within:text-primary transition-colors" />
                                    <textarea
                                        className={`${inputStyle} h-32 py-8 resize-none leading-relaxed`}
                                        placeholder="Full residential sector address for emergency dispatch..."
                                        value={formData.homeAddress}
                                        onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em] ml-2">Critical Bio-Intelligence</label>
                                <div className="relative group">
                                    <Activity className="absolute left-6 top-8 w-4 h-4 text-foreground/30 group-focus-within:text-primary transition-colors" />
                                    <textarea
                                        className={`${inputStyle} h-40 py-8 resize-none leading-relaxed`}
                                        placeholder="Allergies, conditions, implants, medications (Active AI triage monitoring)..."
                                        value={formData.medicalConditions}
                                        onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-liquid w-full py-8 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[12px] text-white flex items-center justify-center gap-5 transition-all active:scale-[0.98] group shadow-2xl shadow-primary/40"
                            >
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
                                    <Save className="w-5 h-5" />
                                </div>
                                {saving ? 'TRANSMITTING BIO-PACKETS...' : 'ARCHIVE SECURE PROFILE'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}
