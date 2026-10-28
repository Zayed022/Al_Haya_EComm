import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order.js';
import { markOrderPaid, publicOrder, releaseReservedStock, reserveAndCreateOrder } from '../services/orderService.js';

function getRazorpayClient() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    const error = new Error('Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to server/.env.');
    error.status = 503;
    throw error;
  }
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
}

export async function createRazorpayOrder(req, res) {
  const client = getRazorpayClient();
  const { order, reservationToken } = await reserveAndCreateOrder(req.body, 'RAZORPAY');
  try {
    const payment = await client.orders.create({
      amount: Math.round(order.total * 100),
      currency: 'INR',
      receipt: order.orderNumber,
      notes: { orderNumber: order.orderNumber },
    });
    order.gatewayOrderId = payment.id;
    await order.save();
    return res.status(201).json({ keyId: process.env.RAZORPAY_KEY_ID, payment: { id: payment.id, amount: payment.amount, currency: payment.currency }, order: publicOrder(order), reservationToken });
  } catch (error) {
    await releaseReservedStock(order.orderNumber, reservationToken).catch((releaseError) => console.error('Failed to release stock after Razorpay order setup error:', releaseError));
    throw error;
  }
}

export async function verifyRazorpayPayment(req, res) {
  if (!process.env.RAZORPAY_KEY_SECRET) return res.status(503).json({ message: 'Razorpay is not configured.' });
  const { orderNumber, razorpay_order_id: razorpayOrderId, razorpay_payment_id: razorpayPaymentId, razorpay_signature: signature } = req.body || {};
  if (![orderNumber, razorpayOrderId, razorpayPaymentId, signature].every((value) => typeof value === 'string' && value.length > 0)) return res.status(400).json({ message: 'Payment verification details are incomplete.' });
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
  const suppliedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (suppliedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) return res.status(400).json({ message: 'Payment signature verification failed.' });
  const order = await markOrderPaid(orderNumber, razorpayOrderId, razorpayPaymentId);
  if (!order) return res.status(404).json({ message: 'Order reference not found.' });
  return res.json({ order: publicOrder(order) });
}

export async function cancelRazorpayOrder(req, res) {
  const { orderNumber, reservationToken } = req.body || {};
  if (!orderNumber || !reservationToken) return res.status(400).json({ message: 'Order cancellation details are incomplete.' });
  const released = await releaseReservedStock(orderNumber, reservationToken);
  return res.json({ message: released ? 'Payment cancelled and reserved stock released.' : 'No active reservation needed cancellation.' });
}

export async function razorpayWebhook(req, res) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) return res.status(503).send('Webhook secret not configured.');
  const signature = req.get('x-razorpay-signature') || '';
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  const supplied = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (!signature || supplied.length !== expectedBuffer.length || !crypto.timingSafeEqual(supplied, expectedBuffer)) return res.status(400).send('Invalid webhook signature.');
  const event = JSON.parse(rawBody.toString('utf8'));
  const paymentEntity = event.payload?.payment?.entity;
  if (event.event === 'payment.captured' && paymentEntity?.order_id) {
    const order = await Order.findOne({ gatewayOrderId: paymentEntity.order_id, paymentMethod: 'RAZORPAY' });
    if (order && order.paymentStatus !== 'paid') await markOrderPaid(order.orderNumber, paymentEntity.order_id, paymentEntity.id);
  }
  return res.json({ received: true });
}
