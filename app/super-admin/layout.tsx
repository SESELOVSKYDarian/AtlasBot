'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    ShieldCheck, Users, PieChart, LifeBuoy,
    Settings, LogOut, Bell, Menu, X,
    Activity, Database, Globe
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import SupportWidget from '@/components/SupportWidget';

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const pathname = usePathname();
    const router = useRouter();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const isActive = (path: string) => pathname === path;

    const NavLink = ({ href, icon: Icon, children }: any) => (
        <Link
            href={href}
            className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive(href)
                ? 'bg-primary/10 text-white border border-primary/20 shadow-[0_0_20px_-5px_rgba(147,51,234,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
        >
            <Icon size={18} className={isActive(href) ? 'text-primary' : 'group-hover:text-primary transition-colors'} />
            <span className="text-xs font-black uppercase tracking-widest">{children}</span>
            {isActive(href) && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_#9333ea]"></div>
            )}
        </Link>
    );

    return (
        <div className="flex min-h-screen bg-[#05060d] font-body text-slate-100 selection:bg-primary/20">
            {/* Background elements */}
            <div className="fixed inset-0 bg-noise pointer-events-none z-0 opacity-20"></div>
            <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none"></div>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-full flex flex-col bg-[#0a0b14]/80 backdrop-blur-2xl border-r border-white/5 p-6">
                    <div className="flex items-center gap-3 px-2 mb-10">
                        <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-[0_0_20px_-5px_#9333ea]">
                            <ShieldCheck size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Vase<span className="text-primary-light">Admin</span></h2>
                            <span className="text-[9px] uppercase tracking-[0.3em] font-black text-primary-light opacity-80 mt-1 block">Root Protocol</span>
                        </div>
                    </div>

                    <nav className="flex-1 space-y-2">
                        <div className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-600 px-4 mb-4">Core Analytics</div>
                        <NavLink href="/super-admin" icon={Activity}>Dashboard</NavLink>
                        <NavLink href="/super-admin/users" icon={Users}>Global Users</NavLink>

                        <div className="pt-8 text-[10px] uppercase tracking-[0.3em] font-black text-slate-600 px-4 mb-4">Operation Center</div>
                        <NavLink href="/super-admin/support-tickets" icon={LifeBuoy}>Support Queue</NavLink>
                        <NavLink href="/super-admin/settings" icon={Settings}>System Config</NavLink>
                    </nav>

                    <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-black uppercase text-xs">SA</div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-white uppercase tracking-wider leading-none">Master Admin</span>
                                <span className="text-[9px] text-primary font-black uppercase tracking-widest mt-1 opacity-70 italic">Online</span>
                            </div>
                        </div>

                        <button
                            onClick={handleSignOut}
                            className="w-full group flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200"
                        >
                            <LogOut size={18} className="group-hover:text-red-400 transition-colors" />
                            <span className="text-xs font-black uppercase tracking-widest">Terminate Session</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 lg:ml-72 relative z-10">
                {/* Top Navbar */}
                <header className="h-20 border-b border-white/5 bg-[#05060d]/40 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button className="lg:hidden text-slate-400" onClick={() => setSidebarOpen(!isSidebarOpen)}>
                            <Menu size={24} />
                        </button>
                        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                            <div className="size-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#9333ea]"></div>
                            <span className="text-[9px] font-black text-primary uppercase tracking-widest">Mainframe Link Active</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Globe size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Global Node: US-EAST-1</span>
                        </div>
                        <button className="relative p-2 text-slate-400 hover:text-white transition group">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 size-2 bg-primary rounded-full border-2 border-[#05060d] shadow-[0_0_10px_#9333ea]"></span>
                        </button>
                        <div className="h-6 w-px bg-white/5"></div>
                        <Link href="/admin" className="text-[10px] font-black uppercase text-slate-500 hover:text-primary transition tracking-widest italic border border-white/10 px-3 py-1.5 rounded-lg">
                            Switch to Client View
                        </Link>
                    </div>
                </header>

                <div className="min-h-[calc(100vh-80px)]">
                    {children}
                </div>
            </main>
            <SupportWidget />
        </div>
    );
}
