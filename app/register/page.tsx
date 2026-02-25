'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Mail, Lock, User, Phone, ArrowRight, ShieldCheck, Droplets, MapPin, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        bloodGroup: 'Unknown',
        medicalConditions: '',
        homeAddress: '',
    });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Registration Synced Successfully');
                router.push('/login');
            } else {
                toast.error(data.message || 'Registration failure');
            }
        } catch (error) {
            toast.error('Network Anomaly Detected');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-16 px-6 relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-3xl opacity-50" />

            <div className="max-w-4xl mx-auto relative">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white p-6 md:p-16 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-indigo-100/50"
                >
                    <div className="flex flex-col items-center mb-12">
                        <div className="p-4 bg-primary rounded-2xl shadow-xl shadow-indigo-200 mb-6">
                            <ShieldCheck className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">DEPLOY PROFILE</h1>
                        <p className="text-slate-400 font-medium text-sm">Initialize your encrypted safety identity</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Personal Info */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Legal Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Jane Doe"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-6 outline-none focus:bg-white focus:border-primary transition-all font-bold text-slate-700"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Digital Identity (Email)</label>
                                <div className="relative group">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        placeholder="jane@hersecure.app"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-6 outline-none focus:bg-white focus:border-primary transition-all font-bold text-slate-700"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Primary Mobile Link</label>
                                <div className="relative group">
                                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="tel"
                                        placeholder="+1 234 567 890"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-6 outline-none focus:bg-white focus:border-primary transition-all font-bold text-slate-700"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                        minLength={10}
                                        pattern=".{10,}"
                                        title="Phone number must be at least 10 characters long"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Security Key (Password)</label>
                                <div className="relative group">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="password"
                                        placeholder="Min. 6 chars"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-6 outline-none focus:bg-white focus:border-primary transition-all font-bold text-slate-700"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Medical Info */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Blood Group (Critical)</label>
                                <div className="relative group">
                                    <Droplets className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400 group-focus-within:text-red-500 transition-colors" />
                                    <select
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-6 outline-none focus:bg-white focus:border-primary transition-all font-bold text-slate-700 appearance-none"
                                        value={formData.bloodGroup}
                                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                                    >
                                        <option value="Unknown">Select Blood Type</option>
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                            <option key={bg} value={bg}>{bg}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Service Residence Hub</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Home City / Area"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-6 outline-none focus:bg-white focus:border-primary transition-all font-bold text-slate-700"
                                        value={formData.homeAddress}
                                        onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Critical Medical Narrative</label>
                                <div className="relative group">
                                    <Activity className="absolute left-6 top-6 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                                    <textarea
                                        placeholder="Allergies, chronic conditions, regular medications..."
                                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-5 pl-14 pr-6 outline-none focus:bg-white focus:border-primary transition-all font-medium text-slate-700 h-32 resize-none"
                                        value={formData.medicalConditions}
                                        onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 shadow-2xl shadow-slate-200 hover:bg-primary transition-all active:scale-[0.98] group"
                        >
                            {loading ? 'INITIALIZING...' : 'AUTHORIZE DEPLOYMENT'}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </button>
                    </form>

                    <div className="mt-12 text-center text-slate-400 text-sm font-medium">
                        Identity already verified?{' '}
                        <Link href="/login" className="text-primary font-black uppercase tracking-widest text-[10px] ml-2 hover:underline">
                            Access Node
                        </Link>
                    </div>
                </motion.div>

                <p className="mt-8 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.4em]">
                    HerSecure Platform v4.0.2
                </p>
            </div>
        </div>
    );
}
