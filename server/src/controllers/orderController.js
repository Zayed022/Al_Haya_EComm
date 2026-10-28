import { reserveAndCreateOrder, publicOrder } from '../services/orderService.js';

export async function createCodOrder(req, res) {
  if (req.body?.paymentMethod && req.body.paymentMethod !== 'COD') return res.status(400).json({ message: 'Use the online payment endpoint for Razorpay orders.' });
  const { order } = await reserveAndCreateOrder(req.body, 'COD');
  return res.status(201).json({ order: publicOrder(order) });
}
