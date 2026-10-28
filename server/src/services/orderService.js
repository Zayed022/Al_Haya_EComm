import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { z } from 'zod';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

const customerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number.'),
  address: z.string().trim().min(8).max(250),
  landmark: z.string().trim().max(150).optional().default(''),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code.'),
});
const itemsSchema = z.array(z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
})).min(1).max(30);

export const SHIPPING_FREE_THRESHOLD = 2499;
export const SHIPPING_FEE = 99;

export function validateOrderPayload(body) {
  const parsedCustomer = customerSchema.safeParse(body?.customer || {});
  const parsedItems = itemsSchema.safeParse(body?.items || []);
  if (!parsedCustomer.success || !parsedItems.success) {
    const firstError = parsedCustomer.error?.issues[0]?.message || parsedItems.error?.issues[0]?.message || 'Please check your order details.';
    const error = new Error(firstError);
    error.status = 400;
    throw error;
  }
  return { customer: parsedCustomer.data, items: parsedItems.data };
}

function aggregateItems(items) {
  const aggregated = new Map();
  for (const item of items) {
    const key = `${item.productId}:${item.variantId}`;
    const existing = aggregated.get(key);
    if (existing) existing.quantity += item.quantity;
    else aggregated.set(key, { ...item });
  }
  return [...aggregated.values()];
}

function stockError(message) {
  const error = new Error(message);
  error.status = 409;
  return error;
}

function safeImage(product) {
  return product.mainImage?.url || product.images?.[0]?.url || '';
}

export async function reserveAndCreateOrder(body, paymentMethod) {
  const { customer, items: payloadItems } = validateOrderPayload(body);
  const items = aggregateItems(payloadItems);
  const orderNumber = `NOOR-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const reservationToken = paymentMethod === 'RAZORPAY' ? crypto.randomBytes(24).toString('hex') : '';
  const reservationTokenHash = reservationToken ? crypto.createHash('sha256').update(reservationToken).digest('hex') : '';
  const session = await mongoose.startSession();
  let createdOrder;

  try {
    await session.withTransaction(async () => {
      const snapshots = [];
      let subtotal = 0;
      for (const line of items) {
        if (!mongoose.isValidObjectId(line.productId)) throw stockError('One of the items in your bag is no longer available. Please refresh the collection.');
        const product = await Product.findOne({ _id: line.productId, active: true }).session(session);
        if (!product) throw stockError('One of the items in your bag is no longer available. Please refresh the collection.');
        const variant = product.variants.id(line.variantId);
        if (!variant) throw stockError(`${product.name} has changed. Please select its size and colour again.`);
        const updated = await Product.updateOne(
          { _id: product._id, active: true, variants: { $elemMatch: { _id: variant._id, stock: { $gte: line.quantity } } } },
          { $inc: { 'variants.$.stock': -line.quantity } },
          { session },
        );
        if (updated.modifiedCount !== 1) throw stockError(`Not enough stock for ${product.name} (${variant.color || variant.size}). Please update your bag.`);
        snapshots.push({
          product: product._id,
          variantId: String(variant._id),
          sku: variant.sku,
          slug: product.slug,
          name: product.name,
          image: safeImage(product),
          size: variant.size,
          color: variant.color,
          unitPrice: product.price,
          quantity: line.quantity,
        });
        subtotal += product.price * line.quantity;
      }
      const shipping = subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_FEE;
      const total = subtotal + shipping;
      const order = new Order({
        orderNumber,
        customer,
        items: snapshots,
        subtotal,
        shipping,
        discount: 0,
        total,
        paymentMethod,
        paymentStatus: 'pending',
        status: paymentMethod === 'COD' ? 'confirmed' : 'payment_pending',
        reservationTokenHash,
      });
      await order.save({ session });
      createdOrder = order;
    });
  } finally {
    await session.endSession();
  }

  return { order: createdOrder, reservationToken };
}

export function publicOrder(order) {
  return {
    orderNumber: order.orderNumber,
    items: order.items.map((item) => ({ name: item.name, slug: item.slug, image: item.image, size: item.size, color: item.color, unitPrice: item.unitPrice, quantity: item.quantity })),
    subtotal: order.subtotal,
    shipping: order.shipping,
    discount: order.discount,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.status,
    createdAt: order.createdAt,
  };
}

export async function releaseReservedStock(orderNumber, reservationToken) {
  const tokenHash = crypto.createHash('sha256').update(String(reservationToken || '')).digest('hex');
  const session = await mongoose.startSession();
  let released = false;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({ orderNumber, paymentMethod: 'RAZORPAY' }).session(session);
      if (!order || order.paymentStatus === 'paid' || order.stockReleased || order.status === 'cancelled') return;
      const expected = order.reservationTokenHash || '';
      const sameHash = expected.length === tokenHash.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(tokenHash));
      if (!sameHash) {
        const error = new Error('This payment reservation could not be verified.');
        error.status = 403;
        throw error;
      }
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.product, variants: { $elemMatch: { _id: item.variantId } } },
          { $inc: { 'variants.$.stock': item.quantity } },
          { session },
        );
      }
      order.stockReleased = true;
      order.status = 'cancelled';
      order.paymentStatus = 'failed';
      order.cancelledAt = new Date();
      await order.save({ session });
      released = true;
    });
  } finally {
    await session.endSession();
  }
  return released;
}

export async function markOrderPaid(orderNumber, gatewayOrderId, gatewayPaymentId) {
  const order = await Order.findOne({ orderNumber, paymentMethod: 'RAZORPAY' });
  if (!order) return null;
  if (order.paymentStatus === 'paid') return order;
  if (order.status === 'cancelled' || order.stockReleased) {
    const error = new Error('This order reservation has expired. Contact the store before attempting another payment.');
    error.status = 409;
    throw error;
  }
  if (gatewayOrderId && order.gatewayOrderId && order.gatewayOrderId !== gatewayOrderId) {
    const error = new Error('The payment order does not match this order reference.');
    error.status = 400;
    throw error;
  }
  order.gatewayOrderId = gatewayOrderId || order.gatewayOrderId;
  order.gatewayPaymentId = gatewayPaymentId;
  order.paymentStatus = 'paid';
  order.status = 'confirmed';
  order.reservationTokenHash = '';
  await order.save();
  return order;
}
