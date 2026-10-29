const DEFAULT_LOCAL_API = 'http://localhost:4000/api';

const IS_LOCAL_BROWSER =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');

const API_BASE = IS_LOCAL_BROWSER
  ? (import.meta.env.VITE_API_URL || DEFAULT_LOCAL_API).replace(/\/$/, '')
  : '/api';


export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`, {
    credentials: 'include',
    ...options,
    headers: { ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || `Request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return payload;
}
