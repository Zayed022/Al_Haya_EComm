import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { apiRequest } from '../services/api.js';

export default function AdminLogin() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const navigate = useNavigate();
  async function handleSubmit(event) { event.preventDefault(); setError(''); setBusy(true); try { await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); navigate('/admin/dashboard'); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  return <main className="admin-login-page"><Link to="/" className="back-home"><ArrowLeft size={16}/> Back to storefront</Link><section className="login-card"><div className="login-mark">N<span>®</span></div><p className="eyebrow">PRIVATE ACCESS</p><h1>Welcome <em>back.</em></h1><p className="login-subtitle">Sign in to manage your store, inventory, and orders.</p><form onSubmit={handleSubmit}><label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required/></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required/></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-dark login-submit" disabled={busy}>{busy ? 'Signing in…' : <><LockKeyhole size={16}/> Secure sign in</>}</button></form><small>Authorised store personnel only.</small></section></main>;
}
