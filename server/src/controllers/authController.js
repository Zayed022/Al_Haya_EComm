import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';

const loginSchema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(200) });
const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 1000 * 60 * 60 * 8 });

export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Enter a valid email and password.' });
  const email = parsed.data.email.toLowerCase();
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || user.role !== 'admin' || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid administrator credentials.' });
  }
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h', issuer: 'modest-store' });
  res.cookie('store_session', token, cookieOptions());
  return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

export async function me(req, res) { return res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role } }); }
export async function logout(_req, res) { res.clearCookie('store_session', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' }); return res.json({ message: 'Signed out.' }); }

export async function bootstrapAdmin(req, res) {
  if (!process.env.ADMIN_BOOTSTRAP_KEY) return res.status(404).json({ message: 'Not found.' });
  if (await User.exists({ role: 'admin' })) return res.status(409).json({ message: 'An administrator already exists.' });
  const schema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().email().max(254), password: z.string().min(12).max(200), bootstrapKey: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || parsed.data.bootstrapKey !== process.env.ADMIN_BOOTSTRAP_KEY) return res.status(400).json({ message: 'Invalid bootstrap request.' });
  const { name, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ name, email: email.toLowerCase(), passwordHash, role: 'admin' });
  return res.status(201).json({ message: 'Administrator created. Remove ADMIN_BOOTSTRAP_KEY from environment settings now.' });
}
