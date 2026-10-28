import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, FileDown, PackageCheck, Printer, RefreshCw, Search, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api.js';
import { formatCurrency } from '../utils/currency.js';

const statuses = ['all', 'payment_pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const paymentStatuses = ['all', 'pending', 'paid', 'failed', 'refunded'];
const money = (value) => formatCurrency(Number(value) || 0);
const dateTime = (value) => value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';

function escapeCsv(value) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [expandedId, setExpandedId] = useState('');
  const navigate = useNavigate();

  async function refresh() {
    setLoading(true); setError('');
    try {
      const query = new URLSearchParams({ limit: '250' });
      if (search.trim()) query.set('search', search.trim());
      if (status !== 'all') query.set('status', status);
      if (paymentStatus !== 'all') query.set('paymentStatus', paymentStatus);
      const result = await apiRequest(`/admin/orders?${query}`);
      setOrders(result.orders || []);
    } catch (requestError) { setError(requestError.message || 'Orders could not be loaded.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, [status, paymentStatus]);

  async function logout() {
    try { await apiRequest('/auth/logout', { method: 'POST' }); } catch { /* The session cookie can already be expired. */ }
    navigate('/admin', { replace: true });
  }

  const totals = useMemo(() => ({ revenue: orders.reduce((sum, order) => sum + Number(order.total || 0), 0), count: orders.length, pending: orders.filter((order) => order.paymentStatus === 'pending').length }), [orders]);

  function downloadCsv() {
    const columns = ['Order number', 'Order date', 'Customer', 'Email', 'Phone', 'Address', 'Items', 'Subtotal INR', 'Shipping INR', 'Discount INR', 'Total INR', 'Payment method', 'Payment status', 'Order status'];
    const rows = orders.map((order) => [order.orderNumber, dateTime(order.createdAt), order.customer?.name, order.customer?.email, order.customer?.phone, [order.customer?.address, order.customer?.landmark, order.customer?.city, order.customer?.state, order.customer?.postalCode].filter(Boolean).join(', '), order.items?.map((item) => `${item.name} (${item.color || ''} ${item.size || ''}) x${item.quantity}`).join('; '), order.subtotal, order.shipping, order.discount, order.total, order.paymentMethod, order.paymentStatus, order.status]);
    const content = '\uFEFF' + [columns, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `noor-orders-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  return <div className="admin-shell"><aside className="admin-sidebar"><Link to="/" className="wordmark">NOOR<span>®</span></Link><p className="admin-side-label">WORKSPACE</p><Link className="admin-nav-item" to="/admin/dashboard"><ShoppingBag size={17}/> Overview</Link><Link className="admin-nav-item" to="/admin/products">Products & media</Link><Link className="admin-nav-item active" to="/admin/orders"><PackageCheck size={17}/> Orders</Link><Link className="admin-nav-item" to="/admin/messages">Contact inbox</Link><button className="admin-nav-item logout-button" type="button" onClick={logout}>Sign out</button><div className="admin-user"><span>SA</span><div><strong>Store admin</strong><small>Administrator</small></div></div></aside><main className="admin-main"><header className="admin-topbar"><div><p className="eyebrow">COMMERCE OPERATIONS</p><h1>Orders & fulfilment</h1></div><div className="admin-topbar-actions"><button className="export-button" type="button" onClick={refresh} disabled={loading}><RefreshCw size={14}/> Refresh</button><button className="export-button" type="button" onClick={() => window.print()}><Printer size={14}/> Print / PDF</button><button className="admin-primary-button" type="button" onClick={downloadCsv}><Download size={14}/> Export CSV</button></div></header>
    <section className="admin-order-stats"><article><span>Visible orders</span><strong>{totals.count}</strong></article><article><span>Visible order value</span><strong>{money(totals.revenue)}</strong></article><article><span>Payment pending</span><strong>{totals.pending}</strong></article></section>
    <section className="admin-orders-panel"><div className="admin-orders-toolbar"><form onSubmit={(event) => { event.preventDefault(); refresh(); }}><Search size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Order number, customer, email or phone"/><button type="submit">Search</button></form><label>Order status<select value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((value) => <option key={value} value={value}>{value === 'all' ? 'All statuses' : value.replaceAll('_', ' ')}</option>)}</select></label><label>Payment<select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)}>{paymentStatuses.map((value) => <option key={value} value={value}>{value === 'all' ? 'All payments' : value}</option>)}</select></label></div>
      {error && <div className="admin-error">{error}</div>}{loading ? <div className="admin-loading">Loading order records…</div> : orders.length ? <div className="admin-order-list">{orders.map((order) => <article className="admin-order-card" key={order._id}><button className="admin-order-summary" type="button" onClick={() => setExpandedId(expandedId === order._id ? '' : order._id)} aria-expanded={expandedId === order._id}><span className="admin-order-number"><strong>{order.orderNumber}</strong><small>{dateTime(order.createdAt)}</small></span><span className="admin-order-customer"><strong>{order.customer?.name || 'Customer'}</strong><small>{order.customer?.phone || order.customer?.email}</small></span><span className="admin-order-price"><strong>{money(order.total)}</strong><small>{order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Razorpay'} · {order.paymentStatus}</small></span><span className={`admin-status-pill ${['cancelled', 'refunded'].includes(order.status) ? 'archived' : 'live'}`}>{order.status?.replaceAll('_', ' ')}</span><span className="admin-order-expand">{expandedId === order._id ? '−' : '+'}</span></button>{expandedId === order._id && <div className="admin-order-details"><div className="admin-order-address"><p className="eyebrow">DELIVERY ADDRESS</p><strong>{order.customer?.name}</strong><span>{order.customer?.address}</span>{order.customer?.landmark && <span>{order.customer.landmark}</span>}<span>{[order.customer?.city, order.customer?.state, order.customer?.postalCode].filter(Boolean).join(', ')}</span><a href={`mailto:${order.customer?.email}`}>{order.customer?.email}</a></div><div className="admin-order-lines"><p className="eyebrow">ITEMS IN ORDER</p>{order.items?.map((item, index) => <div className="admin-order-line" key={`${item.variantId}-${index}`}><img src={item.image} alt=""/><div><strong>{item.name}</strong><small>{item.color} {item.size} · Qty {item.quantity} · SKU {item.sku || '—'}</small></div><strong>{money(item.unitPrice * item.quantity)}</strong></div>)}<div className="admin-order-totals"><span>Subtotal <strong>{money(order.subtotal)}</strong></span><span>Shipping <strong>{money(order.shipping)}</strong></span><span>Discount <strong>{money(order.discount)}</strong></span><span>Total <strong>{money(order.total)}</strong></span></div></div></div>}</article>)}</div> : <div className="admin-message-empty"><PackageCheck size={25}/><h2>No orders found.</h2><p>Try changing the search or status filters.</p></div>}
    </section><p className="admin-disclaimer">This page reviews order records and supports CSV export. Status transitions, refunds, and stock restocking should be implemented with explicit business rules before staff can modify orders.</p><Link className="admin-back-link" to="/admin/dashboard"><ArrowLeft size={14}/> Back to overview</Link></main></div>;
}
