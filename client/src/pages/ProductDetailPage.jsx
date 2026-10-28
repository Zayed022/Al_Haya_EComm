import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Heart, Minus, Plus, ShieldCheck, Truck } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { apiRequest } from '../services/api.js';
import { demoProducts, getProductGallery, getProductStock } from '../data/demoProducts.js';
import { formatCurrency } from '../utils/currency.js';
import { useCart } from '../context/CartContext.jsx';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, beginDirectCheckout } = useCart();
  const [product, setProduct] = useState(() => demoProducts.find((item) => item.slug === slug) || null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState('');
  const [relatedProducts, setRelatedProducts] = useState(() => demoProducts.filter((item) => item.slug !== slug).slice(0, 4));
  const [activeAccordion, setActiveAccordion] = useState('details');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setSelectedImage(0);
    apiRequest(`/products/${encodeURIComponent(slug)}`).then((result) => {
      if (alive && result.product) setProduct(result.product);
    }).catch((requestError) => {
      if (alive) setProduct(requestError.status === 404 ? null : (demoProducts.find((item) => item.slug === slug) || null));
    }).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [slug]);

  const variants = product?.variants || [];
  const availableVariants = variants.filter((variant) => Number(variant.stock) > 0);
  const selectedVariant = variants.find((variant) => String(variant._id) === String(selectedVariantId)) || availableVariants[0] || variants[0];
  const gallery = useMemo(() => getProductGallery(product), [product]);
  const selectedStock = Number(selectedVariant?.stock) || 0;
  const soldOut = getProductStock(product) <= 0 || selectedStock <= 0;

  useEffect(() => {
    if (selectedVariant?._id) setSelectedVariantId(String(selectedVariant._id));
    setQuantity(1);
  }, [product?._id, selectedVariant?._id]);

  useEffect(() => {
    if (!product?.category?.slug) return;
    let alive = true;
    apiRequest(`/products?category=${encodeURIComponent(product.category.slug)}&limit=5`).then((result) => {
      if (alive && result.products?.length) setRelatedProducts(result.products.filter((item) => item.slug !== slug).slice(0, 4));
    }).catch(() => {
      if (alive) setRelatedProducts(demoProducts.filter((item) => item.slug !== slug && item.category?.slug === product.category.slug).slice(0, 4));
    });
    return () => { alive = false; };
  }, [product?.category?.slug, slug]);

  if (loading && !product) return <div className="storefront"><SiteHeader/><div className="detail-loading">Preparing the details<span>···</span></div></div>;
  if (!product) return <div className="storefront"><SiteHeader/><section className="not-found-page"><span>✳</span><h1>This piece has wandered off.</h1><p>Let's find you something lovely instead.</p><Link className="button button-dark" to="/shop">Back to the collection <ArrowRight size={15}/></Link></section></div>;

  function handleAddToCart() {
    if (!selectedVariant || soldOut) return;
    addToCart(product, selectedVariant, quantity);
    setAddedMessage(`${product.name} added to your bag.`);
    window.setTimeout(() => setAddedMessage(''), 2400);
  }

  function handleBuyNow() {
    if (!selectedVariant || soldOut) return;
    beginDirectCheckout(product, selectedVariant, quantity);
    navigate('/checkout');
  }

  return <div className="storefront"><SiteHeader/><main className="product-detail-page">
    <div className="detail-breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/shop">Shop</Link><span>/</span><Link to={`/shop?category=${product.category?.slug || 'all'}`}>{product.category?.name || 'Collection'}</Link><span>/</span><strong>{product.name}</strong></div>
    <section className="product-detail-layout">
      <div className="detail-gallery">
        <div className="detail-main-image"><motion.img key={gallery[selectedImage]?.url} src={gallery[selectedImage]?.url} alt={gallery[selectedImage]?.alt || `${product.name} view ${selectedImage + 1}`} initial={{ opacity: .3, scale: 1.015 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .35 }}/><span className="detail-image-count">{String(selectedImage + 1).padStart(2, '0')} / {String(Math.max(gallery.length, 1)).padStart(2, '0')}</span><button type="button" className="detail-image-next" aria-label="Next product image" onClick={() => setSelectedImage((selectedImage + 1) % Math.max(gallery.length, 1))}><ArrowRight size={17}/></button></div>
        <div className="detail-thumbnails" aria-label="Product photos">{gallery.map((image, index) => <button key={`${image.url}-${index}`} type="button" className={selectedImage === index ? 'detail-thumbnail active' : 'detail-thumbnail'} aria-label={`Show product image ${index + 1}`} onClick={() => setSelectedImage(index)}><img src={image.url} alt={image.alt || `${product.name} thumbnail ${index + 1}`} loading="lazy"/></button>)}</div>
        <p className="gallery-caption">FIVE VIEWS. EVERY LITTLE DETAIL.</p>
      </div>
      <motion.div className="detail-purchase-panel" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .5 }}>
        <div className="detail-category-line"><span>{product.category?.name || 'NOOR COLLECTION'}</span><span className="detail-stock-dot"/> {soldOut ? 'Currently unavailable' : selectedStock <= 5 ? `Only ${selectedStock} left in this option` : 'Ready for your wardrobe'}</div>
        <h1>{product.name}</h1>
        <div className="detail-price-line"><strong>{formatCurrency(product.price)}</strong>{product.compareAtPrice > product.price && <><del>{formatCurrency(product.compareAtPrice)}</del><span className="detail-save">SAVE {Math.round((1 - product.price / product.compareAtPrice) * 100)}%</span></>}</div>
        <p className="detail-description">{product.description}</p>
        <div className="detail-sku">SKU <span>{selectedVariant?.sku || product.sku || 'NOOR-ESSENTIAL'}</span></div>
        <div className="detail-option-heading"><span>COLOUR / FINISH</span><strong>{selectedVariant?.color || 'Classic'}</strong></div>
        {Array.from(new Set(variants.map((variant) => variant.color).filter(Boolean))).length > 0 && <div className="detail-colour-options">{Array.from(new Set(variants.map((variant) => variant.color).filter(Boolean))).map((color) => { const matching = variants.find((variant) => variant.color === color && variant.stock > 0) || variants.find((variant) => variant.color === color); return <button key={color} type="button" className={`colour-chip ${selectedVariant?.color === color ? 'active' : ''} ${!matching?.stock ? 'unavailable' : ''}`} onClick={() => { if (matching) setSelectedVariantId(String(matching._id)); }} disabled={!matching?.stock}><span className={`colour-swatch swatch-${color.toLowerCase().replace(/[^a-z]/g, '-')}`}/>{color}{selectedVariant?.color === color && <Check size={13}/>}</button>; })}</div>}
        <div className="detail-option-heading size-heading"><span>SELECT SIZE</span><button type="button" onClick={() => setActiveAccordion(activeAccordion === 'size' ? '' : 'size')}>Size guide <ArrowRight size={13}/></button></div>
        <div className="detail-size-options">{Array.from(new Set(variants.map((variant) => variant.size || 'One size'))).map((size) => { const matching = variants.find((variant) => variant.size === size && variant.color === selectedVariant?.color) || variants.find((variant) => variant.size === size); const selected = String(matching?._id) === String(selectedVariant?._id); return <button key={size} type="button" disabled={!matching || matching.stock <= 0} className={`${selected ? 'active' : ''} ${!matching || matching.stock <= 0 ? 'unavailable' : ''}`} onClick={() => matching && setSelectedVariantId(String(matching._id))}>{size}</button>; })}</div>
        {activeAccordion === 'size' && <div className="size-guide-inline"><strong>A note on fit</strong><p>Our pieces are designed for an easy, relaxed fit. For a more personalised fit, check the garment measurements before ordering.</p></div>}
        <div className="detail-quantity-row"><span>QUANTITY</span><div className="quantity-stepper"><button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((current) => Math.max(1, current - 1))}><Minus size={14}/></button><span>{quantity}</span><button type="button" aria-label="Increase quantity" disabled={quantity >= selectedStock} onClick={() => setQuantity((current) => Math.min(selectedStock, current + 1))}><Plus size={14}/></button></div><span className={`stock-copy ${selectedStock <= 5 && selectedStock > 0 ? 'low' : ''}`}>{soldOut ? 'Sold out' : selectedStock <= 5 ? `Only ${selectedStock} left` : 'In stock'}</span></div>
        <div className="detail-actions"><button type="button" className="button button-dark detail-add-button" disabled={soldOut} onClick={handleAddToCart}>{soldOut ? 'Currently unavailable' : 'Add to bag'} <Plus size={16}/></button><button type="button" className="button detail-buy-button" disabled={soldOut} onClick={handleBuyNow}>Buy now <ArrowRight size={16}/></button></div>
        {addedMessage && <motion.p className="added-to-cart-message" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}><Check size={14}/>{addedMessage} <Link to="/cart">View bag</Link></motion.p>}
        <div className="detail-assurances"><div><Truck size={17}/><span><strong>Thoughtful delivery</strong><small>Shipping calculated at checkout</small></span></div><div><ShieldCheck size={17}/><span><strong>Secure checkout</strong><small>COD and online payment options</small></span></div><div><Heart size={17}/><span><strong>Made to be loved</strong><small>Carefully chosen for your wardrobe</small></span></div></div>
        <div className="detail-accordions">{[{ id: 'details', title: 'Details & composition', body: product.details || 'Designed with thoughtful details and a comfortable, relaxed silhouette.' }, { id: 'delivery', title: 'Delivery & returns', body: 'Delivery availability and charges are confirmed at checkout. Please review the store shipping and return policy before placing your order.' }, { id: 'care', title: 'Care instructions', body: 'Follow the care label on your garment. We recommend gentle handling and storing your pieces neatly to preserve their texture and finish.' }].map((item) => <div className="detail-accordion" key={item.id}><button type="button" onClick={() => setActiveAccordion(activeAccordion === item.id ? '' : item.id)}><span>{item.title}</span><ChevronDown size={16} className={activeAccordion === item.id ? 'rotated' : ''}/></button>{activeAccordion === item.id && <p>{item.body}</p>}</div>)}</div>
      </motion.div>
    </section>
    <section className="detail-related section-pad"><div className="section-heading"><div><p className="eyebrow">MORE TO LOVE</p><h2>Pairs well <em>with you.</em></h2></div><Link to="/shop" className="text-link">Explore all <ArrowRight size={15}/></Link></div><div className="new-product-grid">{relatedProducts.map((item, index) => <ProductCard key={item._id || item.slug} product={item} index={index}/>)}</div></section>
  </main><footer className="new-site-footer compact-footer"><div className="footer-top"><div><Link className="wordmark" to="/">NOOR<span>®</span></Link><p>Modesty, made personal.</p></div><div className="footer-links"><div><strong>EXPLORE</strong><Link to="/shop">Shop all</Link><Link to="/shop?category=abaya">Abayas</Link><Link to="/shop?category=crochet">Crochet</Link></div><div><strong>HELP</strong><Link to="/contact">Contact</Link><Link to="/shipping-returns">Shipping & returns</Link><Link to="/cart">Your bag</Link></div></div></div><div className="footer-bottom"><small>© {new Date().getFullYear()} NOOR. Built with intention.</small><small>BHIWANDI, INDIA</small></div></footer></div>;
}
