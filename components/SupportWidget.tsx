'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles, Zap, MessageCircle } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

// Ultra-Clean Markdown Reader
const FormattedText = ({ text }: { text: string }) => {
    const lines = text.split('\n');
    return (
        <div className="space-y-3">
            {lines.map((line, i) => {
                // Headers
                if (line.startsWith('### ')) {
                    return <h3 key={i} className="text-sm font-black uppercase tracking-[0.2em] text-primary-light/90 mt-6 first:mt-0">{line.replace('### ', '')}</h3>;
                }

                // Bold and Inline styles
                let html = line
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-black">$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em class="italic text-slate-300">$1</em>');

                // List items
                if (line.trim().startsWith('- ')) {
                    return (
                        <div key={i} className="flex gap-3 ml-1">
                            <div className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0 shadow-[0_0_8px_rgba(147,51,234,0.6)]" />
                            <span className="text-slate-200" dangerouslySetInnerHTML={{ __html: html.replace('- ', '') }} />
                        </div>
                    );
                }

                if (!line.trim()) return <div key={i} className="h-1" />;

                return <p key={i} className="text-slate-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
            })}
        </div>
    );
};

export default function SupportWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: '### ¡Bienvenido a VaseLabs!\n\nHola, soy **Vase**, tu asistente de inteligencia avanzada. Estoy aquí para resolver tus dudas y ayudarte a potenciar tu negocio.\n\n- ¿Cómo puedo ayudarte hoy?\n- ¿Tienes dudas sobre la configuración?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    if (!mounted) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res = await fetch('/api/support/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg }),
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Lo siento, hubo un error de comunicación.' }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: '### Error de Red\nNo pude conectar con mi núcleo central.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[999999] flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-6 w-[95vw] md:w-[440px] h-[75vh] md:h-[650px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-12 fade-in duration-500 shadow-[0_40px_100px_rgba(0,0,0,0.9)] border border-white/10 rounded-[2.5rem] bg-[#05060d]/80 backdrop-blur-3xl pointer-events-auto relative group/window">

                    {/* Background Visual Enhancements */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 group-hover/window:opacity-70 transition-opacity"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 opacity-30"></div>

                    {/* Header */}
                    <div className="relative z-10 p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <div className="size-14 rounded-2xl bg-gradient-to-br from-primary via-primary-light to-purple-600 flex items-center justify-center p-0.5 shadow-2xl">
                                    <div className="w-full h-full bg-[#05060d] rounded-[14px] flex items-center justify-center">
                                        <Bot size={28} className="text-primary-light animate-pulse" />
                                    </div>
                                </div>
                                <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-emerald-500 border-4 border-[#05060d] shadow-[0_0_15px_rgba(16,185,129,0.6)]"></div>
                            </div>
                            <div>
                                <h3 className="text-base font-black text-white italic tracking-tighter uppercase leading-none">Vase<span className="text-primary">Assistant</span></h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <Zap size={10} className="text-primary-light fill-primary-light" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Protocol Active</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all transform hover:rotate-90 hover:scale-110 border border-white/5"
                        >
                            <X size={22} />
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div className="relative flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar z-10 scroll-smooth">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex items-start gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                                <div className={`size-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl border transition-all ${msg.role === 'user'
                                        ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                        : 'bg-gradient-to-br from-primary to-purple-700 border-white/10 text-white shadow-primary/20'
                                    }`}>
                                    {msg.role === 'user' ? <User size={22} /> : <Sparkles size={22} />}
                                </div>
                                <div className={`rounded-3xl p-6 text-sm font-medium shadow-2xl relative ${msg.role === 'user'
                                        ? 'bg-white/5 border border-white/10 text-white rounded-tr-none'
                                        : 'bg-primary/5 border border-primary/20 text-slate-200 rounded-tl-none'
                                    }`}>
                                    <FormattedText text={msg.content} />
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex items-start gap-5 animate-pulse">
                                <div className="size-11 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 text-primary-light">
                                    <Sparkles size={22} />
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-3xl rounded-tl-none p-6 flex items-center gap-3">
                                    <div className="size-2 rounded-full bg-primary animate-bounce shadow-[0_0_8px_#9333ea]"></div>
                                    <div className="size-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s] shadow-[0_0_8px_#9333ea]"></div>
                                    <div className="size-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s] shadow-[0_0_8px_#9333ea]"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input System */}
                    <form onSubmit={handleSubmit} className="relative z-10 p-8 pt-0 mt-auto bg-gradient-to-t from-[#05060d] to-transparent">
                        <div className="relative group/input">
                            <div className="absolute -inset-1.5 bg-gradient-to-r from-primary via-purple-600 to-primary rounded-[2.5rem] blur-lg opacity-10 group-focus-within/input:opacity-30 transition duration-500 animate-pulse"></div>
                            <div className="relative bg-[#0a0b14] border border-white/10 rounded-[2rem] p-2 flex items-center gap-3 shadow-inner">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="¿En qué puedo asistirte?"
                                    className="flex-1 bg-transparent py-4 px-6 text-sm text-white placeholder:text-slate-600 focus:outline-none font-medium"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || loading}
                                    className="size-12 rounded-[1.5rem] bg-primary hover:bg-primary-light text-white disabled:opacity-40 disabled:scale-95 transition-all shadow-xl shadow-primary/30 flex items-center justify-center group/send transform active:scale-90"
                                >
                                    <Send size={20} className="group-hover/send:translate-x-1 group-hover/send:-translate-y-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                        <p className="text-[9px] text-center mt-5 text-slate-600 font-bold uppercase tracking-[0.5em] opacity-40">
                            Neural Processing Core 3.3
                        </p>
                    </form>
                </div>
            )}

            {/* Premium Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group flex items-center gap-5 px-8 py-6 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-all duration-500 hover:scale-105 active:scale-90 border-2 pointer-events-auto relative overflow-hidden ${isOpen
                        ? 'bg-[#05060d] border-white/10 scale-90'
                        : 'bg-primary hover:bg-primary-light border-white/20'
                    }`}
            >
                {/* Internal Glow animations */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 translate-x-[-100%] group-hover:translate-x-[100%] duration-1000 transition-transform"></div>

                {isOpen ? (
                    <X size={32} className="text-slate-400 group-hover:text-white transition-colors relative z-10" />
                ) : (
                    <>
                        <div className="relative z-10">
                            <Bot size={32} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
                        </div>
                        <div className="flex flex-col items-start relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 leading-none mb-2">System</span>
                            <span className="text-sm font-black uppercase tracking-[0.15em] text-white italic leading-none">Assistant</span>
                        </div>
                    </>
                )}
            </button>
        </div>
    );
}
