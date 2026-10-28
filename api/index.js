import mongoose from 'mongoose';
import app from '../server/src/app.js';
import { connectDatabase } from '../server/src/config/db.js';

let connectionPromise;

async function ensureDatabase() {
  if (mongoose.connection.readyState === 1) return;
  if (!connectionPromise) {
    connectionPromise = connectDatabase().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }
  await connectionPromise;
}

export default async function handler(req, res) {
  try {
    // vercel.json forwards the original API path in the `path` query parameter.
    // Restore the expected Express URL and preserve the customer's original query string.
    const incomingUrl = new URL(req.url || '/', 'http://vercel.local');
    const forwardedPath = incomingUrl.searchParams.get('path');
    if (forwardedPath !== null) {
      incomingUrl.searchParams.delete('path');
      const routePath = `/api/${String(forwardedPath).replace(/^\/+/, '')}`.replace(/\/$/, '') || '/api';
      req.url = `${routePath}${incomingUrl.search ? incomingUrl.search : ''}`;
    }
    await ensureDatabase();
    return app(req, res);
  } catch (error) {
    console.error('Vercel API handler failed:', error);
    return res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'The API could not complete the request.' : error.message });
  }
}
