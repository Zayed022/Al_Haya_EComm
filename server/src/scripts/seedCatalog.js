import 'dotenv/config';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { connectDatabase } from '../config/db.js';

const imageSet = [
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43e?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=85',
];
const catalog = [
  { name: 'The Layla Abaya', slug: 'the-layla-abaya', category: 'abaya', price: 2890, compareAtPrice: 3490, description: 'A fluid, everyday abaya with a beautifully relaxed drape. Designed to move with you from slow mornings to late evenings.', details: 'Soft premium crepe · Relaxed silhouette · Front open · Lightweight feel', badge: 'BESTSELLER', images: [0, 2, 4, 5, 1], colors: ['Onyx', 'Mocha'], sizes: ['S', 'M', 'L', 'XL'], featured: true },
  { name: 'Noor Crochet Set', slug: 'noor-crochet-set', category: 'crochet', price: 3250, compareAtPrice: 3890, description: 'An airy, hand-finished crochet set with a soft texture and an easy, graceful fit.', details: 'Cotton-blend crochet · Two-piece set · Breathable texture · Hand-finished details', badge: 'NEW ARRIVAL', images: [7, 3, 5, 4, 6], colors: ['Oat', 'Cream'], sizes: ['S', 'M', 'L'], featured: true },
  { name: 'The Saira Abaya', slug: 'the-saira-abaya', category: 'abaya', price: 3490, description: 'A refined silhouette with subtle texture, made for the occasions you want to remember.', details: 'Textured nida · Statement cuffs · Full-length silhouette · Soft inner finish', badge: 'LIMITED EDIT', images: [2, 0, 4, 1, 5], colors: ['Sand', 'Black'], sizes: ['S', 'M', 'L', 'XL'], featured: true },
  { name: 'Everyday Crochet', slug: 'everyday-crochet', category: 'crochet', price: 2190, compareAtPrice: 2590, description: 'The easy layer you will keep reaching for. Lightweight, tactile, and effortlessly styled.', details: 'Open-knit texture · Relaxed fit · Easy layering · Soft-touch yarn', badge: 'EVERYDAY EDIT', images: [6, 7, 3, 5, 4], colors: ['Cream', 'Taupe'], sizes: ['S', 'M', 'L'], featured: true },
  { name: 'Zara Occasion Abaya', slug: 'zara-occasion-abaya', category: 'abaya', price: 4290, description: 'A polished occasion piece with an elegant finish and generous movement through the hem.', details: 'Occasion crepe · Draped sleeve · Concealed fastening · Full-length', badge: 'OCCASION', images: [1, 2, 0, 5, 4], colors: ['Midnight', 'Espresso'], sizes: ['S', 'M', 'L', 'XL'] },
  { name: 'The Cotton Crochet Layer', slug: 'cotton-crochet-layer', category: 'crochet', price: 2490, description: 'A softly structured crochet layer that brings texture to the simplest outfit.', details: 'Cotton-rich yarn · Textured open stitch · Layering piece · Easy care', badge: 'JUST IN', images: [5, 6, 7, 3, 2], colors: ['Natural', 'Black'], sizes: ['S', 'M', 'L'] },
  { name: 'Amina Everyday Abaya', slug: 'amina-everyday-abaya', category: 'abaya', price: 2790, compareAtPrice: 3190, description: 'An uncomplicated essential with a clean line, understated details, and day-long comfort.', details: 'Matte nida · Side pockets · Easy-care fabric · Regular fit', badge: 'CUSTOMER FAVOURITE', images: [4, 0, 1, 2, 5], colors: ['Olive', 'Black'], sizes: ['S', 'M', 'L', 'XL'] },
  { name: 'Soft Knit Crochet Dress', slug: 'soft-knit-crochet-dress', category: 'crochet', price: 2990, description: 'A soft, beautifully textured dress that feels considered without feeling overdone.', details: 'Soft knit texture · Full length · Easy movement · Layer-friendly', badge: 'TEXTURE STORY', images: [3, 7, 6, 5, 4], colors: ['Oat', 'Blush'], sizes: ['S', 'M', 'L'] },
];

const image = (index, alt) => ({ url: imageSet[index], alt });

async function seed() {
  await connectDatabase();
  const categoryMap = {};
  const categories = [
    { name: 'Abaya', slug: 'abaya', description: 'Modern classics, made for every day.', imageUrl: imageSet[0] },
    { name: 'Crochet', slug: 'crochet', description: 'Thoughtful texture, easy silhouettes.', imageUrl: imageSet[7] },
  ];
  for (const categoryData of categories) {
    const category = await Category.findOneAndUpdate({ slug: categoryData.slug }, { $set: { ...categoryData, active: true } }, { new: true, upsert: true, setDefaultsOnInsert: true });
    categoryMap[category.slug] = category;
  }
  for (const item of catalog) {
    const { images, colors, sizes, category, ...details } = item;
    const variants = colors.flatMap((color, colorIndex) => sizes.map((size, sizeIndex) => ({ sku: `${item.slug.toUpperCase().replace(/-/g, '').slice(0, 10)}-${colorIndex + 1}-${size}`, color, size, stock: Math.max(0, 14 - colorIndex * 2 - (sizeIndex % 2)) })));
    const record = {
      ...details,
      category: categoryMap[category]._id,
      mainImage: image(images[0], `${item.name} main product view`),
      galleryImages: images.slice(1, 5).map((index, galleryIndex) => image(index, `${item.name} detail view ${galleryIndex + 1}`)),
      images: [],
      variants,
      active: true,
    };
    await Product.findOneAndUpdate({ slug: item.slug }, { $set: record }, { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true });
    console.log(`Seeded: ${item.name} (five product images)`);
  }
  console.log(`Done. Seeded ${catalog.length} products and ${categories.length} categories.`);
}

seed().catch((error) => {
  console.error('Catalog seed failed:', error);
  process.exitCode = 1;
}).finally(async () => {
  await mongoose.disconnect().catch(() => {});
});
