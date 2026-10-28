import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';

export async function summary(_req, res) {
  const [products, categories, stockRows, orders, revenueResult, recentOrders] = await Promise.all([
    Product.countDocuments({ active: true }),
    Category.countDocuments({ active: true }),
    Product.find({ active: true }).select('variants.stock').lean(),
    Order.countDocuments({ status: { $ne: 'cancelled' } }),
    Order.aggregate([
      { $match: { status: { $nin: ['cancelled', 'refunded'] }, $or: [{ paymentStatus: 'paid' }, { paymentMethod: 'COD', status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] } }] } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.find().sort({ createdAt: -1 }).limit(5).select('orderNumber customer.name total status paymentMethod createdAt').lean(),
  ]);
  let lowStock = 0;
  for (const product of stockRows) {
    if (product.variants.some((variant) => variant.stock <= 5)) lowStock += 1;
  }
  res.json({ products, categories, lowStock, orders, revenue: revenueResult[0]?.total || 0, recentOrders });
}
