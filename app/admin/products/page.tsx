'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Package, Plus, Search, MoreVertical,
    Trash2, Edit, Save, X, Image as ImageIcon,
    Tag, Database, AlertCircle, Loader2
} from 'lucide-react';

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock: '',
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (!error) setProducts(data || []);
        setLoading(false);
    }

    async function handleSave() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const payload = {
            user_id: session.user.id,
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock),
            updated_at: new Date().toISOString()
        };

        let error;
        if (editingProduct) {
            const { error: err } = await supabase
                .from('products')
                .update(payload)
                .eq('id', editingProduct.id);
            error = err;
        } else {
            const { error: err } = await supabase
                .from('products')
                .insert(payload);
            error = err;
        }

        if (!error) {
            setFormData({ name: '', description: '', price: '', stock: '' });
            setIsAdding(false);
            setEditingProduct(null);
            fetchProducts();
        } else {
            alert(error.message);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (!error) fetchProducts();
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white italic tracking-tight uppercase flex items-center gap-4">
                        <Package className="text-amber-400 size-10" /> Catálogo
                    </h1>
                    <p className="text-slate-400 font-bold mt-2 uppercase text-[10px] tracking-[0.2em] italic">Gestiona tus productos y existencias.</p>
                </div>
                <button
                    onClick={() => {
                        setIsAdding(true);
                        setEditingProduct(null);
                        setFormData({ name: '', description: '', price: '', stock: '' });
                    }}
                    className="glow-button !from-amber-500 !to-orange-600 !py-3 px-6 text-[10px] uppercase tracking-[0.2em]"
                >
                    <Plus size={16} /> Nuevo Producto
                </button>
            </div>

            <div className="glass-card !p-4">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 size-4 group-focus-within:text-amber-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-background-dark/50 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs font-black uppercase tracking-widest text-slate-300 outline-none focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-slate-600"
                    />
                </div>
            </div>

            {(isAdding || editingProduct) && (
                <div className="glass-card border-amber-500/30 animate-in zoom-in-95 duration-300 shadow-[0_0_40px_rgba(245,158,11,0.1)]">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white flex items-center gap-2">
                            <Tag size={18} className="text-amber-400" /> {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                        </h3>
                        <button onClick={() => { setIsAdding(false); setEditingProduct(null); }} className="text-slate-500 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-2 block">Nombre del Producto</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-background-dark/50 border border-white/5 rounded-xl py-3 px-4 text-sm font-medium text-slate-300 outline-none focus:ring-1 focus:ring-amber-500/50"
                                    placeholder="Ej: Zapatillas Pro v2"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-2 block">Descripción</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full h-24 bg-background-dark/50 border border-white/5 rounded-xl py-3 px-4 text-sm font-medium text-slate-300 outline-none focus:ring-1 focus:ring-amber-500/50 resize-none"
                                    placeholder="Detalles sobre el producto..."
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-2 block">Precio ($)</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full bg-background-dark/50 border border-white/5 rounded-xl py-3 px-4 text-sm font-medium text-slate-300 outline-none focus:ring-1 focus:ring-amber-500/50"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-2 block">Stock</label>
                                    <input
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        className="w-full bg-background-dark/50 border border-white/5 rounded-xl py-3 px-4 text-sm font-medium text-slate-300 outline-none focus:ring-1 focus:ring-amber-500/50"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="p-6 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-600">
                                <ImageIcon size={32} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Imagen (Próximamente)</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-8">
                        <button
                            onClick={handleSave}
                            className="px-8 py-3 rounded-xl bg-amber-500 text-background-dark font-black text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all shadow-[0_10px_20px_rgba(245,158,11,0.2)]"
                        >
                            {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
                        <Loader2 className="animate-spin" size={32} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Cargando Catálogo...</span>
                    </div>
                ) : filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                        <div key={product.id} className="glass-card group relative border-white/5 hover:border-amber-500/30 transition-all duration-500 overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button
                                    onClick={() => {
                                        setEditingProduct(product);
                                        setFormData({
                                            name: product.name,
                                            description: product.description || '',
                                            price: product.price.toString(),
                                            stock: product.stock.toString(),
                                        });
                                    }}
                                    className="p-2 rounded-lg bg-background-dark/80 text-white hover:text-amber-400 transition-colors backdrop-blur-md"
                                >
                                    <Edit size={14} />
                                </button>
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    className="p-2 rounded-lg bg-background-dark/80 text-white hover:text-red-400 transition-colors backdrop-blur-md"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="h-40 bg-white/5 flex items-center justify-center relative overflow-hidden">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <Package size={48} className="text-slate-800" />
                                )}
                                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-background-dark to-transparent">
                                    <div className="flex justify-between items-end">
                                        <span className="bg-amber-500 text-background-dark text-[10px] font-black px-2 py-1 rounded-md shadow-lg italic">
                                            $ {Number(product.price).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <h3 className="text-lg font-black text-white italic tracking-tight uppercase mb-2 truncate">{product.name}</h3>
                                <p className="text-xs text-slate-500 font-medium line-clamp-2 h-8 mb-4">{product.description || 'Sin descripción.'}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Database size={12} className="text-slate-500" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock: {product.stock}</span>
                                    </div>
                                    <div className={`size-2 rounded-full ${product.stock > 0 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'} animate-pulse`}></div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl text-slate-600">
                        <Package size={48} className="mb-4 opacity-20" />
                        <p className="text-xs font-black uppercase tracking-widest italic">No hay productos en el catálogo</p>
                    </div>
                )}
            </div>
        </div>
    );
}
