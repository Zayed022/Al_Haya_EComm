export function presentProduct(product) {
  const record = typeof product?.toObject === 'function' ? product.toObject() : { ...product };
  const legacyImages = Array.isArray(record.images) ? record.images : [];
  const mainImage = record.mainImage?.url ? record.mainImage : (legacyImages[0] || { url: '', alt: record.name || 'Product image' });
  const existingGallery = Array.isArray(record.galleryImages) && record.galleryImages.length
    ? record.galleryImages
    : legacyImages.slice(1, 5);
  const galleryImages = existingGallery.slice(0, 4);
  return {
    ...record,
    mainImage,
    galleryImages,
    images: [mainImage, ...galleryImages],
    stockCount: (record.variants || []).reduce((total, variant) => total + Math.max(0, Number(variant.stock) || 0), 0),
  };
}
