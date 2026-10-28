import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import AdminLogin from './AdminLogin.jsx';
import { apiRequest } from '../services/api.js';

export default function AdminEntry() {
  const [state, setState] = useState('checking');
  useEffect(() => {
    let alive = true;
    apiRequest('/auth/me').then(() => { if (alive) setState('authenticated'); }).catch(() => { if (alive) setState('guest'); });
    return () => { alive = false; };
  }, []);
  if (state === 'authenticated') return <Navigate to="/admin/dashboard" replace/>;
  if (state === 'guest') return <AdminLogin/>;
  return <main className="admin-entry-loading"><span><LockKeyhole size={20}/></span><p>Verifying secure store access…</p></main>;
}
