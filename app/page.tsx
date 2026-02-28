'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  MapPin,
  Phone,
  ShieldAlert,
  Shield,
  Settings,
  MessageSquare,
  Navigation,
  LayoutDashboard,
  User
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { toast } from 'react-hot-toast';
import { AIChat } from '@/components/AIChat';
import Link from 'next/link';
import { useAlarm } from '@/hooks/useAlarm';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { Mic, MicOff } from 'lucide-react';

export default function Home() {
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [activeSOSId, setActiveSOSId] = useState<string | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const { startAlarm, stopAlarm } = useAlarm();
  const { startRecording, stopRecording, isRecording } = useAudioRecorder();
  const [shakeEnabled, setShakeEnabled] = useState(false);
  const lastShake = useRef(0);

  useEffect(() => {
    if (isSOSActive) {
      startAlarm();
      startRecording();
    } else {
      stopAlarm();
      stopRecording();
    }
  }, [isSOSActive, startAlarm, stopAlarm, startRecording, stopRecording]);


  useEffect(() => {
    // Battery Status API
    if ('getBattery' in (navigator as any)) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }

    // Check if there's an active SOS on mount
    fetch('/api/sos')
      .then(res => res.json())
      .then(data => {
        if (data?._id) {
          setIsSOSActive(true);
          setActiveSOSId(data._id);
        }
      });
  }, []);

  const handleSOS = useCallback(async () => {
    if (isSOSActive) {
      // Stop alarm immediately with suppression
      stopAlarm(10000);
      setIsSOSActive(false);

      // If we don't have a server-side SOS ID, just deactivate locally
      if (!activeSOSId) {
        toast.success('SOS DEACTIVATED');
        return;
      }

      try {
        const res = await fetch('/api/sos', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: activeSOSId }),
        });
        if (res.ok) {
          setActiveSOSId(null);
          toast.success('SOS DEACTIVATED');
        } else {
          // Server failed but we already stopped locally — just clear the ID
          setActiveSOSId(null);
          toast.success('SOS DEACTIVATED (Local)');
        }
      } catch (error) {
        // Network error — still deactivated locally
        setActiveSOSId(null);
        toast.success('SOS DEACTIVATED (Offline)');
      }
    } else {
      // Prevent activating during countdown
      if (countdown > 0) return;
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            startEmergency();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [isSOSActive, activeSOSId, countdown, stopAlarm, startAlarm]);

  const startEmergency = async () => {
    let location = { lat: 0, lng: 0, address: 'Live Coordinates' };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude, address: 'Live Coordinates' };
        await triggerSOS(location);
      }, async () => {
        await triggerSOS(location);
      });
    } else {
      await triggerSOS(location);
    }
  };

  const triggerSOS = async (location: { lat: number, lng: number, address: string }) => {
    // Start alarm INSTANTLY when trigger is called
    startAlarm();
    setIsSOSActive(true);

    try {
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          triggerType: 'Manual',
          batteryLevel: batteryLevel,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveSOSId(data._id);
        toast.error('EMERGENCY SIGNAL SENT!', {
          duration: 5000,
          icon: '🚨',
        });
      } else {
        // Handle failure if necessary, but keep alarm going locally
        console.error('SOS fetch fail');
      }
    } catch (error) {
      toast.error('Local Alarm Active - Network Error');
    }
  };

  // Shake Detection Protocol
  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    if (!shakeEnabled || isSOSActive) return;

    const acc = event.accelerationIncludingGravity;
    if (!acc) return;

    const threshold = 15;
    const delta = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);

    if (delta > threshold) {
      const now = Date.now();
      if (now - lastShake.current > 2000) {
        lastShake.current = now;
        toast.error('TACTICAL SHAKE DETECTED - TRIGGERING SOS', {
          duration: 4000,
          icon: '📳',
          style: { borderRadius: '1rem', background: '#ef4444', color: '#fff', fontWeight: 'bold' }
        });
        handleSOS();
      }
    }
  }, [shakeEnabled, isSOSActive, handleSOS]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion as any);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('devicemotion', handleMotion as any);
      }
    };
  }, [handleMotion]);

  return (
    <main className="pt-24 pb-32 px-6 min-h-screen relative overflow-hidden bg-slate-50/50">
      {/* Premium Background Pattern */}
      <div className="absolute inset-0 z-[-1] opacity-30 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      {/* Pass polling frequency to Navbar */}
      <Navbar pollingFrequency={5000} />

      <div className="max-w-7xl mx-auto flex flex-col items-center">
        {/* Signal & Battery Status Bar */}
        <div className="w-full max-w-2xl flex justify-between items-center mb-12 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex gap-1 items-end h-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`w-1 rounded-full ${i < 3 ? 'h-full bg-primary' : 'h-2 bg-slate-100'}`} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Secure Link: Active</span>
              {isRecording && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-50 text-red-500 rounded-md animate-pulse">
                  <Mic className="w-2.5 h-2.5" />
                  <span className="text-[8px] font-black uppercase tracking-tighter text-red-600">Digital Witness Active</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShakeEnabled(!shakeEnabled);
                toast.success(shakeEnabled ? 'SHAKE PROTOCOL DISENGAGED' : 'SHAKE PROTOCOL ARMED', {
                  icon: shakeEnabled ? '🔓' : '🔒',
                  style: { borderRadius: '1rem', background: '#333', color: '#fff', fontSize: '10px', fontWeight: 'bold' }
                });
              }}
              className={`px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all ${shakeEnabled ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}
            >
              Shake: {shakeEnabled ? 'ARMED' : 'OFF'}
            </button>
            <span className={`text-[10px] font-black tracking-widest ${batteryLevel !== null && batteryLevel < 20 ? 'text-red-500' : 'text-slate-400'}`}>
              {batteryLevel !== null ? `${batteryLevel}% ENERGY` : 'SYSTEM OK'}
            </span>
            <div className="w-10 h-5 border border-slate-200 rounded-md p-0.5 relative">
              <div
                className={`h-full rounded-sm transition-all ${batteryLevel !== null && batteryLevel < 20 ? 'bg-red-500' : 'bg-green-500'
                  }`}
                style={{ width: `${batteryLevel || 100}%` }}
              />
              <div className="absolute -right-1 top-1.5 w-1 h-2 bg-slate-200 rounded-r-sm" />
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="w-full flex flex-col items-center justify-center py-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tight text-slate-900 leading-[1.1]">
              TOTAL SAFETY. <br />
              <span className="text-primary italic font-extrabold uppercase tracking-tighter">Professionally Armored.</span>
            </h1>
            <p className="text-slate-500 max-w-lg mx-auto text-lg font-medium leading-relaxed">
              Your elite digital guardian. Advanced emergency response and real-time protection at your fingertips.
            </p>
          </motion.div>

          <div className="relative mb-20">
            <AnimatePresence>
              {countdown > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1.2 }}
                  exit={{ opacity: 0, scale: 2 }}
                  className="absolute inset-0 flex items-center justify-center z-10 text-9xl font-black text-slate-900 pointer-events-none"
                >
                  {countdown}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleSOS}
              className={`
                relative w-64 h-64 rounded-full flex flex-col items-center justify-center gap-3
                transition-all duration-500 group shadow-2xl overflow-hidden
                ${isSOSActive
                  ? 'bg-white border-4 border-red-500 shadow-red-100'
                  : 'bg-red-500 hover:bg-red-600 scale-100 hover:scale-105'}
              `}
            >
              <div className={`absolute inset-0 bg-red-600 opacity-0 group-hover:opacity-10 transition-opacity ${isSOSActive ? 'hidden' : ''}`} />

              <div className={`
                p-6 rounded-full transition-all duration-500
                ${isSOSActive ? 'bg-red-500 text-white shadow-xl' : 'bg-white/20 text-white'}
              `}>
                <ShieldAlert className={`w-16 h-16 ${isSOSActive ? 'animate-pulse' : ''}`} />
              </div>

              <div className="text-center z-10 px-4">
                <span className={`
                  block text-2xl font-black uppercase tracking-widest leading-none
                  ${isSOSActive ? 'text-red-500' : 'text-white'}
                `}>
                  {isSOSActive ? 'ACTIVE' : 'SOS'}
                </span>
                <span className={`
                  block text-[10px] font-bold uppercase tracking-[0.2em] mt-1
                  ${isSOSActive ? 'text-red-400' : 'text-red-100'}
                `}>
                  {isSOSActive ? 'Deactivate' : 'Hold to Alert'}
                </span>
              </div>

              {!isSOSActive && <div className="absolute inset-0 sos-pulse rounded-full pointer-events-none" />}
            </button>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-6xl mt-8">
          <Link href="/map" className="contents">
            <ActionCard
              icon={<Navigation className="text-indigo-600" />}
              label="Live Track"
              sub="Secure Path"
            />
          </Link>
          <Link href="/contacts" className="contents">
            <ActionCard
              icon={<Phone className="text-emerald-500" />}
              label="Guardians"
              sub="Trusted Net"
            />
          </Link>
          <Link href="/incident" className="contents">
            <ActionCard
              icon={<AlertTriangle className="text-amber-500" />}
              label="Incident"
              sub="Evidence Log"
            />
          </Link>
          <Link href="/safe-route" className="contents">
            <ActionCard
              icon={<Shield className="text-indigo-600" />}
              label="Safe Path"
              sub="AI Navigator"
            />
          </Link>
        </div>
      </div>

      <AIChat />

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
        <div className="bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-[2.5rem] px-8 py-5 flex justify-between items-center shadow-2xl ring-1 ring-black/5">
          <Link href="/" className="text-primary"><LayoutDashboard className="w-6 h-6" /></Link>
          <Link href="/map" className="text-slate-400 hover:text-primary transition-colors"><MapPin className="w-6 h-6" /></Link>
          <button onClick={handleSOS} className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center -mt-12 border-4 border-white shadow-xl shadow-red-100 ring-2 ring-red-500/10">
            <ShieldAlert className="w-7 h-7 text-white" />
          </button>
          <Link href="/chat" className="text-slate-400 hover:text-primary transition-colors"><MessageSquare className="w-6 h-6" /></Link>
          <Link href="/profile" className="text-slate-400 hover:text-primary transition-colors"><User className="w-6 h-6" /></Link>
        </div>
      </div>
    </main>
  );
}

function ActionCard({ icon, label, sub }: { icon: React.ReactNode, label: string, sub: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="p-5 md:p-8 flex flex-col gap-4 md:gap-6 cursor-pointer bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-2xl hover:border-indigo-100 group transition-all duration-500"
    >
      <div className="p-4 bg-slate-50 rounded-2xl w-fit group-hover:bg-indigo-50 transition-colors duration-500">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none group-hover:text-primary transition-colors duration-500">{label}</h3>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{sub}</p>
      </div>
    </motion.div>
  );
}
