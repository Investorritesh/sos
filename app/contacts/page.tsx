'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Plus, Trash2, User, Phone, ShieldCheck, ArrowLeft, Users, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

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
        <main className="pt-24 pb-12 px-6 bg-slate-50/50 min-h-screen">
            <Navbar />
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-primary mb-10 transition-colors font-black uppercase tracking-widest text-[10px]">
                    <ArrowLeft className="w-4 h-4" /> Operations Hub
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">GUARDIAN NET</h1>
                        <p className="text-slate-400 text-sm font-medium">Manage your elite circle of emergency responders.</p>
                    </div>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl active:scale-95 ${isAdding
                            ? 'bg-slate-900 text-white shadow-slate-200'
                            : 'bg-primary text-white shadow-indigo-100'
                            }`}
                    >
                        {isAdding ? 'CANCEL DEPLOYMENT' : <><Plus className="w-4 h-4" /> ADD GUARDIAN</>}
                    </button>
                </div>

                {isAdding && (
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-white p-6 md:p-10 rounded-[3rem] shadow-2xl shadow-indigo-100/30 border border-slate-100 mb-12"
                    >
                        <form onSubmit={handleAdd} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Guardian Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Legal Name"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-6 outline-none focus:bg-white focus:border-primary transition-all font-bold text-slate-700"
                                            value={newContact.name}
                                            onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tactical Mobile Link</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="tel"
                                            placeholder="Phone Number"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-6 outline-none focus:bg-white focus:border-primary transition-all font-bold text-slate-700"
                                            value={newContact.phone}
                                            onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Relationship Context</label>
                                    <div className="relative group">
                                        <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="e.g., Tactical Support, Primary Kin, Emergency Contact"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-6 outline-none focus:bg-white focus:border-primary transition-all font-bold text-slate-700"
                                            value={newContact.relationship}
                                            onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-slate-200 hover:bg-primary transition-all active:scale-[0.99]"
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
                            className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group hover:shadow-2xl hover:border-indigo-100 transition-all shadow-sm"
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-primary transition-all">
                                    <User className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2">{contact.name}</h3>
                                    <div className="flex flex-col gap-1">
                                        <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <Phone className="w-3 h-3 text-emerald-500" /> {contact.phone}
                                        </span>
                                        <span className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                            <ShieldAlert className="w-3 h-3" /> {contact.relationship}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(contact._id)}
                                className="p-4 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </motion.div>
                    ))}

                    {contacts.length === 0 && !isAdding && (
                        <div className="col-span-full py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center">
                            <div className="p-6 bg-slate-50 rounded-full w-fit mx-auto mb-6">
                                <Users className="w-12 h-12 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">No Guardians Deployed</h3>
                            <p className="text-slate-400 text-sm font-medium mb-8">Secure your perimeter by adding emergency responders.</p>
                            <button
                                onClick={() => setIsAdding(true)}
                                className="bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100"
                            >
                                Add First Guardian
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
