import crypto from 'node:crypto';
import { z } from 'zod';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { presentProduct } from '../utils/presentProduct.js';

const imageSchema = z.object({
  url: z.string().url().max(2000),
  publicId: z.string().max(250).optional().default(''),
  alt: z.string().trim().max(200).optional().default(''),
});
const variantSchema = z.object({
  sku: z.string().trim().min(1).max(80),
  size: z.string().trim().min(1).max(40),
  color: z.string().trim().max(50).optional().default(''),
  stock: z.number().int().min(0).max(100000),
  _id: z.string().optional(),
});
const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(180).optional().or(z.literal('')),
  category: z.string().min(1),
  description: z.string().trim().min(10).max(5000),
  details: z.string().trim().max(3000).optional().default(''),
  price: z.number().min(0).max(10000000),
  compareAtPrice: z.number().min(0).max(10000000).nullable().optional().default(null),
  badge: z.string().trim().max(40).optional().default(''),
  featured: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
  mainImage: imageSchema,
  galleryImages: z.array(imageSchema).length(4, 'Add exactly four gallery images in addition to the main image.'),
  variants: z.array(variantSchema).min(1).max(100),
});
const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(100).optional().or(z.literal('')),
  description: z.string().trim().max(1200).optional().default(''),
  imageUrl: z.string().url().max(2000).optional().or(z.literal('')).default(''),
});

function toSlug(value) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 180);
}
function validationResponse(parsed, res) {
  if (parsed.success) return parsed.data;
  res.status(400).json({ message: parsed.error.issues[0]?.message || 'Please check the submitted fields.' });
  return null;
}

export async function listAdminProducts(req, res) {
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '50', 10) || 50));
  const products = await Product.find().populate('category', 'name slug').sort({ updatedAt: -1 }).limit(limit).lean();
  res.json({ products: products.map(presentProduct) });
}

export async function createAdminProduct(req, res) {
  const payload = validationResponse(productSchema.safeParse(req.body), res);
  if (!payload) return;
  if (!mongoose.isValidObjectId(payload.category) || !(await Category.exists({ _id: payload.category, active: true }))) return res.status(400).json({ message: 'Select an active category.' });
  const slug = toSlug(payload.slug || payload.name);
  try {
    const product = await Product.create({ ...payload, slug, images: [] });
    const populated = await Product.findById(product._id).populate('category', 'name slug').lean();
    return res.status(201).json({ product: presentProduct(populated) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A product with this URL slug already exists. Choose a different slug.' });
    throw error;
  }
}

export async function updateAdminProduct(req, res) {
  const payload = validationResponse(productSchema.safeParse(req.body), res);
  if (!payload) return;
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid product ID.' });
  if (!mongoose.isValidObjectId(payload.category) || !(await Category.exists({ _id: payload.category, active: true }))) return res.status(400).json({ message: 'Select an active category.' });
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { ...payload, slug: toSlug(payload.slug || payload.name), images: [] }, { new: true, runValidators: true }).populate('category', 'name slug');
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    return res.json({ product: presentProduct(product) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A product with this URL slug already exists. Choose a different slug.' });
    throw error;
  }
}

export async function archiveAdminProduct(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid product ID.' });
  const product = await Product.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  return res.json({ message: 'Product archived.' });
}

export async function listAdminCategories(_req, res) {
  const categories = await Category.find().sort({ name: 1 }).lean();
  res.json({ categories });
}

export async function createAdminCategory(req, res) {
  const payload = validationResponse(categorySchema.safeParse(req.body), res);
  if (!payload) return;
  try {
    const category = await Category.create({ ...payload, slug: toSlug(payload.slug || payload.name), active: true });
    return res.status(201).json({ category });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A category with this URL slug already exists.' });
    throw error;
  }
}


export async function updateAdminCategory(req, res) {
  const payload = validationResponse(categorySchema.safeParse(req.body), res);
  if (!payload) return;
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid category ID.' });
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { ...payload, slug: toSlug(payload.slug || payload.name) },
      { new: true, runValidators: true },
    );
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    return res.json({ category });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A category with this URL slug already exists.' });
    throw error;
  }
}

export async function restoreAdminCategory(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid category ID.' });
  const category = await Category.findByIdAndUpdate(req.params.id, { active: true }, { new: true, runValidators: true });
  if (!category) return res.status(404).json({ message: 'Category not found.' });
  return res.json({ category, message: 'Category restored.' });
}

export async function archiveAdminCategory(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid category ID.' });
  const category = await Category.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!category) return res.status(404).json({ message: 'Category not found.' });
  return res.json({ message: 'Category archived.' });
}

export async function createCloudinarySignature(_req, res) {
  const { CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: apiSecret } = process.env;
  if (!cloudName || !apiKey || !apiSecret) return res.status(503).json({ message: 'Cloudinary is not configured. Add its cloud name, API key, and API secret to server/.env.' });
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = (process.env.CLOUDINARY_UPLOAD_FOLDER || 'noor/products').replace(/^\/+|\/+$/g, '');
  const params = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto.createHash('sha1').update(`${params}${apiSecret}`).digest('hex');
  return res.json({ cloudName, apiKey, timestamp, folder, signature });
}
