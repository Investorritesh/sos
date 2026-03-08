'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Mail, Lock, User, Phone, ArrowRight, ShieldCheck, Droplets, MapPin, Activity, Cpu, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ParticleCanvas } from '@/components/ParticleCanvas';
import { TiltCard } from '@/components/TiltCard';

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

    const inputStyle = "w-full bg-primary/5 border border-white/10 rounded-[2rem] py-5 pl-14 pr-6 outline-none focus:bg-primary/10 focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all font-bold text-foreground placeholder:text-foreground/20 backdrop-blur-xl shadow-inner";

    return (
        <main className="relative min-h-screen py-32 px-6 overflow-hidden">
            <ParticleCanvas />

            <div className="max-w-4xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <TiltCard intensity={0.5} className="p-8 md:p-16 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(var(--primary-rgb),0.5), transparent)' }} />

                        <div className="card-content">
                            <div className="flex flex-col items-center mb-14 text-center">
                                <motion.div
                                    animate={{
                                        rotateY: [0, 360],
                                        filter: ['drop-shadow(0 0 15px rgba(var(--primary-rgb),0.4))', 'drop-shadow(0 0 35px rgba(var(--primary-rgb),0.8))', 'drop-shadow(0 0 15px rgba(var(--primary-rgb),0.4))']
                                    }}
                                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                                    className="p-5 bg-primary/10 rounded-3xl mb-6 border border-primary/20 backdrop-blur-2xl shadow-2xl"
                                >
                                    <ShieldCheck className="w-12 h-12 text-primary" />
                                </motion.div>

                                <div className="flex items-center gap-3 mb-4">
                                    <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] bg-primary/10 text-primary border border-primary/20 flex items-center shadow-lg shadow-primary/20">
                                        <Zap className="w-3.5 h-3.5 mr-2 animate-pulse" /> Network Initiation
                                    </span>
                                </div>

                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-3 uppercase text-foreground leading-none">
                                    Deploy <span className="text-primary drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]">Profile</span>
                                </h1>
                                <p className="max-w-md text-[11px] font-black uppercase tracking-[0.3em] text-foreground/40 leading-relaxed">
                                    Initialize your encrypted safety identity within the HerSecure global guardian network.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                                    {/* Personal Info */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--fg-muted)' }}>Legal Full Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Jane Doe"
                                                className={inputStyle}
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--fg-muted)' }}>Digital Identity (Email)</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="email"
                                                placeholder="jane@hersecure.app"
                                                className={inputStyle}
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--fg-muted)' }}>Primary Mobile Link</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="tel"
                                                placeholder="+1 234 567 890"
                                                className={inputStyle}
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                required
                                                minLength={10}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--fg-muted)' }}>Security Key (Password)</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="password"
                                                placeholder="Min. 6 characters"
                                                className={inputStyle}
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--fg-muted)' }}>Blood Group</label>
                                        <div className="relative group">
                                            <Droplets className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/60 group-focus-within:text-accent transition-colors" />
                                            <select
                                                className={`${inputStyle} appearance-none cursor-pointer`}
                                                value={formData.bloodGroup}
                                                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                                            >
                                                <option value="Unknown" className="bg-background text-foreground">Select Blood Type</option>
                                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                                    <option key={bg} value={bg} className="bg-background text-foreground">{bg}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--fg-muted)' }}>Service Residence Hub</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="City / Primary Area"
                                                className={inputStyle}
                                                value={formData.homeAddress}
                                                onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 space-y-3">
                                        <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--fg-muted)' }}>Critical Medical Narrative</label>
                                        <div className="relative group">
                                            <Activity className="absolute left-6 top-6 w-4 h-4 text-foreground/40 group-focus-within:text-primary transition-colors" />
                                            <textarea
                                                placeholder="Allergies, chronic conditions, medications..."
                                                className={`${inputStyle} h-32 resize-none py-6 leading-relaxed`}
                                                value={formData.medicalConditions}
                                                onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-liquid w-full py-6 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[11px] text-white flex items-center justify-center gap-4 transition-all active:scale-[0.98] group mt-8 shadow-2xl shadow-primary/30"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            INITIALIZING INTERFACE...
                                        </>
                                    ) : (
                                        <>
                                            AUTHORIZE DEPLOYMENT
                                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-2 transition-transform">
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-14 pt-10 border-t border-white/10 text-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50">
                                    Identity already verified?{' '}
                                    <Link href="/login" className="text-primary font-black uppercase tracking-widest text-[10px] ml-2 hover:opacity-80 transition-opacity">
                                        Access Secure Node →
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </TiltCard>
                </motion.div>
            </div>
        </main>
    );
}
