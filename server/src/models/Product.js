import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  sku: { type: String, required: true, trim: true },
  size: { type: String, default: 'One size' },
  color: { type: String, default: '' },
  stock: { type: Number, min: 0, default: 0 },
}, { _id: true });

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true },
  publicId: { type: String, default: '' },
  alt: { type: String, default: '' },
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160, index: 'text' },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, required: true, maxlength: 5000 },
  details: { type: String, default: '', maxlength: 3000 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0, default: null },
  badge: { type: String, default: '', maxlength: 40 },
  mainImage: { url: { type: String, default: '' }, publicId: { type: String, default: '' }, alt: { type: String, default: '' } },
  galleryImages: { type: [imageSchema], default: [] },
  // Legacy field is kept so existing starter records continue to display during migration.
  images: { type: [imageSchema], default: [] },
  variants: { type: [variantSchema], default: [] },
  active: { type: Boolean, default: true, index: true },
  featured: { type: Boolean, default: false, index: true },
}, { timestamps: true });

productSchema.index({ category: 1, active: 1, createdAt: -1 });
productSchema.index({ price: 1, active: 1 });

export default mongoose.model('Product', productSchema);
