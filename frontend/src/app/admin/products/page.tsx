'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../lib/api';
import Link from 'next/link';
import { ArrowLeft, Sparkles, LogOut, CheckCircle, AlertCircle, RefreshCw, Plus, Edit2, Check, X } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  stock_count: number;
  image_url: string | null;
  is_active: boolean;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockCount, setStockCount] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/orders/products/');
      const productList = Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
      setProducts(productList);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch catalog products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user && !user.is_astrologer && !user.is_staff) {
      router.push('/dashboard');
      return;
    }
    fetchProducts();
  }, [isAuthenticated, user, router]);

  const handleEditClick = (p: Product) => {
    setIsEditing(p.id);
    setName(p.name);
    setDescription(p.description);
    setPrice(p.price);
    setStockCount(p.stock_count);
    setImageUrl(p.image_url || '');
    setIsActive(p.is_active);
    setIsAdding(false);
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setIsEditing(null);
    setName('');
    setDescription('');
    setPrice('1000.00');
    setStockCount(50);
    setImageUrl('');
    setIsActive(true);
  };

  const handleCancel = () => {
    setIsEditing(null);
    setIsAdding(false);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name || !price) {
      setError('Name and price are required.');
      return;
    }

    try {
      const response = await api.post('/api/orders/products/', {
        name,
        description,
        price,
        stock_count: stockCount,
        image_url: imageUrl || null,
        is_active: isActive
      });
      setSuccess(`Product '${response.data.name}' created successfully.`);
      setIsAdding(false);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to create product.');
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!isEditing) return;

    try {
      const response = await api.patch(`/api/orders/products/${isEditing}/`, {
        name,
        description,
        price,
        stock_count: stockCount,
        image_url: imageUrl || null,
        is_active: isActive
      });
      setSuccess(`Product '${response.data.name}' updated successfully.`);
      setIsEditing(null);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      setError('Failed to update product details.');
    }
  };

  const handleToggleActive = async (product: Product) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/api/orders/products/${product.id}/`, {
        is_active: !product.is_active
      });
      setSuccess(`Product active state toggled successfully.`);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      setError('Failed to toggle product status.');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout/');
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  return (
    <div className="flex-1 bg-parchment-canvas min-h-screen text-ink-primary pb-16 font-sans">
      <div className="max-w-7xl w-full mx-auto px-6 py-12 sm:px-8 relative z-10 animate-stardust-reveal flex flex-col gap-8">
        <div className="constellation-layer" />

        {/* Header */}
        <header className="nm-card bg-parchment-bg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-mystic-muted font-display-h3 text-[11px] tracking-widest uppercase">
              <Sparkles className="h-4 w-4" /> Catalog Inventory
            </div>
            <h1 className="font-display-h1 text-2xl text-ink-primary">Remedies Products CRUD</h1>
            <p className="text-mystic-muted font-sans text-xs uppercase tracking-wider">Astrologer Console</p>
          </div>

          <div className="flex gap-4">
            <Link href="/admin" className="nm-btn px-5 py-3 text-[11px] font-bold text-mystic-muted hover:text-gold-text flex items-center gap-2 transition-all">
              <ArrowLeft className="h-4 w-4" /> Console Dashboard
            </Link>
            <button onClick={handleLogout} className="nm-btn px-5 py-3 text-[11px] font-bold text-mystic-muted hover:text-gold-text flex items-center gap-2 transition-all cursor-pointer">
              <LogOut className="h-4 w-4" /> Logout Console
            </button>
          </div>
        </header>

        {error && (
          <div className="border border-danger/20 bg-danger/5 rounded-lg p-4 text-xs font-semibold text-danger flex items-center gap-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-danger" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="border border-success/20 bg-success/5 rounded-lg p-4 text-xs font-semibold text-success flex items-center gap-3">
            <CheckCircle className="h-4 w-4 shrink-0 text-success" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left column: List of products */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-gold-accent/15">
              <h2 className="font-display-h2 text-xl tracking-wider text-ink-primary">Active Inventory</h2>
              <button onClick={handleAddClick} className="bg-gold-cta hover:bg-gold-cta/90 text-white py-2.5 px-4 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 rounded-md transition-colors">
                <Plus className="h-4 w-4" /> Add Product
              </button>
            </div>

            {loading ? (
              <div className="nm-card bg-parchment-bg p-6 divide-y divide-ink-primary/10">
                {[1, 2].map((i) => (
                  <div key={i} className="py-4 flex justify-between items-center animate-pulse">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-ink-primary/15 rounded w-1/3"></div>
                      <div className="h-3 bg-ink-primary/10 rounded w-1/2"></div>
                      <div className="h-3 bg-ink-primary/10 rounded w-1/4"></div>
                    </div>
                    <div className="h-8 bg-ink-primary/15 rounded w-24"></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <p className="text-center py-12 text-mystic-muted italic font-sans text-sm">No products in inventory.</p>
            ) : (
              <div className="nm-card bg-parchment-bg overflow-hidden">
                <div className="divide-y divide-ink-primary/10">
                  {products.map((p, index) => (
                    <div 
                      key={p.id} 
                      className={`p-4 flex gap-4 items-center justify-between transition-colors ${
                        index % 2 === 0 ? 'bg-transparent' : 'bg-ink-primary/5'
                      }`}
                    >
                      <div className="space-y-1">
                        <h3 className="font-display-h3 text-sm text-ink-primary tracking-wide">{p.name}</h3>
                        <p className="text-xs text-mystic-muted font-sans italic">{p.description}</p>
                        <div className="flex gap-4 text-[11px] font-sans text-ink-primary">
                          <span>Price: <strong className="text-mystic-muted">₹{p.price}</strong></span>
                          <span>Stock: <strong>{p.stock_count}</strong></span>
                          <span className={`font-semibold ${p.is_active ? 'text-success' : 'text-danger'}`}>
                            {p.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button 
                          onClick={() => handleEditClick(p)} 
                          className="border border-ink-primary/20 hover:bg-ink-primary/5 p-2 rounded text-mystic-muted flex items-center justify-center cursor-pointer transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => handleToggleActive(p)} 
                          className={`border px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase rounded transition-colors cursor-pointer ${
                            p.is_active ? 'border-danger/35 text-danger hover:bg-danger/5' : 'border-success/35 text-success hover:bg-success/5'
                          }`}
                        >
                          {p.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column: Form */}
          <div className="lg:col-span-5">
            {!isEditing && !isAdding ? (
              <div className="nm-card bg-parchment-bg p-12 text-center h-full flex flex-col justify-center items-center space-y-4">
                <div className="h-12 w-12 border border-ink-primary/10 rounded-lg text-gold-accent flex items-center justify-center bg-parchment-canvas">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="font-display-h3 text-base text-ink-primary">Select a Product to Edit</h3>
                <p className="text-mystic-muted font-garamond text-sm leading-relaxed">Use the buttons on the product entries to modify price, adjust stock, or add brand-new items to the catalog.</p>
              </div>
            ) : (
              <form onSubmit={isAdding ? handleCreateProduct : handleUpdateProduct} className="nm-card bg-parchment-bg p-6 space-y-4">
                <h3 className="font-display-h3 text-base text-ink-primary border-b border-gold-accent/15 pb-3">
                  {isAdding ? 'Create New Remedy' : 'Edit Remedy Product'}
                </h3>

                <div className="space-y-1">
                  <label className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider block mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-parchment-canvas border border-ink-primary/20 rounded-md px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-gold-accent transition-colors"
                    placeholder="e.g. 5 Mukhi Rudraksh"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider block mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-parchment-canvas border border-ink-primary/20 rounded-md px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-gold-accent transition-colors resize-y"
                    placeholder="Describe benefits and wearing instructions..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider block mb-1">Price (INR)</label>
                    <input
                      type="text"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-parchment-canvas border border-ink-primary/20 rounded-md px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-gold-accent transition-colors"
                      placeholder="1200.00"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider block mb-1">Stock Count</label>
                    <input
                      type="number"
                      required
                      value={stockCount}
                      onChange={(e) => setStockCount(parseInt(e.target.value) || 0)}
                      className="w-full bg-parchment-canvas border border-ink-primary/20 rounded-md px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-gold-accent transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider block mb-1">Image URL</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-parchment-canvas border border-ink-primary/20 rounded-md px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-gold-accent transition-colors"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-gold-accent accent-gold-accent h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="isActive" className="text-ink-primary/80 font-sans font-semibold text-[11px] uppercase tracking-wider cursor-pointer selection:bg-transparent">Set Product Active</label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gold-accent/15">
                  <button type="submit" className="flex-1 bg-gold-cta hover:bg-gold-cta/90 text-white font-sans text-xs font-bold py-3 rounded-md uppercase tracking-widest flex items-center justify-center gap-2 transition-colors cursor-pointer">
                    <Check className="h-4 w-4" /> {isAdding ? 'Create' : 'Save'}
                  </button>
                  <button type="button" onClick={handleCancel} className="flex-1 border border-ink-primary/20 hover:bg-ink-primary/5 text-ink-primary font-sans text-xs font-bold py-3 rounded-md uppercase tracking-widest flex items-center justify-center gap-2 transition-colors cursor-pointer">
                    <X className="h-4 w-4" /> Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
