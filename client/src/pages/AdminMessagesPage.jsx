import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Inbox, Mail, MessageCircle, PackageCheck, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api.js';

const statuses = ['new', 'read', 'closed'];

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  async function refresh() {
    setLoading(true);
    setError('');
    try { const response = await apiRequest('/admin/contact-messages?limit=100'); setMessages(response.messages || []); }
    catch (requestError) { setError(requestError.message || 'Messages could not be loaded.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, []);

  async function logout() { try { await apiRequest('/auth/logout', { method: 'POST' }); } finally { navigate('/admin', { replace: true }); } }

  async function updateStatus(id, status) {
    try {
      const result = await apiRequest(`/admin/contact-messages/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setMessages((current) => current.map((message) => message._id === id ? result.message : message));
    } catch (requestError) { setError(requestError.message || 'Could not update message status.'); }
  }

  const visible = messages.filter((message) => filter === 'all' || message.status === filter);
  const dateFormat = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return <div className="admin-shell"><aside className="admin-sidebar"><Link to="/" className="wordmark">NOOR<span>®</span></Link><p className="admin-side-label">WORKSPACE</p><Link className="admin-nav-item" to="/admin/dashboard"><Inbox size={17}/> Overview</Link><Link className="admin-nav-item" to="/admin/products">Products & media</Link><Link className="admin-nav-item" to="/admin/orders"><PackageCheck size={17}/> Orders</Link><Link className="admin-nav-item active" to="/admin/messages"><Mail size={17}/> Contact inbox</Link><button className="admin-nav-item logout-button" type="button" onClick={logout}>Sign out</button><div className="admin-user"><span>SA</span><div><strong>Store admin</strong><small>Administrator</small></div></div></aside><main className="admin-main"><header className="admin-topbar"><div><p className="eyebrow">CUSTOMER CARE</p><h1>Contact inbox</h1></div><button className="export-button" type="button" onClick={refresh} disabled={loading}><RefreshCw size={15}/> Refresh</button></header><div className="admin-message-intro"><div><span><MessageCircle size={19}/></span><div><strong>{messages.filter((message) => message.status === 'new').length} new message(s)</strong><p>Requests sent from the website contact form.</p></div></div><label>Show<select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All messages</option>{statuses.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select></label></div>{error && <div className="admin-error">{error}</div>}{loading ? <div className="admin-loading">Loading customer messages…</div> : visible.length ? <section className="admin-message-list">{visible.map((message) => <article className={`admin-message-card status-${message.status}`} key={message._id}><div className="admin-message-card-top"><div><span className={`admin-message-status ${message.status}`}>{message.status}</span><small>{dateFormat.format(new Date(message.createdAt))}</small></div><select aria-label={`Status for ${message.subject}`} value={message.status} onChange={(event) => updateStatus(message._id, event.target.value)}>{statuses.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select></div><h2>{message.subject}</h2><p className="admin-message-body">{message.message}</p><div className="admin-message-contact"><strong>{message.name}</strong><a href={`mailto:${message.email}`}><Mail size={13}/>{message.email}</a>{message.phone && <span>{message.phone}</span>}</div><div className="admin-message-card-foot"><span>Reference {String(message._id).slice(-8).toUpperCase()}</span>{message.status !== 'closed' && <button type="button" onClick={() => updateStatus(message._id, message.status === 'new' ? 'read' : 'closed')}><Check size={13}/>{message.status === 'new' ? 'Mark as read' : 'Close message'}</button>}</div></article>)}</section> : <div className="admin-message-empty"><Mail size={25}/><h2>No messages here.</h2><p>New contact-form requests will appear here.</p><Link to="/contact" className="view-store-link">View contact page</Link></div>}<Link className="admin-back-link" to="/admin/dashboard"><ArrowLeft size={14}/> Back to overview</Link></main></div>;
}
