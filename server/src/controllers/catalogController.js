import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { presentProduct } from '../utils/presentProduct.js';

export async function listCategories(_req, res) {
  const categories = await Category.find({ active: true }).sort({ name: 1 }).lean();
  res.json({ categories });
}

export async function listProducts(req, res) {
  const { category, search, page = '1', limit = '12', sort = 'featured' } = req.query;
  const safeLimit = Math.min(48, Math.max(1, Number.parseInt(limit, 10) || 12));
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const filter = { active: true };
  if (category) {
    const categoryDoc = await Category.findOne({ slug: String(category).toLowerCase(), active: true }).select('_id');
    if (!categoryDoc) return res.json({ products: [], page: safePage, pages: 0, total: 0 });
    filter.category = categoryDoc._id;
  }
  if (search && String(search).trim()) filter.$text = { $search: String(search).trim().slice(0, 100) };
  const sortBy = sort === 'price-low' ? { price: 1 } : sort === 'price-high' ? { price: -1 } : sort === 'newest' ? { createdAt: -1 } : { featured: -1, createdAt: -1 };
  const [products, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug imageUrl').sort(sortBy).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ products: products.map(presentProduct), page: safePage, pages: Math.ceil(total / safeLimit), total });
}

export async function getProductBySlug(req, res) {
  const product = await Product.findOne({ slug: String(req.params.slug).toLowerCase(), active: true }).populate('category', 'name slug imageUrl').lean();
  if (!product) return res.status(404).json({ message: 'This product could not be found.' });
  return res.json({ product: presentProduct(product) });
}
