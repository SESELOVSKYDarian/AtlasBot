'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    ShoppingBag, Search, Filter, MoreVertical,
    Clock, CheckCircle2, Truck, XCircle,
    User, Phone, DollarSign, ExternalLink,
    Loader2, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchOrders();

        // Realtime subscription for orders
        const channel = supabase
            .channel('orders_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                fetchOrders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function fetchOrders() {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                clients (name, phone),
                order_items (
                    *,
                    products (name)
                )
            `)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (!error) setOrders(data || []);
        setLoading(false);
    }

    async function updateOrderStatus(id: string, newStatus: string) {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) alert(error.message);
        // fetchOrders is handled by realtime subscription
    }

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="text-orange-400" size={16} />;
            case 'processing': return <Loader2 className="text-blue-400 animate-spin" size={16} />;
            case 'shipped': return <Truck className="text-secondary" size={16} />;
            case 'delivered': return <CheckCircle2 className="text-emerald-400" size={16} />;
            case 'cancelled': return <XCircle className="text-red-400" size={16} />;
            default: return <Clock className="text-slate-400" size={16} />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'processing': return 'Procesando';
            case 'shipped': return 'Enviado';
            case 'delivered': return 'Entregado';
            case 'cancelled': return 'Cancelado';
            default: return status;
        }
    };

    return (
        <div className="space-y-10 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white italic tracking-tight uppercase flex items-center gap-4">
                        <ShoppingBag className="text-secondary size-10" /> Pedidos
                    </h1>
                    <p className="text-slate-400 font-bold mt-2 uppercase text-[10px] tracking-[0.2em] italic">Seguimiento de ventas y envíos.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 glass-card !p-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 size-4 group-focus-within:text-secondary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente o ID de pedido..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-background-dark/50 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs font-black uppercase tracking-widest text-slate-300 outline-none focus:ring-1 focus:ring-secondary/50 transition-all placeholder:text-slate-600"
                        />
                    </div>
                </div>
                <div className="lg:col-span-1 glass-card !p-4">
                    <div className="relative flex items-center gap-3">
                        <Filter className="text-slate-500 size-4" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full bg-transparent text-xs font-black uppercase tracking-widest text-slate-300 outline-none cursor-pointer"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="pending">Pendientes</option>
                            <option value="processing">Procesando</option>
                            <option value="shipped">Enviados</option>
                            <option value="delivered">Entregados</option>
                            <option value="cancelled">Cancelados</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
                        <Loader2 className="animate-spin" size={32} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Cargando Pedidos...</span>
                    </div>
                ) : filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                        <div key={order.id} className="glass-card group border-white/5 hover:border-secondary/30 transition-all duration-500">
                            <div className="flex flex-col lg:flex-row justify-between gap-8">
                                <div className="flex-1 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center text-secondary border border-white/5">
                                                <ShoppingBag size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Pedido #{order.id.slice(0, 8)}</h3>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase italic mt-0.5">
                                                    {format(new Date(order.created_at), "d 'de' MMMM, HH:mm", { locale: es })} hs
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full border flex items-center gap-2 ${order.status === 'pending' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                                                order.status === 'delivered' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                    order.status === 'cancelled' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                                        'bg-secondary/10 border-secondary/20 text-secondary'
                                            }`}>
                                            {getStatusIcon(order.status)}
                                            <span className="text-[10px] font-black uppercase tracking-widest">{getStatusLabel(order.status)}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-y border-white/5">
                                        <div className="space-y-2">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Cliente</span>
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-secondary" />
                                                <span className="text-sm font-bold text-slate-300">{order.clients?.name || 'Venta Anónima'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone size={14} className="text-slate-500" />
                                                <span className="text-[10px] font-medium text-slate-500">{order.clients?.phone || '-'}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Detalle de Compra</span>
                                            <div className="space-y-1">
                                                {order.order_items?.map((item: any) => (
                                                    <div key={item.id} className="text-[11px] text-slate-400 font-bold">
                                                        {item.quantity}x {item.products?.name}
                                                        <span className="text-slate-600 ml-1">($ {Number(item.unit_price).toLocaleString()})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Total & Origen</span>
                                            <div className="text-xl font-black text-white italic tracking-tight">
                                                $ {Number(order.total_amount).toLocaleString()}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${order.source === 'whatsapp' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-blue-500/30 text-blue-500 bg-blue-500/5'
                                                    }`}>
                                                    {order.source}
                                                </span>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${order.payment_status === 'paid' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-slate-500/30 text-slate-500 bg-slate-500/5'
                                                    }`}>
                                                    {order.payment_status === 'paid' ? 'Pagado' : 'Impago'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {order.delivery_address && (
                                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                                            <div className="flex items-start gap-4">
                                                <Truck size={18} className="text-slate-500 mt-1" />
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Dirección de Entrega</span>
                                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">{order.delivery_address}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="lg:w-48 flex flex-col gap-2">
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 block text-center lg:text-left">Cambiar Estado</span>
                                    <button
                                        onClick={() => updateOrderStatus(order.id, 'processing')}
                                        disabled={order.status === 'processing'}
                                        className={`w-full py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${order.status === 'processing' ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/5 text-slate-500 hover:border-blue-500/30 hover:text-blue-400'}`}
                                    >
                                        Procesar
                                    </button>
                                    <button
                                        onClick={() => updateOrderStatus(order.id, 'shipped')}
                                        disabled={order.status === 'shipped'}
                                        className={`w-full py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${order.status === 'shipped' ? 'bg-secondary/20 border-secondary/40 text-secondary' : 'bg-white/5 border-white/5 text-slate-500 hover:border-secondary/30 hover:text-secondary'}`}
                                    >
                                        Enviar
                                    </button>
                                    <button
                                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                                        disabled={order.status === 'delivered'}
                                        className={`w-full py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${order.status === 'delivered' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/5 text-slate-500 hover:border-emerald-500/30 hover:text-emerald-400'}`}
                                    >
                                        Entregar
                                    </button>
                                    <button
                                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                        disabled={order.status === 'cancelled'}
                                        className={`w-full py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${order.status === 'cancelled' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-white/5 border-white/5 text-slate-500 hover:border-red-500/30 hover:text-red-400'}`}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl text-slate-600">
                        <ShoppingBag size={48} className="mb-4 opacity-20" />
                        <p className="text-xs font-black uppercase tracking-widest italic">No hay pedidos registrados</p>
                    </div>
                )}
            </div>
        </div>
    );
}
