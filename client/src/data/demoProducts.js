const image = (url, alt = '') => ({ url, alt });
const looks = [
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43e?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=85',
];

const make = (id, name, slug, categoryName, categorySlug, price, compareAtPrice, description, detail, tag, images, colors = ['Onyx'], sizes = ['S', 'M', 'L', 'XL'], featured = false) => ({
  _id: `demo-${id}`,
  name,
  slug,
  category: { name: categoryName, slug: categorySlug },
  price,
  compareAtPrice,
  description,
  details: detail,
  mainImage: image(images[0], `${name} — main view`),
  galleryImages: images.slice(1, 5).map((url, index) => image(url, `${name} — detail view ${index + 1}`)),
  images: images.slice(0, 5).map((url, index) => image(url, `${name} — view ${index + 1}`)),
  variants: colors.flatMap((color, colorIndex) => sizes.map((size) => ({
    _id: `${id}-${color.toLowerCase()}-${size.toLowerCase()}`,
    sku: `${id.toUpperCase()}-${colorIndex + 1}-${size}`,
    size,
    color,
    stock: 18 - colorIndex * 3,
  }))),
  active: true,
  featured,
  stockCount: colors.length * sizes.length * 12,
});

export const demoProducts = [
  make('layla', 'The Layla Abaya', 'the-layla-abaya', 'Abaya', 'abaya', 2890, 3490, 'A fluid, everyday abaya with a beautifully relaxed drape. Designed to move with you from slow mornings to late evenings.', 'Soft premium crepe · Relaxed silhouette · Front open · Lightweight feel', 'BESTSELLER', [looks[0], looks[2], looks[4], looks[5], looks[1]], ['Onyx', 'Mocha'], ['S', 'M', 'L', 'XL'], true),
  make('noor-crochet', 'Noor Crochet Set', 'noor-crochet-set', 'Crochet', 'crochet', 3250, 3890, 'An airy, hand-finished crochet set with a soft texture and an easy, graceful fit.', 'Cotton-blend crochet · Two-piece set · Breathable texture · Hand-finished details', 'NEW ARRIVAL', [looks[7], looks[3], looks[5], looks[4], looks[6]], ['Oat', 'Cream'], ['S', 'M', 'L'], true),
  make('saira', 'The Saira Abaya', 'the-saira-abaya', 'Abaya', 'abaya', 3490, null, 'A refined silhouette with subtle texture, made for the occasions you want to remember.', 'Textured nida · Statement cuffs · Full-length silhouette · Soft inner finish', 'LIMITED EDIT', [looks[2], looks[0], looks[4], looks[1], looks[5]], ['Sand', 'Black'], ['S', 'M', 'L', 'XL'], true),
  make('everyday-crochet', 'Everyday Crochet', 'everyday-crochet', 'Crochet', 'crochet', 2190, 2590, 'The easy layer you will keep reaching for. Lightweight, tactile, and effortlessly styled.', 'Open-knit texture · Relaxed fit · Easy layering · Soft-touch yarn', 'EVERYDAY EDIT', [looks[6], looks[7], looks[3], looks[5], looks[4]], ['Cream', 'Taupe'], ['S', 'M', 'L'], true),
  make('zara', 'Zara Occasion Abaya', 'zara-occasion-abaya', 'Abaya', 'abaya', 4290, null, 'A polished occasion piece with an elegant finish and generous movement through the hem.', 'Occasion crepe · Draped sleeve · Concealed fastening · Full-length', 'OCCASION', [looks[1], looks[2], looks[0], looks[5], looks[4]], ['Midnight', 'Espresso'], ['S', 'M', 'L', 'XL']),
  make('cotton-crochet', 'The Cotton Crochet Layer', 'cotton-crochet-layer', 'Crochet', 'crochet', 2490, null, 'A softly structured crochet layer that brings texture to the simplest outfit.', 'Cotton-rich yarn · Textured open stitch · Layering piece · Easy care', 'JUST IN', [looks[5], looks[6], looks[7], looks[3], looks[2]], ['Natural', 'Black'], ['S', 'M', 'L']),
  make('amina', 'Amina Everyday Abaya', 'amina-everyday-abaya', 'Abaya', 'abaya', 2790, 3190, 'An uncomplicated essential with a clean line, understated details, and day-long comfort.', 'Matte nida · Side pockets · Easy-care fabric · Regular fit', 'CUSTOMER FAVOURITE', [looks[4], looks[0], looks[1], looks[2], looks[5]], ['Olive', 'Black'], ['S', 'M', 'L', 'XL']),
  make('soft-knit', 'Soft Knit Crochet Dress', 'soft-knit-crochet-dress', 'Crochet', 'crochet', 2990, null, 'A soft, beautifully textured dress that feels considered without feeling overdone.', 'Soft knit texture · Full length · Easy movement · Layer-friendly', 'TEXTURE STORY', [looks[3], looks[7], looks[6], looks[5], looks[4]], ['Oat', 'Blush'], ['S', 'M', 'L']),
];

export const demoCategories = [
  { _id: 'demo-cat-abaya', name: 'Abaya', slug: 'abaya', description: 'Modern classics, made for every day.', imageUrl: looks[0] },
  { _id: 'demo-cat-crochet', name: 'Crochet', slug: 'crochet', description: 'Thoughtful texture, easy silhouettes.', imageUrl: looks[7] },
];

export function getProductImage(product) {
  return product?.mainImage?.url || product?.images?.[0]?.url || product?.image || '';
}

export function getProductGallery(product) {
  const gallery = product?.galleryImages?.length ? product.galleryImages : (product?.images || []).slice(1);
  const all = [product?.mainImage || product?.images?.[0], ...gallery].filter(Boolean);
  return all.slice(0, 5).map((item) => typeof item === 'string' ? { url: item } : item);
}

export function getProductStock(product) {
  if (Number.isFinite(product?.stockCount)) return product.stockCount;
  return (product?.variants || []).reduce((sum, variant) => sum + Math.max(0, Number(variant.stock) || 0), 0);
}
