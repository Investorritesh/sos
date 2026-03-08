'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Plus, Trash2, User, Phone, ShieldCheck, ArrowLeft, Users, ShieldAlert, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { ParticleCanvas } from '@/components/ParticleCanvas';
import { TiltCard } from '@/components/TiltCard';

export default function Contacts() {
    const { data: session } = useSession();
    const [contacts, setContacts] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '' });

    useEffect(() => {
        fetchContacts();
    }, [session]);

    const fetchContacts = async () => {
        try {
            const res = await fetch('/api/contacts');
            if (res.ok) {
                const data = await res.json();
                setContacts(data);
            }
        } catch (error) {
            console.error("Failed to fetch contacts", error);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newContact),
        });

        if (res.ok) {
            toast.success('Guardian Successfully Registered');
            setIsAdding(false);
            setNewContact({ name: '', phone: '', relationship: '' });
            fetchContacts();
        } else {
            const data = await res.json();
            toast.error(data.message || 'Transmission failed');
        }
    };

    const handleDelete = async (id: string) => {
        const res = await fetch(`/api/contacts?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
            toast.success('Guardian Connection Severed');
            fetchContacts();
        }
    };

    return (
        <main className="relative min-h-screen pt-20 md:pt-24 pb-12 px-4 md:px-6 overflow-hidden">
            <ParticleCanvas />
            <Navbar pollingFrequency={5000} />
            <div className="max-w-4xl mx-auto relative z-10">
                <Link href="/" className="flex items-center gap-2 text-foreground/60 hover:text-primary mb-10 transition-colors font-black uppercase tracking-widest text-[10px]">
                    <ArrowLeft className="w-4 h-4" /> Operations Hub
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tighter mb-2">GUARDIAN NET</h1>
                        <p className="text-foreground/50 text-sm font-medium">Manage your elite circle of emergency responders.</p>
                    </div>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className={`flex items-center gap-3 px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] transition-all shadow-2xl ${isAdding
                            ? 'bg-foreground text-background shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95'
                            : 'btn-liquid text-white shadow-primary/20 border border-white/10 hover:shadow-[0_20px_50px_rgba(var(--primary-rgb),0.5)] active:scale-95'}
                            `}>
                        {isAdding ? 'CANCEL DEPLOYMENT' : <><Plus className="w-5 h-5" /> ENLIST GUARDIAN</>}
                    </button>
                </div>

                {isAdding && (
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="glass-card bg-background/40 backdrop-blur-3xl p-6 md:p-10 rounded-[3rem] shadow-[0_30px_80px_-20px_rgba(var(--primary-rgb),0.3)] border border-primary/20 mb-12 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent z-0 pointer-events-none" />
                        <form onSubmit={handleAdd} className="space-y-8 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest px-1">Guardian Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Legal Name"
                                            className="w-full bg-black/20 border border-white/10 rounded-2xl py-5 pl-14 pr-6 outline-none focus:bg-white/5 focus:border-primary transition-all font-bold text-foreground placeholder:text-foreground/20"
                                            value={newContact.name}
                                            onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest px-1">Tactical Mobile Link</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="tel"
                                            placeholder="Phone Number"
                                            className="w-full bg-black/20 border border-white/10 rounded-2xl py-5 pl-14 pr-6 outline-none focus:bg-white/5 focus:border-primary transition-all font-bold text-foreground placeholder:text-foreground/20"
                                            value={newContact.phone}
                                            onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest px-1">Relationship Context</label>
                                    <div className="relative group">
                                        <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="e.g., Tactical Support, Primary Kin, Emergency Contact"
                                            className="w-full bg-black/20 border border-white/10 rounded-2xl py-5 pl-14 pr-6 outline-none focus:bg-white/5 focus:border-primary transition-all font-bold text-foreground placeholder:text-foreground/20"
                                            value={newContact.relationship}
                                            onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-primary text-white py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] hover:scale-[1.02] shadow-[0_20px_50px_rgba(var(--primary-rgb),0.4)] border border-primary/50 hover:bg-primary transition-all active:scale-[0.98]"
                            >
                                AUTHORIZE GUARDIAN LINK
                            </button>
                        </form>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {contacts.map((contact, idx) => (
                        <motion.div
                            key={contact._id}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <TiltCard className="glass-card hover:bg-primary/5 hover:border-primary/20 p-8 md:p-12 relative overflow-hidden group border border-white/5 transition-all">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:scale-150 group-hover:opacity-[0.08] transition-all duration-700">
                                    <Zap className="w-24 h-24 text-primary" />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 relative z-10">
                                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-foreground/40 group-hover:text-primary border border-white/10 group-hover:border-primary/40 shadow-xl transition-all">
                                        <User className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-foreground tracking-tight leading-none mb-2 group-hover:text-primary transition-colors">{contact.name}</h3>
                                        <div className="flex flex-col gap-1">
                                            <span className="flex items-center gap-2 text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">
                                                <Phone className="w-3 h-3 text-emerald-500" /> {contact.phone}
                                            </span>
                                            <span className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                                                <ShieldAlert className="w-3 h-3" /> {contact.relationship}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(contact._id)}
                                    className="absolute bottom-6 right-6 p-4 bg-red-500/10 text-red-500/70 hover:text-red-500 hover:bg-red-500/20 rounded-2xl transition-all border border-red-500/10 hover:border-red-500/30"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </TiltCard>
                        </motion.div>
                    ))}

                    {contacts.length === 0 && !isAdding && (
                        <TiltCard className="glass-card py-24 border-dashed border-primary/20 text-center relative overflow-hidden group col-span-1 md:col-span-2 max-w-2xl mx-auto w-full">
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="p-8 bg-white/5 rounded-full w-fit mb-8 border border-white/10 shadow-2xl group-hover:scale-110 group-hover:border-primary/30 transition-all">
                                    <Users className="w-16 h-16 text-foreground/40 group-hover:text-primary transition-colors" />
                                </div>
                                <h3 className="text-2xl font-black text-foreground mb-3">NO GUARDIANS DEPLOYED</h3>
                                <p className="text-foreground/40 text-[10px] font-black mb-8 max-w-sm uppercase tracking-[0.2em]">Secure your perimeter by adding emergency responders.</p>
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="btn-liquid px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_20px_60px_rgba(var(--primary-rgb),0.5)] border border-primary/50"
                                >
                                    INITIALIZE FIRST LINK
                                </button>
                            </div>
                        </TiltCard>
                    )}
                </div>
            </div>
        </main>
    );
}
