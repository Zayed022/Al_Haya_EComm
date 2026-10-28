import { motion } from 'framer-motion';
import { ArrowUpRight, Heart, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProductImage, getProductStock } from '../data/demoProducts.js';
import { formatCurrency } from '../utils/currency.js';
import { useCart } from '../context/CartContext.jsx';

export default function ProductCard({ product, index = 0 }) {
  const { addToCart } = useCart();
  const image = getProductImage(product);
  const variant = product.variants?.find((item) => Number(item.stock) > 0);
  const outOfStock = getProductStock(product) <= 0 || !variant;
  const badge = product.badge || (product.featured ? 'THE NOOR EDIT' : product.tag);

  return <motion.article className="new-product-card" initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: .45, delay: Math.min(index * .045, .2) }}>
    <div className="new-product-image-wrap">
      <Link to={`/products/${product.slug}`} className="product-image-link" aria-label={`View ${product.name}`}>
        <img src={image} alt={product.mainImage?.alt || product.name} loading="lazy" />
      </Link>
      {badge && <span className="new-product-tag">{badge}</span>}
      <button className="new-wishlist" type="button" aria-label={`Save ${product.name}`} onClick={(event) => { event.currentTarget.classList.toggle('is-saved'); }}><Heart size={17}/></button>
      <button className="new-quick-add" type="button" disabled={outOfStock} onClick={() => addToCart(product, variant, 1)}>{outOfStock ? 'Sold out' : 'Quick add'} <ShoppingBag size={14}/></button>
    </div>
    <div className="new-product-meta">
      <div className="new-product-title-group"><Link to={`/products/${product.slug}`}><h3>{product.name}</h3></Link><p>{product.category?.name || product.detail || 'Thoughtful design · Everyday wear'}</p></div>
      <div className="new-product-prices"><strong>{formatCurrency(product.price)}</strong>{product.compareAtPrice > product.price && <del>{formatCurrency(product.compareAtPrice)}</del>}</div>
    </div>
  </motion.article>;
}
