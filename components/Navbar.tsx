'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Shield, LogOut, User, LayoutDashboard, ShieldCheck, AlertCircle, Menu, X as CloseIcon, MapPin, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAlarm } from '@/hooks/useAlarm';

export const Navbar = ({ pollingFrequency = 10000 }: { pollingFrequency?: number }) => {
    const { data: session } = useSession();
    const [hasActiveSignal, setHasActiveSignal] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { startAlarm, stopAlarm } = useAlarm();

    useEffect(() => {
        if (!session) return;

        const checkSignals = async () => {
            try {
                const res = await fetch('/api/sos/received');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        if (!hasActiveSignal) {
                            startAlarm();
                            toast.error(`EMERGENCY: ${data[0].userId.name} needs help!`, {
                                duration: 10000,
                                icon: '🚨',
                            });
                        }
                        setHasActiveSignal(true);
                    } else {
                        if (hasActiveSignal) stopAlarm();
                        setHasActiveSignal(false);
                    }
                }
            } catch (error) {
                console.error('Signal check failed', error);
            }
        };

        checkSignals();
        const interval = setInterval(checkSignals, pollingFrequency);

        return () => {
            clearInterval(interval);
            stopAlarm();
        };
    }, [session, hasActiveSignal, startAlarm, stopAlarm]);

    return (
        <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-4">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white/80 backdrop-blur-2xl border border-slate-100 rounded-[2rem] px-8 py-4 flex justify-between items-center shadow-2xl shadow-slate-200/50 ring-1 ring-black/[0.02]">
                    <Link href="/" className="flex items-center gap-3 group text-slate-900 hover:text-primary transition-colors">
                        <div className="relative">
                            <div className={`p-2.5 rounded-xl shadow-lg transition-transform group-hover:scale-110 ${hasActiveSignal ? 'bg-red-500 animate-pulse' : 'bg-primary'}`}>
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${hasActiveSignal ? 'bg-white' : 'bg-red-500 animate-pulse'}`} />
                        </div>
                        <div>
                            <span className="text-xl font-black tracking-tighter block leading-none">HERSECURE</span>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 block mt-1">Safety Network</span>
                        </div>
                    </Link>

                    <div className="hidden md:flex items-center gap-10">
                        <NavLink href="/" icon={<LayoutDashboard className="w-4 h-4" />} label="Monitor" />
                        <NavLink
                            href="/map"
                            icon={hasActiveSignal ? <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" /> : <Shield className="w-4 h-4" />}
                            label="Security Map"
                            isAlert={hasActiveSignal}
                        />
                        {session && (
                            <NavLink href="/profile" icon={<User className="w-4 h-4" />} label="Deployment" />
                        )}
                        {(session?.user as any)?.role === 'admin' && (
                            <NavLink href="/admin" icon={<Shield className="w-4 h-4 text-primary" />} label="Command Center" />
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-6 pl-6 border-l border-slate-100 hidden sm:flex">
                            {session ? (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => signOut()}
                                    className="flex items-center gap-3 bg-slate-50 hover:bg-red-50 hover:text-red-500 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-500 border border-slate-100 shadow-sm"
                                >
                                    <LogOut className="w-4 h-4" /> Sign Off
                                </motion.button>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">SignIn</Link>
                                    <Link
                                        href="/register"
                                        className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-slate-200 active:scale-95"
                                    >
                                        Join Net
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 md:hidden"
                        >
                            {isMobileMenuOpen ? <CloseIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 top-0 left-0 w-full h-screen bg-white/95 backdrop-blur-3xl z-[90] flex flex-col pt-32 px-10 md:hidden"
                    >
                        <div className="flex flex-col gap-8">
                            <MobileNavLink href="/" icon={<LayoutDashboard className="w-6 h-6" />} label="Monitor" onClick={() => setIsMobileMenuOpen(false)} />
                            <MobileNavLink href="/map" icon={<MapPin className="w-6 h-6" />} label="Security Map" onClick={() => setIsMobileMenuOpen(false)} />
                            {session && (
                                <MobileNavLink href="/profile" icon={<User className="w-6 h-6" />} label="Profile Hub" onClick={() => setIsMobileMenuOpen(false)} />
                            )}
                            {(session?.user as any)?.role === 'admin' && (
                                <MobileNavLink href="/admin" icon={<Shield className="w-6 h-6" />} label="Command Center" onClick={() => setIsMobileMenuOpen(false)} />
                            )}

                            <hr className="border-slate-100 my-4" />

                            {session ? (
                                <button
                                    onClick={() => signOut()}
                                    className="flex items-center gap-4 text-red-500 font-black uppercase tracking-widest text-sm"
                                >
                                    <LogOut className="w-6 h-6" /> Deauthorize Session
                                </button>
                            ) : (
                                <div className="flex flex-col gap-6">
                                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-4">
                                        <div className="w-2 h-2 bg-primary rounded-full" /> Access Account
                                    </Link>
                                    <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="bg-slate-900 text-white p-5 rounded-3xl text-center text-xs font-black uppercase tracking-[0.2em]">
                                        Create New Identity
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="mt-auto pb-12 text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">HerSecure Platform v4.0.2</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

function NavLink({ href, label, icon, isAlert }: { href: string; label: string; icon: React.ReactNode; isAlert?: boolean }) {
    return (
        <Link href={href} className="flex items-center gap-2 group">
            <div className={`transition-colors ${isAlert ? 'text-red-500' : 'text-slate-300 group-hover:text-primary'}`}>
                {icon}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isAlert ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-900'}`}>
                {label}
            </span>
        </Link>
    );
}
function MobileNavLink({ href, label, icon, onClick }: { href: string; label: string; icon: React.ReactNode; onClick: () => void }) {
    return (
        <Link href={href} onClick={onClick} className="flex items-center gap-5 group">
            <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                {icon}
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight group-hover:text-primary transition-all">
                {label}
            </span>
        </Link>
    );
}
