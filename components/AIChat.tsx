'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, ShieldCheck, Zap, AlertTriangle, Phone, MapPin, Heart } from 'lucide-react';

const QUICK_ACTIONS = [
    { icon: <AlertTriangle className="w-3 h-3" />, label: "I'm being followed", prompt: "Someone is following me. What should I do right now?" },
    { icon: <Phone className="w-3 h-3" />, label: "Emergency numbers", prompt: "What are the key emergency numbers I should know?" },
    { icon: <MapPin className="w-3 h-3" />, label: "Safe routes home", prompt: "What's the safest way to get home late at night?" },
    { icon: <Heart className="w-3 h-3" />, label: "I feel unsafe", prompt: "I feel unsafe right now but I'm not sure why. What can I do?" },
];

export const AIChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: string; content: string }[]>([
        { role: 'assistant', content: 'GuardianAI online. 🛡️ I\'m your personal safety intelligence. Whether you need advice, feel unsafe, or just want to prepare — I\'m here. How can I help?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || loading) return;

        const userMsg = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, userMsg] }),
            });

            if (!res.ok) throw new Error('API error');
            const data = await res.json();
            setMessages(prev => [...prev, data]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '⚠️ Connection interrupted. If you\'re in danger — press SOS now and call 911/112 immediately.'
            }]);
        } finally {
            setLoading(false);
        }
    }, [loading, messages]);

    const handleSend = () => sendMessage(input);
    const handleQuickAction = (prompt: string) => {
        if (!isOpen) setIsOpen(true);
        sendMessage(prompt);
    };

    return (
        <>
            <motion.div
                initial={{ y: 100, x: '-50%', opacity: 0 }}
                animate={{ y: isOpen ? 100 : 0, x: '-50%', opacity: 1 }}
                className="fixed bottom-10 left-1/2 z-40"
            >
                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(true)}
                    className="px-8 py-4 bg-background/40 backdrop-blur-3xl border border-white/10 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] group hover:bg-primary/20 transition-all flex items-center gap-4 border-b-primary/30"
                    aria-label="Open GuardianAI"
                >
                    <div className="relative">
                        <MessageSquare className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_#4ade80]" />
                    </div>
                    <span className="text-[11px] font-black text-foreground/60 group-hover:text-white uppercase tracking-[0.3em]">AI Guardian Online</span>
                </motion.button>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-background/40 backdrop-blur-md z-[99]"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 100, x: '-50%', scale: 0.9 }}
                            animate={{ opacity: 1, y: '-50%', x: '-50%', scale: 1 }}
                            exit={{ opacity: 0, y: 100, x: '-50%', scale: 0.9 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed top-1/2 left-1/2 w-[calc(100vw-3rem)] max-w-[500px] h-[80vh] glass-card z-[100] flex flex-col shadow-[0_50px_100px_rgba(0,0,0,0.7)] overflow-hidden rounded-[3.5rem] border border-white/10 group/terminal"
                        >
                            {/* Neural Scan Line Animation */}
                            <motion.div
                                className="absolute left-0 right-0 h-px bg-primary/40 z-50 pointer-events-none"
                                animate={{ top: ['0%', '100%', '0%'] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                            />

                            <div className="px-10 py-8 bg-primary/95 text-white flex justify-between items-center flex-shrink-0 relative overflow-hidden ring-1 ring-white/20">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
                                <div className="absolute inset-x-0 bottom-0 h-px bg-white/20" />
                                <div className="relative flex items-center gap-5">
                                    <div className="p-3.5 bg-white/10 rounded-2xl border border-white/20 shadow-2xl">
                                        <ShieldCheck className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-black tracking-tighter text-xl uppercase leading-none mb-1.5">GuardianAI</h3>
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_#4ade80]" />
                                            <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Neural Interface v4.0</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="relative p-3 rounded-2xl hover:bg-white/10 transition-all active:scale-95 group"
                                >
                                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>

                            <div className="flex-1 flex flex-col min-h-0 bg-white/5">
                                <div ref={scrollRef} className="flex-1 overflow-y-auto px-10 py-8 space-y-8 scroll-smooth custom-scrollbar">
                                    {messages.length <= 1 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-6 pt-4"
                                        >
                                            <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.4em] ml-2">Priority Protocols</p>
                                            <div className="grid grid-cols-1 gap-4">
                                                {QUICK_ACTIONS.map((action, i) => (
                                                    <motion.button
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        key={action.label}
                                                        onClick={() => handleQuickAction(action.prompt)}
                                                        className="flex items-center gap-5 p-5 bg-white/5 hover:bg-primary/5 border border-white/5 hover:border-primary/20 rounded-[2rem] transition-all text-left group"
                                                    >
                                                        <div className="p-3 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                                                            {action.icon}
                                                        </div>
                                                        <span className="text-[11px] font-black text-foreground/70 uppercase tracking-widest group-hover:text-primary transition-colors">{action.label}</span>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {messages.map((msg, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`relative max-w-[85%] px-7 py-5 text-[13px] leading-relaxed font-bold tracking-tight shadow-xl ${msg.role === 'user'
                                                ? 'bg-primary text-white rounded-[2rem] rounded-tr-lg border border-white/20 shadow-primary/30'
                                                : 'bg-white/5 backdrop-blur-2xl text-foreground rounded-[2rem] rounded-tl-lg border border-white/10 shadow-black/20'
                                                }`}>
                                                {msg.role === 'assistant' && (
                                                    <div className="absolute -left-12 top-0 pointer-events-none opacity-20 group-hover/terminal:opacity-100 transition-opacity">
                                                        <ShieldCheck className="w-8 h-8 text-primary" />
                                                    </div>
                                                )}
                                                {msg.content}
                                            </div>
                                        </motion.div>
                                    ))}

                                    {loading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white/5 backdrop-blur-3xl rounded-[2rem] px-8 py-5 flex gap-2 border border-white/5">
                                                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                                                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 bg-background/50 backdrop-blur-3xl border-t border-white/10">
                                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-[2rem] px-6 py-4 focus-within:ring-4 focus-within:ring-primary/10 hover:border-primary/20 transition-all group">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            placeholder="Transmit intelligence..."
                                            className="flex-1 bg-transparent outline-none text-[13px] font-bold text-foreground placeholder:text-foreground/20"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                            disabled={loading}
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={!input.trim() || loading}
                                            className="btn-liquid rounded-2xl w-12 h-12 flex items-center justify-center disabled:opacity-20 shadow-lg shadow-primary/20"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <p className="mt-4 text-[9px] font-black text-center text-foreground/20 uppercase tracking-[0.4em]">Encrypted Tactical Channel Locked</p>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
