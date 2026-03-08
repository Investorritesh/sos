'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
    ShieldCheck, LogOut, LayoutDashboard, MapPin, Shield,
    Sun, Moon, AlertCircle, Menu, X, Fingerprint, Activity
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAlarm } from '@/hooks/useAlarm';
import { useTheme } from '@/components/ThemeProvider';

const NAV_LINKS = [
    { href: '/', label: 'Operations', icon: LayoutDashboard },
    { href: '/map', label: 'Tactical Map', icon: MapPin },
    { href: '/safe-route', label: 'Safe Path', icon: Shield },
];

function MagneticLink({ href, label, icon: Icon, hasActiveSignal }: { href: string, label: string, icon: any, hasActiveSignal?: boolean }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const ref = useRef<HTMLAnchorElement>(null);

    const springConfig = { damping: 15, stiffness: 150 };
    const x = useSpring(mouseX, springConfig);
    const y = useSpring(mouseY, springConfig);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        mouseX.set((e.clientX - centerX) * 0.35);
        mouseY.set((e.clientY - centerY) * 0.35);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    return (
        <motion.div style={{ x, y }}>
            <Link
                ref={ref}
                href={href}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="group relative flex items-center gap-2.5 px-6 py-2.5 rounded-full transition-all duration-300"
            >
                <motion.div className="absolute inset-0 rounded-full bg-primary/0 group-hover:bg-primary/5 transition-colors border border-transparent group-hover:border-primary/10 shadow-none group-hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.05)]" />
                <Icon className="w-4 h-4 text-foreground/40 group-hover:text-primary transition-colors relative z-10" />
                <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-foreground/50 group-hover:text-foreground transition-colors relative z-10">
                    {label}
                </span>
                {hasActiveSignal && href === '/map' && (
                    <AlertCircle className="w-3 h-3 text-accent animate-pulse relative z-10" />
                )}
            </Link>
        </motion.div>
    );
}

export const Navbar = ({ pollingFrequency = 10000 }: { pollingFrequency?: number }) => {
    const { data: session } = useSession();
    const { theme, toggleTheme } = useTheme();
    const [hasActiveSignal, setHasActiveSignal] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { startAlarm, stopAlarm } = useAlarm();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!session) return;
        const check = async () => {
            try {
                const res = await fetch('/api/sos/received');
                if (!res.ok) return;
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    if (!hasActiveSignal) {
                        startAlarm();
                        toast.error(`CRITICAL: ${data[0].userId.name} TRANSMITTING SOS`, {
                            duration: 10000,
                            icon: '🚨',
                            className: 'font-bold uppercase tracking-widest text-[10px]'
                        });
                    }
                    setHasActiveSignal(true);
                } else {
                    if (hasActiveSignal) stopAlarm();
                    setHasActiveSignal(false);
                }
            } catch { /* silent */ }
        };
        check();
        const interval = setInterval(check, pollingFrequency);
        return () => { clearInterval(interval); stopAlarm(); };
    }, [session, hasActiveSignal, startAlarm, stopAlarm, pollingFrequency]);

    return (
        <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-3rem)] max-w-6xl">
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
                className={`glass-card rounded-full p-2.5 flex items-center justify-between border-white/20 transition-all duration-500 ${scrolled ? 'bg-background/80 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.1)]' : 'bg-transparent'}`}
            >
                {/* Logo Section */}
                <Link href="/" className="flex items-center gap-4 ml-2 group relative">
                    <motion.div
                        animate={{ scale: hasActiveSignal ? [1, 1.1, 1] : 1 }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className={`relative p-2.5 rounded-2xl transition-all duration-500 border ${hasActiveSignal ? 'bg-accent/10 border-accent/30 shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)]' : 'bg-primary/10 border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]'}`}
                    >
                        <ShieldCheck
                            className={`w-5 h-5 transition-colors ${hasActiveSignal ? 'text-accent' : 'text-primary'}`}
                            style={{ filter: `drop-shadow(0 0 8px ${hasActiveSignal ? 'rgba(var(--accent-rgb),0.5)' : 'rgba(var(--primary-rgb),0.5)'})` }}
                        />
                        <motion.div
                            className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
                        >
                            <div className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg]" />
                        </motion.div>
                    </motion.div>
                    <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-foreground leading-none">HerSecure</span>
                        <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-foreground/30 mt-1">Advanced AI Defense</span>
                    </div>
                </Link>

                {/* Desktop Nav - Magnetic Links */}
                <div className="hidden lg:flex items-center gap-2 bg-primary/5 rounded-full px-2 py-1 border border-white/5 backdrop-blur-md">
                    {NAV_LINKS.map((link) => (
                        <MagneticLink key={link.href} {...link} hasActiveSignal={hasActiveSignal} />
                    ))}
                    {session && (
                        <Link href="/profile" className="flex items-center gap-2.5 px-6 py-2.5 rounded-full text-[11px] font-bold tracking-[0.1em] uppercase text-foreground/50 hover:text-foreground transition-all">
                            Profile
                        </Link>
                    )}
                </div>

                {/* Tactical Status & Actions */}
                <div className="flex items-center gap-3">
                    <div className="hidden xl:flex items-center gap-4 bg-primary/5 border border-white/10 px-6 py-2.5 rounded-full backdrop-blur-xl">
                        <div className="flex items-center gap-2">
                            <Fingerprint className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-primary/60">Node Secure</span>
                        </div>
                        <div className="w-px h-3 bg-white/10" />
                        <div className="flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/60">Live Sync</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleTheme}
                            className="p-3 rounded-full bg-primary/5 border border-white/10 text-foreground/40 hover:text-primary transition-all backdrop-blur-md"
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </motion.button>

                        {session ? (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => signOut()}
                                className="p-3 rounded-full bg-primary/10 border border-primary/20 text-foreground/40 hover:text-accent transition-all backdrop-blur-md"
                            >
                                <LogOut className="w-4 h-4" />
                            </motion.button>
                        ) : (
                            <Link href="/register" className="btn-liquid rounded-full px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl relative overflow-hidden group">
                                <span className="relative z-10">Access Node</span>
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                        )}

                        <button
                            onClick={() => setMobileOpen(v => !v)}
                            className="p-3 rounded-full lg:hidden bg-primary/5 border border-white/10 text-foreground"
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Tactical Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 12, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 right-0 glass-card rounded-[2.5rem] p-8 space-y-4 border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.3)]"
                    >
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-5 p-5 bg-primary/5 rounded-3xl border border-white/5 hover:bg-primary/10 transition-all group"
                            >
                                <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                                    <link.icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-foreground">{link.label}</span>
                                    <span className="text-[10px] font-bold text-foreground/30 mt-1">Execute Protocol</span>
                                </div>
                            </Link>
                        ))}

                        <div className="h-px bg-white/5 my-4" />

                        {session ? (
                            <button
                                onClick={() => signOut()}
                                className="w-full flex items-center gap-5 p-5 bg-accent/5 rounded-3xl border border-accent/20 hover:bg-accent/10 transition-all text-accent group"
                            >
                                <div className="p-3 rounded-2xl bg-accent/10">
                                    <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-[0.2em]">Deauthorize Node</span>
                            </button>
                        ) : (
                            <Link href="/register" onClick={() => setMobileOpen(false)}
                                className="btn-liquid flex items-center justify-center rounded-[1.5rem] py-5 font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl">
                                Initialize Bio-Link
                            </Link>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};
