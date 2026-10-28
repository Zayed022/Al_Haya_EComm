import mongoose from 'mongoose';
import { z } from 'zod';
import ContactMessage from '../models/ContactMessage.js';

const publicMessageSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(30).optional().default(''),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(3000),
});

export async function createContactMessage(req, res) {
  const parsed = publicMessageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Please check the contact form.' });
  const message = await ContactMessage.create(parsed.data);
  return res.status(201).json({ message: 'Thank you for writing to us. Your message has reached the store team.', reference: String(message._id) });
}

export async function listContactMessages(req, res) {
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '50', 10) || 50));
  const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(limit).lean();
  return res.json({ messages });
}

export async function updateContactMessageStatus(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid message reference.' });
  const status = req.body?.status;
  if (!['new', 'read', 'closed'].includes(status)) return res.status(400).json({ message: 'Choose a valid message status.' });
  const message = await ContactMessage.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true }).lean();
  if (!message) return res.status(404).json({ message: 'Message not found.' });
  return res.json({ message });
}
