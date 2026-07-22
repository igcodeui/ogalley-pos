'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Package, X, Check, AlertTriangle, Tag, Trash2 } from 'lucide-react';
import type { Product, Category } from '@/lib/types';
import { formatCurrency } from '@/lib/constants';

const EMOJIS: Record<string, string> = { coffee: '☕', 'non-coffee': '🧋', pastries: '🥐', 'rice-meals': '🍚', desserts: '🍰', snacks: '🍟', seasonal: '✨', 'combo-meals': '📦' };

export default function ProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showCatManager, setShowCatManager] = useState(false);

  const fetchProducts = () => fetch('/api/products').then(r => r.json()).then(setProducts);
  const fetchCategories = () => fetch('/api/categories').then(r => r.json()).then(setCategories);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()])
      .then(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (catFilter !== 'all') list = list.filter(p => JSON.parse(p.categoryIds || '[]').includes(catFilter));
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [products, search, catFilter]);

  const getCatName = (ids: string) => {
    try {
      const arr = JSON.parse(ids || '[]');
      return arr.map((id: string) => categories.find(c => c.id === id)?.name || id).join(', ');
    } catch { return ids; }
  };

  if (loading) return <div className="p-4 lg:p-6 space-y-6">{[1,2,3,4,5,6].map(i=><div key={i} className="h-16 rounded-2xl animate-shimmer bg-white/[0.03]" />)}</div>;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Products</h3>
          <p className="text-sm text-[#888]">{filtered.length} of {products.length} products</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCatManager(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-[#888] text-sm font-medium hover:text-white hover:bg-white/[0.06] transition-all">
            <Tag size={16} /> Categories
          </button>
          <button onClick={() => { setEditProduct(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C48A3A] to-[#A06E28] text-white text-sm font-medium hover:shadow-lg hover:shadow-[#C48A3A]/20 transition-all">
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or SKU..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-[#666] focus:outline-none focus:border-[#C48A3A]/50 transition-all" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#C48A3A]/50">
          <option value="all" className="bg-[#1E1E1E]">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id} className="bg-[#1E1E1E]">{c.name}</option>)}
        </select>
      </div>

      {/* Product Table (Desktop) */}
      <div className="hidden lg:block premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Product', 'SKU', 'Category', 'Cost', 'Price', 'Margin', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-[#888] px-4 py-3 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const margin = p.sellingPrice > 0 ? ((p.sellingPrice - p.costPrice) / p.sellingPrice * 100).toFixed(1) : '0';
                const catIds = JSON.parse(p.categoryIds || '[]');
                const emoji = EMOJIS[catIds[0]?.replace('cat-', '')] || '📦';
                return (
                  <motion.tr key={p.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => { setEditProduct(p); setShowForm(true); }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center text-lg shrink-0">{emoji}</div>
                        <div>
                          <p className="text-sm font-medium text-white">{p.name}</p>
                          <p className="text-xs text-[#888] truncate max-w-[200px]">{p.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#888] font-mono">{p.sku}</td>
                    <td className="px-4 py-3 text-sm text-[#888]">{getCatName(p.categoryIds)}</td>
                    <td className="px-4 py-3 text-sm text-[#888]">{formatCurrency(p.costPrice)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#C48A3A]">{formatCurrency(p.sellingPrice)}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${Number(margin) >= 50 ? 'bg-green-500/10 text-green-400' : Number(margin) >= 30 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>{margin}%</span></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.isAvailable ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{p.isAvailable ? 'Active' : 'Inactive'}</span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filtered.map((p, i) => {
          const margin = p.sellingPrice > 0 ? ((p.sellingPrice - p.costPrice) / p.sellingPrice * 100).toFixed(1) : '0';
          const catIds = JSON.parse(p.categoryIds || '[]');
          const emoji = EMOJIS[catIds[0]?.replace('cat-', '')] || '📦';
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="premium-card p-4 cursor-pointer" onClick={() => { setEditProduct(p); setShowForm(true); }}>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center text-xl shrink-0">{emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-white">{p.name}</p>
                      <p className="text-xs text-[#888]">{getCatName(p.categoryIds)}</p>
                    </div>
                    <p className="text-sm font-bold text-[#C48A3A]">{formatCurrency(p.sellingPrice)}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-[#888]">Cost: {formatCurrency(p.costPrice)}</span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${Number(margin) >= 50 ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{margin}%</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${p.isAvailable ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{p.isAvailable ? 'Active' : 'Off'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Product Form Dialog */}
      {showForm && <ProductForm product={editProduct} categories={categories} onClose={() => setShowForm(false)} onSave={() => {
        fetchProducts();
        setShowForm(false);
      }} />}

      {/* Category Manager Dialog */}
      <AnimatePresence>
        {showCatManager && <CategoryManager categories={categories} onClose={() => setShowCatManager(false)} onRefresh={() => {
        fetchCategories();
        fetchProducts();
      }} />}
      </AnimatePresence>
    </div>
  );
}

// ============ PRODUCT FORM ============

function ProductForm({ product, categories, onClose, onSave }: { product: Product | null; categories: Category[]; onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState(product?.name || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [desc, setDesc] = useState(product?.description || '');
  const [cost, setCost] = useState(String(product?.costPrice || 0));
  const [price, setPrice] = useState(String(product?.sellingPrice || 0));
  const [saving, setSaving] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(product?.categoryIds ? (() => { try { return JSON.parse(product.categoryIds)[0] || ''; } catch { return ''; } })() : '');

  const handleSave = async () => {
    setSaving(true);
    try {
      const catIds = selectedCategoryId ? JSON.stringify([selectedCategoryId]) : '[]';
      if (product) {
        const res = await fetch('/api/products', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: product.id, name, sku, description: desc, costPrice: Number(cost), sellingPrice: Number(price), categoryIds: catIds }),
        });
        if (!res.ok) { const err = await res.json(); alert(err.error || 'Failed to update product'); return; }
      } else {
        const res = await fetch('/api/products', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, sku, description: desc, costPrice: Number(cost), sellingPrice: Number(price), categoryIds: catIds }),
        });
        if (!res.ok) { const err = await res.json(); alert(err.error || 'Failed to create product'); return; }
      }
      onSave();
    } catch (e) { alert('Network error'); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg bg-[#1A1A1A] border border-white/[0.08] rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">{product ? 'Edit' : 'Add'} Product</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-white/[0.04]"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div><label className="text-xs font-medium text-[#888] mb-1 block">Product Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#C48A3A]/50" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-[#888] mb-1 block">SKU *</label>
              <input value={sku} onChange={e => setSku(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#C48A3A]/50" /></div>
            <div><label className="text-xs font-medium text-[#888] mb-1 block">Category</label>
              <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#C48A3A]/50">
                <option value="" className="bg-[#1E1E1E]">None</option>
                {categories.filter(c => c.isActive).map(c => <option key={c.id} value={c.id} className="bg-[#1E1E1E]">{c.name}</option>)}
              </select></div>
          </div>
          <div><label className="text-xs font-medium text-[#888] mb-1 block">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#C48A3A]/50 resize-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-[#888] mb-1 block">Cost Price</label>
              <input type="number" value={cost} onChange={e => setCost(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#C48A3A]/50" /></div>
            <div><label className="text-xs font-medium text-[#888] mb-1 block">Selling Price</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#C48A3A]/50" /></div>
          </div>
          {price && cost && <p className="text-xs text-[#888]">Profit Margin: <span className={Number(price) > 0 && ((Number(price) - Number(cost)) / Number(price) * 100) >= 50 ? 'text-green-400' : 'text-yellow-400'}>{((Number(price) - Number(cost)) / Number(price) * 100).toFixed(1)}%</span></p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-[#888] hover:text-white hover:bg-white/[0.04] transition-all">Cancel</button>
          <button onClick={handleSave} disabled={saving || !name || !sku}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#C48A3A] to-[#A06E28] text-white text-sm font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-[#C48A3A]/20 transition-all">
            {saving ? 'Saving...' : 'Save Product'}</button>
        </div>
      </motion.div>
    </div>
  );
}

// ============ CATEGORY MANAGER ============

function CategoryManager({ categories, onClose, onRefresh }: { categories: Category[]; onClose: () => void; onRefresh: () => void }) {
  const [catName, setCatName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!catName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName.trim() }),
      });
      if (!res.ok) { const err = await res.json(); alert(err.error || 'Failed to add category'); return; }
      setCatName('');
      onRefresh();
    } catch { alert('Network error'); }
    setSaving(false);
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editName.trim() }),
      });
      if (!res.ok) { const err = await res.json(); alert(err.error || 'Failed to update'); return; }
      setEditId(null);
      setEditName('');
      onRefresh();
    } catch { alert('Network error'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Products in it will become uncategorized.')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      if (!res.ok) { alert('Failed to delete'); return; }
      onRefresh();
    } catch { alert('Network error'); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#1A1A1A] border border-white/[0.08] rounded-2xl p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Manage Categories</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-white/[0.04]"><X size={18} /></button>
        </div>

        {/* Add new category */}
        <div className="flex gap-2 mb-5">
          <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="New category name..."
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#C48A3A]/50" />
          <button onClick={handleAdd} disabled={saving || !catName.trim()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C48A3A] to-[#A06E28] text-white text-sm font-medium disabled:opacity-40 hover:shadow-lg hover:shadow-[#C48A3A]/20 transition-all">
            <Plus size={16} />
          </button>
        </div>

        {/* Category list */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {categories.length === 0 && <p className="text-xs text-[#555] text-center py-6">No categories yet. Add one above.</p>}
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              {editId === cat.id ? (
                <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleRename(cat.id); if (e.key === 'Escape') { setEditId(null); setEditName(''); } }}
                  className="flex-1 px-2 py-1 rounded-lg bg-white/[0.05] border border-[#C48A3A]/50 text-sm text-white focus:outline-none" />
              ) : (
                <span className="flex-1 text-sm text-white">{cat.name}</span>
              )}
              {editId === cat.id ? (
                <button onClick={() => handleRename(cat.id)} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10"><Check size={14} /></button>
              ) : (
                <button onClick={() => { setEditId(cat.id); setEditName(cat.name); }} className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-white/[0.06]" title="Rename"><Edit2 size={14} /></button>
              )}
              <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg text-[#888] hover:text-red-400 hover:bg-red-500/10" title="Delete"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
