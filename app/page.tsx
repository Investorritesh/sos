'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  AlertTriangle, MapPin, Phone, ShieldAlert, Shield,
  Navigation, LayoutDashboard, ShieldCheck, Mic, Wifi,
  Activity, Link2, Cpu, Radio, Zap, ChevronRight
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { toast } from 'react-hot-toast';
import { AIChat } from '@/components/AIChat';
import Link from 'next/link';
import { useAlarm } from '@/hooks/useAlarm';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

import { ParticleCanvas } from '@/components/ParticleCanvas';
import { TiltCard } from '@/components/TiltCard';

/* ─── SOS 3D Orb ─── */
function SOSOrb({
  isActive, countdown, onActivate, onDeactivate
}: {
  isActive: boolean; countdown: number; onActivate: () => void; onDeactivate: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressedState] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rX = useSpring(useTransform(y, [-100, 100], [15, -15]), { stiffness: 200, damping: 20 });
  const rY = useSpring(useTransform(x, [-100, 100], [-15, 15]), { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleStart = (e?: React.MouseEvent | React.TouchEvent) => {
    if (isActive) return;
    if (e) {
      if ('button' in e && e.button !== 0) return;
    }
    
    setPressedState(true);
    // Haptic feedback for iOS
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(100);
    }
    onActivate();
  };

  const handleEnd = () => {
    setPressedState(false);
  };

  return (
    <div className="flex flex-col items-center">
      <div style={{ perspective: '1000px' }}>
        <AnimatePresence>
          {isActive && (
            <>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-accent/40"
                  style={{ margin: -20 }}
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.65, ease: 'easeOut' }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { x.set(0); y.set(0); setHovered(false); handleEnd(); }}
          onMouseEnter={() => setHovered(true)}
          onMouseDown={handleStart}
          onMouseUp={handleEnd}
          onTouchStart={(e) => { e.preventDefault(); handleStart(e); }}
          onTouchEnd={(e) => { e.preventDefault(); handleEnd(); }}
          onClick={() => {
            if (isActive) onDeactivate();
          }}
          style={{ rotateX: rX, rotateY: rY, transformStyle: 'preserve-3d' }}
          animate={{
            scale: pressed ? 0.94 : isActive ? [1, 1.04, 1] : hovered ? 1.05 : 1,
          }}
          transition={{ scale: { repeat: isActive ? Infinity : 0, duration: 2 } }}
          className="relative cursor-pointer"
        >
          <div
            className={`orb-sphere ${isActive ? 'orb-active' : ''}`}
            style={{
              background: isActive
                ? `radial-gradient(circle at 38% 32%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.05) 30%, rgba(244,63,94,0.35) 65%, rgba(220,38,38,0.55) 100%)`
                : undefined,
            }}
          >
            {/* Inner core glow */}
            <div className="absolute inset-8 rounded-full flex flex-col items-center justify-center gap-3"
              style={{ background: isActive ? 'radial-gradient(circle, rgba(244,63,94,0.3) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)' }}>
              <motion.div
                animate={{ scale: isActive ? [1, 1.2, 1] : 1 }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <ShieldAlert className={`w-14 h-14 drop-shadow-lg ${isActive ? 'text-accent' : 'text-primary'}`} />
              </motion.div>
              <div className="text-center">
                <span className={`block text-2xl font-bold tracking-widest ${isActive ? 'text-accent' : 'text-white'}`} style={{ textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
                  {countdown > 0 ? countdown : isActive ? 'ACTIVE' : 'SOS'}
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-[0.25em] ${isActive ? 'text-accent/70' : 'text-white/60'}`}>
                  {isActive ? 'Tap to Disarm' : countdown > 0 ? 'Activating...' : 'Hold to Trigger'}
                </span>
              </div>
            </div>
          </div>

          {/* Ripple rings when idle */}
          {!isActive && (
            <>
              <div className="orb-ripple" />
              <div className="orb-ripple" />
            </>
          )}
        </motion.div>
      </div>

      {/* Ground shadow */}
      <div className="orb-shadow" />
    </div>
  );
}

/* ─── Dashboard Card ─── */
const DASHBOARD_CARDS = [
  { title: 'Live Tracking', desc: 'Encrypted real-time GPS', icon: Navigation, color: 'from-indigo-500 to-violet-600', href: '/map', status: 'Online' },
  { title: 'AI Threat Scanner', desc: 'Neural threat analysis', icon: Cpu, color: 'from-violet-500 to-purple-600', href: '/threat-scanner', status: 'Scanning' },
  { title: 'Safe Route AI', desc: 'Optimal path intelligence', icon: Shield, color: 'from-blue-500 to-indigo-600', href: '/safe-route', status: 'Ready' },
  { title: 'Guardian Network', desc: 'Trusted contacts circle', icon: Phone, color: 'from-emerald-500 to-teal-600', href: '/contacts', status: 'Active' },
  { title: 'Evidence Log', desc: 'Blockchain incident records', icon: Activity, color: 'from-amber-500 to-orange-600', href: '/incident', status: 'Secured' },
  { title: 'Secure Link', desc: 'Encrypted communication', icon: Link2, color: 'from-rose-500 to-pink-600', href: '/secure-link', status: 'Encrypted' },
];

function DashCard({ card }: { card: typeof DASHBOARD_CARDS[0] }) {
  const Icon = card.icon;
  return (
    <Link href={card.href}>
      <TiltCard className="p-8 h-full group cursor-pointer">
        <div className="card-content flex flex-col h-full gap-5">
          <div className="flex items-start justify-between">
            <div
              className={`icon-glow p-4 rounded-2xl bg-gradient-to-br ${card.color}`}
              style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest"
              style={{ background: 'rgba(var(--primary-rgb),0.08)', color: 'var(--primary)', border: '1px solid rgba(var(--primary-rgb),0.15)' }}>
              <span className="status-dot" />
              {card.status}
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-end gap-1">
            <h3 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>{card.title}</h3>
            <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>{card.desc}</p>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-semibold" style={{ color: 'var(--primary)' }}>
            Open Module
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </TiltCard>
    </Link>
  );
}

/* ─── AI Holographic Section ─── */
function AISection() {
  return (
    <TiltCard className="p-12 relative overflow-hidden">
      <div className="card-content">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Holographic Shield */}
          <div className="relative flex-shrink-0 w-48 h-48 flex items-center justify-center">
            {/* Safety radius rings */}
            {[1.2, 1.5, 1.85].map((scale, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border opacity-20"
                style={{ borderColor: 'var(--primary)', transform: `scale(${scale})` }}
                animate={{ scale: [scale, scale * 1.06, scale], opacity: [0.2, 0.08, 0.2] }}
                transition={{ repeat: Infinity, duration: 3, delay: i * 0.7, ease: 'easeInOut' }}
              />
            ))}

            {/* Rotating wireframe globe layer */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, transparent, rgba(var(--primary-rgb),0.15), transparent)',
                border: '1px solid rgba(var(--primary-rgb),0.15)'
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            />

            {/* Core shield */}
            <motion.div
              animate={{ rotateY: [0, 20, 0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <ShieldCheck
                className="w-24 h-24"
                style={{
                  color: 'var(--primary)',
                  filter: 'drop-shadow(0 0 20px rgba(var(--primary-rgb),0.8))',
                }}
              />
            </motion.div>

            {/* Particle orbit dots */}
            {[0, 60, 120, 180, 240, 300].map((deg, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  background: 'var(--primary)',
                  boxShadow: '0 0 6px rgba(var(--primary-rgb),0.8)',
                  top: '50%',
                  left: '50%',
                }}
                animate={{
                  x: Math.cos((deg * Math.PI) / 180) * 90 * [1, -1, 1][i % 3],
                  y: Math.sin((deg * Math.PI) / 180) * 90,
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
              />
            ))}
          </div>

          {/* Text + features */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
                style={{ background: 'rgba(var(--primary-rgb),0.1)', color: 'var(--primary)', border: '1px solid rgba(var(--primary-rgb),0.2)' }}>
                <Zap className="inline w-3 h-3 mr-1.5" /> Powered by AI
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--fg)' }}>
              Predictive Security <span className="text-gradient">Intelligence</span>
            </h2>
            <p className="mb-8" style={{ color: 'var(--fg-muted)', fontSize: '15px', lineHeight: '1.7' }}>
              Neural threat detection learns and adapts in real-time, providing military-grade situational awareness across your personal safety perimeter.
            </p>

            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: MapPin, label: 'Zone Threat Analysis', value: '99.2%' },
                { icon: Mic, label: 'Voice Guard Active', value: 'Armed' },
                { icon: Radio, label: 'Signal Broadcast Range', value: '5km' },
                { icon: Wifi, label: 'Network Reliability', value: '7-Sigma' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="p-3 rounded-xl flex-shrink-0"
                    style={{ background: 'rgba(var(--primary-rgb),0.08)', border: '1px solid rgba(var(--primary-rgb),0.12)' }}>
                    <Icon className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <div className="text-xs font-medium" style={{ color: 'var(--fg-muted)' }}>{label}</div>
                    <div className="text-sm font-bold" style={{ color: 'var(--fg)' }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </TiltCard>
  );
}

/* ─── Status Bar ─── */
function StatusBar({ batteryLevel, shakeEnabled, onShakeToggle }: { batteryLevel: number | null; shakeEnabled: boolean; onShakeToggle: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center mb-20"
    >
      <div
        className="flex items-center gap-6 px-8 py-3 rounded-full"
        style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)', boxShadow: 'var(--shadow-card)' }}
      >
        {/* Signal */}
        <div className="flex items-center gap-2.5">
          <div className="flex gap-0.5 items-end h-3.5">
            {[3, 5, 7, 9, 11].map((h, i) => (
              <div key={i} className="w-0.5 rounded-full transition-all"
                style={{ height: `${h}px`, background: i < 4 ? 'var(--primary)' : 'rgba(var(--fg-muted))' }} />
            ))}
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Secured</span>
        </div>

        <div style={{ width: '1px', height: '16px', background: 'var(--glass-border)' }} />

        {/* Battery */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center gap-0.5">
            <div className="w-7 h-3.5 rounded border" style={{ borderColor: batteryLevel !== null && batteryLevel < 20 ? 'var(--accent)' : 'rgba(var(--fg-muted))', padding: '2px' }}>
              <div className="h-full rounded-sm transition-all duration-1000"
                style={{ width: `${batteryLevel ?? 100}%`, background: batteryLevel !== null && batteryLevel < 20 ? 'var(--accent)' : '#22c55e' }} />
            </div>
            <div className="w-0.5 h-2 rounded-r" style={{ background: 'rgba(var(--fg-muted))' }} />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>
            {batteryLevel !== null ? `${batteryLevel}%` : '100%'}
          </span>
        </div>

        <div style={{ width: '1px', height: '16px', background: 'var(--glass-border)' }} />

        {/* Shake toggle */}
        <button onClick={onShakeToggle} className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-5 rounded-full transition-all duration-300 cursor-pointer"
            style={{ background: shakeEnabled ? 'var(--primary)' : 'rgba(var(--fg-muted), 0.2)', boxShadow: shakeEnabled ? '0 0 12px rgba(var(--primary-rgb),0.4)' : 'none' }}>
            <motion.div
              animate={{ x: shakeEnabled ? 16 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md"
            />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>
            Shake {shakeEnabled ? 'On' : 'Off'}
          </span>
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════════════ */
export default function Home() {
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [activeSOSId, setActiveSOSId] = useState<string | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const { startAlarm, stopAlarm } = useAlarm();
  const { startRecording, stopRecording } = useAudioRecorder();
  const [shakeEnabled, setShakeEnabled] = useState(false);
  const lastShake = useRef(0);

  useEffect(() => {
    isSOSActive ? (startAlarm(), startRecording()) : (stopAlarm(), stopRecording());
  }, [isSOSActive, startAlarm, stopAlarm, startRecording, stopRecording]);

  useEffect(() => {
    if ('getBattery' in (navigator as any)) {
      (navigator as any).getBattery().then((bat: any) => {
        setBatteryLevel(Math.round(bat.level * 100));
        bat.addEventListener('levelchange', () => setBatteryLevel(Math.round(bat.level * 100)));
      });
    }
    fetch('/api/sos').then(r => r.json()).then(d => {
      if (d?._id) { setIsSOSActive(true); setActiveSOSId(d._id); }
    }).catch(() => { });
  }, []);

  const startEmergency = useCallback(async () => {
    // 1. Immediate Visual & Audio Feedback
    startAlarm();
    setIsSOSActive(true);

    // 2. Background Geolocation & Server Sync
    let location = { lat: 0, lng: 0, address: 'Live Coordinates' };
    const geo = () => new Promise<void>(resolve => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(pos => {
          location = { lat: pos.coords.latitude, lng: pos.coords.longitude, address: 'Live Coordinates' };
          resolve();
        }, () => resolve());
      } else resolve();
    });

    geo().then(async () => {
      try {
        const res = await fetch('/api/sos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location, triggerType: 'Manual', batteryLevel }),
        });
        if (res.ok) {
          const data = await res.json();
          setActiveSOSId(data._id);
          toast.error('🚨 EMERGENCY SIGNAL SENT!', { duration: 6000 });
        }
      } catch {
        toast.error('🚨 Local Alarm Active');
      }
    });
  }, [batteryLevel, startAlarm]);

  const handleActivate = useCallback(() => {
    startEmergency();
  }, [startEmergency]);

  const handleDeactivate = useCallback(async () => {
    stopAlarm();
    setIsSOSActive(false);
    if (!activeSOSId) { toast.success('SOS Deactivated'); return; }
    try {
      await fetch('/api/sos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeSOSId }),
      });
      setActiveSOSId(null);
      toast.success('SOS Deactivated');
    } catch {
      setActiveSOSId(null);
      toast.success('SOS Deactivated (Offline)');
    }
  }, [activeSOSId, stopAlarm]);

  const handleMotion = useCallback((e: DeviceMotionEvent) => {
    if (!shakeEnabled || isSOSActive) return;
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;
    const d = Math.sqrt((acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2);
    if (d > 15) {
      const now = Date.now();
      if (now - lastShake.current > 2000) { lastShake.current = now; handleActivate(); }
    }
  }, [shakeEnabled, isSOSActive, handleActivate]);

  useEffect(() => {
    window.addEventListener('devicemotion', handleMotion as any);
    return () => window.removeEventListener('devicemotion', handleMotion as any);
  }, [handleMotion]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 22 } },
  };

  return (
    <main className="relative min-h-screen pb-32 overflow-hidden">
      {/* Particle layer */}
      <ParticleCanvas />

      <Navbar pollingFrequency={5000} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 pt-24 md:pt-32"
      >
        {/* Status Bar */}
        <motion.div variants={itemVariants}>
          <StatusBar
            batteryLevel={batteryLevel}
            shakeEnabled={shakeEnabled}
            onShakeToggle={() => {
              setShakeEnabled(v => !v);
              toast.success(!shakeEnabled ? 'Shake Guard Armed 🛡️' : 'Shake Guard Disarmed');
            }}
          />
        </motion.div>

        {/* Hero Typography */}
        <motion.div variants={itemVariants} className="text-center mb-28">
          <motion.div
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 text-[10px] font-bold uppercase tracking-widest"
            style={{ background: 'rgba(var(--primary-rgb),0.08)', border: '1px solid rgba(var(--primary-rgb),0.15)', color: 'var(--primary)' }}
          >
            <span className="status-dot" />
            Protection System Online
          </motion.div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight mb-6 leading-[0.95]"
            style={{ color: 'var(--fg)', letterSpacing: '-0.03em' }}>
            Total Safety.
          </h1>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight mb-8 leading-[0.95]"
            style={{ letterSpacing: '-0.03em' }}>
            <span className="text-gradient">Intelligently Armored.</span>
          </h1>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto font-light leading-relaxed"
            style={{ color: 'var(--fg-muted)' }}>
            Military-grade AI protection, woven seamlessly into your everyday life.
          </p>
        </motion.div>

        {/* SOS Orb */}
        <motion.div variants={itemVariants} className="flex flex-col items-center mb-32">
          <SOSOrb
            isActive={isSOSActive}
            countdown={0}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
          />
          <motion.p
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="mt-8 text-[11px] font-bold uppercase tracking-[0.3em]"
            style={{ color: 'var(--fg-muted)' }}
          >
            {isSOSActive ? 'Signal broadcasting — tap orb to disarm' : 'Hold orb to trigger — instant activation'}
          </motion.p>
        </motion.div>

        {/* Dashboard Grid */}
        <motion.div variants={itemVariants} className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>Security Modules</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full"
              style={{ background: 'rgba(var(--primary-rgb),0.08)', color: 'var(--primary)', border: '1px solid rgba(var(--primary-rgb),0.12)' }}>
              6 Active
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" style={{ perspective: '1200px' }}>
            {DASHBOARD_CARDS.map((card, i) => (
              <motion.div
                key={card.title}
                variants={itemVariants}
                custom={i}
              >
                <DashCard card={card} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AI Holographic Section */}
        <motion.div variants={itemVariants} className="mb-16" style={{ perspective: '1200px' }}>
          <AISection />
        </motion.div>

        {/* Bottom CTA strip */}
        <motion.div variants={itemVariants}>
          <div className="glass-card p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, rgba(var(--primary-rgb),0.04) 0%, transparent 60%)' }} />
            <div className="relative card-content">
              <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--fg)' }}>Ready to expand your Guardian Network?</h3>
              <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>Add trusted contacts who can receive your SOS alerts in seconds.</p>
            </div>
            <Link href="/contacts" className="btn-liquid rounded-2xl px-8 py-4 text-sm font-semibold flex items-center gap-2 flex-shrink-0 relative card-content">
              Manage Contacts <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </motion.div>

      <AIChat />
    </main>
  );
}
