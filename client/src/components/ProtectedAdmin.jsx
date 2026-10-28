import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { apiRequest } from '../services/api.js';
export default function ProtectedAdmin({ children }) {
  const [state, setState] = useState('checking');
  useEffect(() => { let active = true; apiRequest('/auth/me').then(() => active && setState('allowed')).catch(() => active && setState('denied')); return () => { active = false; }; }, []);
  if (state === 'checking') return <div className="admin-loading">Checking secure access…</div>;
  if (state === 'denied') return <Navigate to="/admin" replace />;
  return children;
}
