import Order from '../models/Order.js';

function escapeRegExp(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 100); }

export async function listAdminOrders(req, res) {
  const limit = Math.min(250, Math.max(1, Number.parseInt(req.query.limit || '100', 10) || 100));
  const filter = {};
  const status = String(req.query.status || '').trim();
  const paymentStatus = String(req.query.paymentStatus || '').trim();
  if (['payment_pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(status)) filter.status = status;
  if (['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)) filter.paymentStatus = paymentStatus;
  const search = String(req.query.search || '').trim();
  if (search) {
    const pattern = new RegExp(escapeRegExp(search), 'i');
    filter.$or = [{ orderNumber: pattern }, { 'customer.name': pattern }, { 'customer.email': pattern }, { 'customer.phone': pattern }];
  }
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  return res.json({ orders, count: orders.length, limit });
}
