import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.store_session;
    if (!token) return res.status(401).json({ message: 'Please sign in.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('name email role');
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Administrator access required.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}
