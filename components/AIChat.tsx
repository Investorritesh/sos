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
            {/* Floating Trigger Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-8 p-5 bg-slate-900 text-white rounded-full shadow-2xl shadow-indigo-200/60 z-40 border-4 border-white group"
                aria-label="Open GuardianAI"
            >
                <div className="relative">
                    <MessageSquare className="w-7 h-7" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse border-2 border-slate-900" />
                </div>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[99] md:hidden"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Chat Window */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 40 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed bottom-6 right-6 md:bottom-24 md:right-8 w-[calc(100vw-3rem)] max-w-[400px] h-[85vh] md:h-[620px] bg-white z-[100] flex flex-col shadow-[0_32px_128px_rgba(0,0,0,0.15)] rounded-[2.5rem] border border-slate-100 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center flex-shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-white/10 rounded-xl">
                                        <ShieldCheck className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-black tracking-tight leading-none text-lg">GuardianAI</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pollinations Neural Link Active</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Quick Actions */}
                            {messages.length <= 1 && (
                                <div className="px-5 pt-4 pb-2 flex-shrink-0 border-b border-slate-50">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Quick Actions</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {QUICK_ACTIONS.map((action) => (
                                            <button
                                                key={action.label}
                                                onClick={() => handleQuickAction(action.prompt)}
                                                className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-100 border border-slate-100 rounded-2xl text-[10px] font-black text-slate-600 hover:text-primary transition-all text-left group"
                                            >
                                                <span className="text-primary group-hover:scale-110 transition-transform">{action.icon}</span>
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Messages */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-4 scroll-smooth">
                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {msg.role === 'assistant' && (
                                            <div className="w-7 h-7 bg-slate-900 rounded-xl flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                                                <Zap className="w-3.5 h-3.5 text-white" />
                                            </div>
                                        )}
                                        <div className={`max-w-[82%] px-5 py-4 text-sm leading-relaxed font-medium ${msg.role === 'user'
                                                ? 'bg-slate-900 text-white rounded-[1.5rem] rounded-tr-sm shadow-xl'
                                                : 'bg-slate-50 text-slate-700 rounded-[1.5rem] rounded-tl-sm border border-slate-100'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </motion.div>
                                ))}

                                {/* Typing Indicator */}
                                {loading && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex justify-start items-end gap-2"
                                    >
                                        <div className="w-7 h-7 bg-slate-900 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Zap className="w-3.5 h-3.5 text-white animate-pulse" />
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] rounded-tl-sm px-5 py-4 flex gap-1.5">
                                            <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
                                            <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.15s]" />
                                            <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.3s]" />
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Input */}
                            <div className="p-5 border-t border-slate-100 bg-white flex-shrink-0">
                                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 focus-within:bg-white focus-within:border-primary focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder="Ask GuardianAI..."
                                        className="flex-1 bg-transparent outline-none text-sm font-medium text-slate-700 placeholder:text-slate-300"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                        disabled={loading}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!input.trim() || loading}
                                        className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center disabled:bg-slate-100 disabled:text-slate-300 transition-all hover:bg-primary active:scale-95 flex-shrink-0"
                                        aria-label="Send"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-center text-[9px] text-slate-300 font-bold uppercase tracking-widest mt-3">
                                    Powered by Pollinations Neural AI · No API Key Required
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
