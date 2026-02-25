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
    Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

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
                toast.success('Profile Synced Successfully');
            } else {
                toast.error('Sync failed');
            }
        } catch (error) {
            toast.error('Network Error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Authenticating Node...</p>
            </div>
        </div>
    );

    return (
        <main className="pt-24 pb-12 px-6 bg-slate-50/50 min-h-screen">
            <Navbar />
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-bold uppercase tracking-tight text-sm">
                        <ArrowLeft className="w-4 h-4" /> Hub Dashboard
                    </Link>
                    <div className="px-5 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-2 group">
                        <Shield className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Biometric Link Active</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Identity Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-indigo-100/20 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
                            <div className="w-28 h-28 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-slate-100 shadow-inner group transition-all hover:border-primary/30">
                                <User className="w-14 h-14 text-slate-300 group-hover:text-primary transition-colors" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-1">{user?.name}</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">{user?.email}</p>

                            <div className="flex flex-col gap-3 w-full">
                                <div className="flex justify-between p-4 bg-slate-50 rounded-2xl">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clearance</span>
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">{user?.role}</span>
                                </div>
                                <div className="flex justify-between p-4 bg-slate-50 rounded-2xl">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Node Status</span>
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Verified</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100">
                            <Activity className="w-8 h-8 mb-4 opacity-50" />
                            <h4 className="text-lg font-black mb-2 leading-tight">Privacy Protections Active</h4>
                            <p className="text-xs text-indigo-100 font-medium leading-relaxed mb-6">Your data is encrypted using military-grade protocols and is only shared with responders during active SOS events.</p>
                            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                                <div className="w-full h-full bg-white animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Data Configuration */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSave} className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-indigo-100/20 space-y-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 border-l-4 border-primary pl-4">
                                    Tactical Profile Data
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Legal Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                                        <input
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-6 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Primary Mobile Link</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                                        <input
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-6 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Medical Blood Group</label>
                                    <div className="relative group">
                                        <Droplets className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400 group-focus-within:text-red-500 transition-colors" />
                                        <select
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-6 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700 appearance-none"
                                            value={formData.bloodGroup}
                                            onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                                        >
                                            <option value="Unknown">Select Blood Group</option>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                                <option key={bg} value={bg}>{bg}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Operation Hub (Work)</label>
                                    <div className="relative group">
                                        <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                                        <input
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-6 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700"
                                            placeholder="Building, Area..."
                                            value={formData.workAddress}
                                            onChange={(e) => setFormData({ ...formData, workAddress: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Static Residence Address</label>
                                <div className="relative group">
                                    <HomeIcon className="absolute left-5 top-6 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-6 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700 h-28 resize-none"
                                        placeholder="Full residential address for first responders..."
                                        value={formData.homeAddress}
                                        onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Critical Medical Intel</label>
                                <div className="relative group">
                                    <Activity className="absolute left-5 top-6 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-6 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700 h-32 resize-none"
                                        placeholder="Allergies, conditions, medications (Vital for AI triage)..."
                                        value={formData.medicalConditions}
                                        onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-primary transition-all flex items-center justify-center gap-3 active:scale-[0.99]"
                            >
                                <Save className="w-5 h-5" />
                                {saving ? 'SYNCING DATA...' : 'SAVE ENCRYPTED PROFILE'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}
