'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Mail, Lock, LogIn, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
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
        } catch (error) {
            toast.error('Network Anomaly Detected');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl opacity-50" />

            <div className="w-full max-w-xl relative">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white p-8 md:p-16 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-indigo-100/50"
                >
                    <div className="flex flex-col items-center mb-12">
                        <div className="p-4 bg-primary rounded-2xl shadow-xl shadow-indigo-200 mb-6">
                            <ShieldCheck className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">ACCESS NODE</h1>
                        <p className="text-slate-400 font-medium text-sm">Secure biometric link required for deployment</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Digital Identity (Email)</label>
                                <div className="relative group">
                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        placeholder="user@hersecure.app"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-16 pr-6 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Security Key (Password)</label>
                                <div className="relative group">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-16 pr-6 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 shadow-2xl shadow-slate-200 hover:bg-primary transition-all active:scale-[0.98] group"
                        >
                            {loading ? 'SYNCING...' : 'INITIATE LOGIN'}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </button>
                    </form>

                    <div className="mt-12 text-center text-slate-400 text-sm font-medium">
                        New deployment?{' '}
                        <Link href="/register" className="text-primary font-black uppercase tracking-widest text-[10px] ml-2 hover:underline">
                            Request Access
                        </Link>
                    </div>
                </motion.div>

                <p className="mt-8 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.4em]">
                    Encrypted Protocol v4.0.2
                </p>
            </div>
        </div>
    );
}
