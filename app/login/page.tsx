'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ParticleCanvas } from '@/components/ParticleCanvas';
import { TiltCard } from '@/components/TiltCard';

export default function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await signIn('credentials', {
                redirect: false,
                email: formData.email,
                password: formData.password,
            });
            if (res?.ok) {
                toast.success('Biometric Authorization Success');
                router.push('/');
                router.refresh();
            } else {
                toast.error(res?.error || 'Authentication Denied');
            }
        } catch {
            toast.error('Network Anomaly Detected');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        background: 'rgba(var(--primary-rgb),0.04)',
        border: '1px solid var(--glass-border)',
        color: 'var(--fg)',
    } as React.CSSProperties;

    const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.currentTarget.style.borderColor = 'rgba(var(--primary-rgb),0.4)';
        e.currentTarget.style.background = 'rgba(var(--primary-rgb),0.1)';
        e.currentTarget.style.boxShadow = '0 0 20px rgba(var(--primary-rgb),0.15)';
    };
    const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
        e.currentTarget.style.background = 'rgba(var(--primary-rgb),0.05)';
        e.currentTarget.style.boxShadow = 'none';
    };

    return (
        <main className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
            <ParticleCanvas />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg relative z-10"
            >
                {/* Background Glows */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

                <TiltCard className="p-10 md:p-14 relative overflow-hidden">
                    {/* Top light line */}
                    <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(var(--primary-rgb),0.5), transparent)' }} />

                    <div className="card-content">
                        {/* Header */}
                        <div className="flex flex-col items-center mb-12 text-center">
                            <motion.div
                                animate={{
                                    rotateY: [0, 360],
                                    filter: ['drop-shadow(0 0 15px rgba(var(--primary-rgb),0.4))', 'drop-shadow(0 0 35px rgba(var(--primary-rgb),0.8))', 'drop-shadow(0 0 15px rgba(var(--primary-rgb),0.4))']
                                }}
                                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                                className="mb-6 p-5 rounded-3xl bg-primary/10 border border-primary/20 backdrop-blur-2xl shadow-2xl"
                            >
                                <ShieldCheck className="w-12 h-12 text-primary" />
                            </motion.div>

                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] bg-primary/10 text-primary border border-primary/20 flex items-center shadow-lg shadow-primary/20">
                                    <Cpu className="w-3.5 h-3.5 mr-2 animate-pulse" /> Encrypted Terminal
                                </span>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-3 uppercase text-foreground leading-none">
                                Access <span className="text-primary drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]">Node</span>
                            </h1>
                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground/40">
                                Secure identity verification required
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] ml-2 text-foreground/50">Digital Identity</label>
                                <div className="relative group">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors text-foreground/30 group-focus-within:text-primary" />
                                    <input
                                        type="email"
                                        placeholder="user@hersecure.app"
                                        className="w-full py-5 pl-14 pr-6 rounded-[2rem] outline-none text-sm font-bold transition-all backdrop-blur-xl bg-primary/5 border border-white/10 text-foreground placeholder:text-foreground/20"
                                        onFocus={inputFocus}
                                        onBlur={inputBlur}
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] ml-2 text-foreground/50">Security Key</label>
                                <div className="relative group">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors text-foreground/30 group-focus-within:text-primary" />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full py-5 pl-14 pr-6 rounded-[2rem] outline-none text-sm font-bold transition-all backdrop-blur-xl bg-primary/5 border border-white/10 text-foreground placeholder:text-foreground/20"
                                        onFocus={inputFocus}
                                        onBlur={inputBlur}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-liquid w-full py-6 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[11px] text-white flex items-center justify-center gap-4 mt-6 group shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        AUTHENTICATING...
                                    </>
                                ) : (
                                    <>
                                        INITIATE ACCESS
                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-2 transition-transform">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-12 pt-8 border-t border-white/10 text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50">
                                New deployment?{' '}
                                <Link href="/register" className="font-bold text-primary hover:opacity-80 transition-opacity">
                                    Request Access Protocol →
                                </Link>
                            </p>
                        </div>
                    </div>
                </TiltCard>
            </motion.div>
        </main>
    );
}
