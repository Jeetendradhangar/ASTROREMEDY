'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../lib/api';
import Link from 'next/link';
import { ArrowLeft, Package, Sparkles, LogOut, CheckCircle, AlertCircle, RefreshCw, XCircle } from 'lucide-react';

interface OrderItem {
  id: number;
  product: { id: number; name: string; price: string };
  quantity: number;
  price: string;
}

interface Order {
  id: number;
  user_details?: { email: string; first_name: string; last_name: string; phone_number: string | null };
  user: number;
  status: 'draft_lock' | 'pending_whatsapp' | 'received' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: string;
  shipping_address: string;
  tracking_number: string | null;
  created_at: string;
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'cancelled'>('active');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/orders/');
      const orderList = Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
      setOrders(orderList);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch shipments catalog.');
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
    fetchOrders();
  }, [isAuthenticated, user, router]);

  const handleStatusChange = async (orderId: number, newStatus: string, currentTracking: string | null) => {
    setUpdatingId(orderId);
    setError('');
    setSuccess('');
    try {
      await api.patch(`/api/orders/${orderId}/status/`, {
        status: newStatus,
        tracking_number: currentTracking || ''
      });
      setSuccess(`Order #${orderId} status updated to ${newStatus}.`);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
      );
    } catch (err: any) {
      console.error(err);
      setError('Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTrackingUpdate = async (orderId: number, currentStatus: string, newTracking: string) => {
    setUpdatingId(orderId);
    setError('');
    setSuccess('');
    try {
      await api.patch(`/api/orders/${orderId}/status/`, {
        status: currentStatus,
        tracking_number: newTracking
      });
      setSuccess(`Order #${orderId} tracking number updated successfully.`);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, tracking_number: newTracking } : o))
      );
    } catch (err: any) {
      console.error(err);
      setError('Failed to update tracking details.');
    } finally {
      setUpdatingId(null);
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
              <Sparkles className="h-4 w-4" /> Shipments Console
            </div>
            <h1 className="font-display-h1 text-2xl text-ink-primary">Remedy Orders List</h1>
            <p className="text-mystic-muted font-sans text-xs uppercase tracking-wider">Astrologer: {user?.email}</p>
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

        {loading ? (
          <div className="nm-card bg-parchment-bg p-6 divide-y divide-ink-primary/10">
            {[1, 2].map((i) => (
              <div key={i} className="py-6 flex flex-col md:flex-row gap-6 justify-between animate-pulse">
                <div className="space-y-3 flex-1">
                  <div className="h-5 bg-ink-primary/15 rounded w-24"></div>
                  <div className="h-4 bg-ink-primary/10 rounded w-48"></div>
                  <div className="h-4 bg-ink-primary/10 rounded w-64"></div>
                </div>
                <div className="w-full md:w-64 h-32 bg-ink-primary/5 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="nm-card bg-parchment-bg p-12 text-center space-y-4">
            <Package className="h-10 w-10 text-mystic-muted mx-auto" />
            <h3 className="font-display-h3 text-base text-ink-primary">No remedy orders found</h3>
            <p className="text-mystic-muted font-garamond text-sm">When users checkout recommended products on WhatsApp, their shipments catalog will populate here.</p>
          </div>
        ) : (
          <>
            {/* Tab Toggle */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  activeTab === 'active'
                    ? 'bg-ink-primary text-gold-accent shadow-md'
                    : 'nm-btn text-mystic-muted hover:text-gold-text'
                }`}
              >
                Active Orders ({orders.filter(o => o.status !== 'cancelled').length})
              </button>
              <button
                onClick={() => setActiveTab('cancelled')}
                className={`px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  activeTab === 'cancelled'
                    ? 'bg-ink-primary text-danger shadow-md'
                    : 'nm-btn text-mystic-muted hover:text-danger'
                }`}
              >
                <span className="flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5" /> Cancelled ({orders.filter(o => o.status === 'cancelled').length})</span>
              </button>
            </div>

            {/* Filtered Orders */}
            {orders.filter(o => activeTab === 'cancelled' ? o.status === 'cancelled' : o.status !== 'cancelled').length === 0 ? (
              <div className="nm-card bg-parchment-bg p-12 text-center space-y-4">
                <Package className="h-10 w-10 text-mystic-muted mx-auto" />
                <h3 className="font-display-h3 text-base text-ink-primary">
                  {activeTab === 'cancelled' ? 'No cancelled orders' : 'No active orders'}
                </h3>
                <p className="text-mystic-muted font-garamond text-sm">
                  {activeTab === 'cancelled'
                    ? 'Cancelled orders by seekers will appear here.'
                    : 'When users checkout recommended products on WhatsApp, their shipments catalog will populate here.'}
                </p>
              </div>
            ) : (
          <div className="nm-card bg-parchment-bg overflow-hidden">
            <div className="divide-y divide-ink-primary/10">
              {orders.filter(o => activeTab === 'cancelled' ? o.status === 'cancelled' : o.status !== 'cancelled').map((o, index) => (
                <div 
                  key={o.id} 
                  className={`p-6 flex flex-col md:flex-row gap-6 justify-between items-start transition-colors ${
                    index % 2 === 0 ? 'bg-transparent' : 'bg-ink-primary/5'
                  }`}
                >
                  
                  <div className="space-y-3 flex-1 w-full">
                    <div className="flex items-center gap-4 pb-2 border-b border-gold-accent/15">
                      <span className="font-display-h3 text-[10px] text-gold-accent tracking-widest bg-ink-primary px-2 py-0.5 rounded-md">
                        Order #{o.id}
                      </span>
                      <span className="text-[10px] font-sans text-mystic-muted uppercase tracking-wider">
                        Placed: {new Date(o.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="font-sans text-xs text-ink-primary space-y-1">
                      <p><strong>Customer:</strong> {o.user_details ? `${o.user_details.first_name} ${o.user_details.last_name || ''}`.trim() : `User #${o.user}`}</p>
                      <p><strong>Phone:</strong> {o.user_details?.phone_number || 'N/A'}</p>
                      <p><strong>Address:</strong> {o.shipping_address}</p>
                    </div>

                    <div className="border-t border-gold-accent/15 pt-3 mt-3">
                      <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-mystic-muted block mb-1">Purchased Remedy</span>
                      {o.items && o.items.map((item, idx) => (
                        <div key={idx} className="font-sans text-xs text-ink-primary flex justify-between">
                          <span>{item.product?.name} (Qty: {item.quantity})</span>
                          <span className="font-semibold text-mystic-muted">₹{item.price}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-sans text-xs text-ink-primary font-bold pt-2 border-t border-dashed border-gold-accent/15 mt-2">
                        <span>Total Amount</span>
                        <span className="text-mystic-muted">₹{o.total_amount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Actions */}
                  <div className="w-full md:w-64 border border-ink-primary/20 bg-parchment-canvas rounded-lg p-4 space-y-4 shrink-0">
                    <div>
                      <label className="text-ink-primary/80 font-sans font-semibold text-[9px] uppercase tracking-wider block mb-1.5">Shipping Status</label>
                      <select
                        value={o.status}
                        disabled={updatingId === o.id}
                        onChange={(e) => handleStatusChange(o.id, e.target.value, o.tracking_number)}
                        className="w-full bg-parchment-canvas border border-ink-primary/20 rounded-md px-3 py-2 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-gold-accent"
                      >
                        <option value="received">Order Received</option>
                        <option value="packed">Packed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-ink-primary/80 font-sans font-semibold text-[9px] uppercase tracking-wider block mb-1.5">DTDC Tracking Number</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. DTDC49202"
                          defaultValue={o.tracking_number || ''}
                          disabled={updatingId === o.id}
                          onBlur={(e) => handleTrackingUpdate(o.id, o.status, e.target.value)}
                          className="w-full bg-parchment-canvas border border-ink-primary/20 rounded-md px-3 py-2 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-gold-accent"
                        />
                      </div>
                      <span className="text-[9px] text-mystic-muted italic font-sans mt-1 block">Press Tab or click away to save.</span>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
