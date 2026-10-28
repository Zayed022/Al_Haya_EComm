import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, HeartHandshake, Instagram, PackageCheck, Plus, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { apiRequest } from '../services/api.js';
import { demoCategories, demoProducts } from '../data/demoProducts.js';

const rise = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.12 }, transition: { duration: .6, ease: [0.22, 1, 0.36, 1] } };

export default function Storefront() {
  const [products, setProducts] = useState(demoProducts);
  const [categories, setCategories] = useState(demoCategories);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([apiRequest('/products?limit=12'), apiRequest('/categories')]).then(([productResult, categoryResult]) => {
      if (!alive) return;
      setProducts(Array.isArray(productResult.products) ? productResult.products : []);
      setCategories(Array.isArray(categoryResult.categories) ? categoryResult.categories : []);
    }).catch(() => { /* Demo catalogue keeps the storefront reviewable before Atlas is connected. */ });
    return () => { alive = false; };
  }, []);

  const featured = [...products].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured))).slice(0, 4);
  const abaya = categories.find((category) => category.slug === 'abaya') || demoCategories[0];
  const crochet = categories.find((category) => category.slug === 'crochet') || demoCategories[1];

  function subscribe(event) {
    event.preventDefault();
    setNewsletterMessage(`You're on the list — we'll write to ${newsletterEmail}.`);
    setNewsletterEmail('');
  }

  return <div className="storefront"><SiteHeader />
    <main>
      <section className="new-hero">
        <div className="new-hero-copy">
          <motion.p className="eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}><span className="eyebrow-dot"/> MODESTWEAR, WITH INTENTION</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, delay: .08 }}>Quietly bold.<br/><em>Beautifully</em> you.</motion.h1>
          <motion.p className="new-hero-description" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .7, delay: .22 }}>Considered silhouettes, thoughtful details, and pieces that feel like you — on your own terms.</motion.p>
          <motion.div className="new-hero-ctas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, delay: .28 }}><Link className="button button-dark" to="/shop">Discover the collection <ArrowUpRight size={16}/></Link><a className="text-link" href="#story">The Noor story <ArrowDownRight size={15}/></a></motion.div>
          <div className="new-hero-footnote"><span>01 / CONSIDERED BY DESIGN</span><span>MADE FOR YOUR EVERYDAY</span></div>
        </div>
        <motion.div className="new-hero-visual" initial={{ clipPath: 'inset(0 0 100% 0)' }} animate={{ clipPath: 'inset(0 0 0% 0)' }} transition={{ duration: 1, delay: .12, ease: [0.76, 0, 0.24, 1] }}>
          <img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1500&q=90" alt="Editorial fashion in soft natural light"/>
          <div className="new-hero-image-caption"><span>THE NEW SEASON</span><strong>Grace in every detail.</strong></div>
          <div className="new-round-stamp"><Sparkles size={17}/><span>MADE TO MOVE<br/>WITH YOU</span></div>
          <div className="hero-side-note">NOOR STUDIO · BHIWANDI, INDIA</div>
        </motion.div>
      </section>

      <div className="ticker" aria-label="Brand values"><div>THOUGHTFUL DESIGN <span>✳</span> EVERYDAY ELEGANCE <span>✳</span> MADE WITH CARE <span>✳</span> THOUGHTFUL DESIGN <span>✳</span> EVERYDAY ELEGANCE <span>✳</span></div></div>

      <section className="section-pad new-collection-section" id="collections">
        <motion.div className="section-heading" {...rise}><div><p className="eyebrow">A CURATED WARDROBE</p><h2>Find your <em>form.</em></h2></div><Link to="/shop" className="text-link">Explore all pieces <ArrowRight size={16}/></Link></motion.div>
        <div className="new-category-tiles">
          <Link to="/shop?category=abaya" className="new-category-tile"><img src={abaya.imageUrl || 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1100&q=85'} alt="Shop the Abaya edit" loading="lazy"/><span>01 / THE ABAYA EDIT</span><strong>Modern classics <ArrowUpRight size={18}/></strong><i>Fluid lines, timeless feeling.</i></Link>
          <Link to="/shop?category=crochet" className="new-category-tile"><img src={crochet.imageUrl || 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1100&q=85'} alt="Shop crochet textures" loading="lazy"/><span>02 / TEXTURE & FORM</span><strong>Crochet stories <ArrowUpRight size={18}/></strong><i>Hand-feel textures, easy silhouettes.</i></Link>
        </div>
      </section>

      <section className="section-pad new-products-section" id="products">
        <motion.div className="section-heading" {...rise}><div><p className="eyebrow">THE PIECES YOU COME BACK TO</p><h2>Most <em>loved.</em></h2></div><Link to="/shop" className="text-link">Shop all pieces <ArrowRight size={16}/></Link></motion.div>
        <div className="new-product-grid">{featured.length ? featured.map((product, index) => <ProductCard key={product._id || product.slug} product={product} index={index}/>) : <div className="home-empty-products"><p className="eyebrow">A FRESH BEGINNING</p><h3>The collection is being prepared.</h3><p>Come back soon, or browse the complete shop.</p><Link to="/shop" className="text-link">Explore the shop <ArrowRight size={15}/></Link></div>}</div>
      </section>

      <section className="new-editorial-banner" id="story">
        <div className="new-editorial-image"><img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1300&q=85" alt="A portrait celebrating relaxed, personal style" loading="lazy"/><span className="editorial-image-index">FIG. 01 — PERSONAL STYLE</span></div>
        <motion.div className="new-editorial-copy" {...rise}><p className="eyebrow">A LITTLE ABOUT NOOR</p><h2>Less noise.<br/><em>More meaning.</em></h2><p>We believe getting dressed should feel less like a decision and more like coming home to yourself. Pieces made to be worn, lived in, and loved — season after season.</p><Link to="/about" className="button button-light">Get to know us <ArrowUpRight size={16}/></Link><span className="editorial-footnote">N° 001 — OUR PHILOSOPHY</span></motion.div>
      </section>

      <section className="new-values-section section-pad"><motion.div className="section-heading" {...rise}><div><p className="eyebrow">THE NOOR PROMISE</p><h2>The details <em>matter.</em></h2></div><p className="section-intro">From the first touch of fabric to the final fold in your parcel, every detail has a purpose.</p></motion.div>
        <div className="new-values-grid">
          <motion.article {...rise}><span className="value-icon"><HeartHandshake size={21}/></span><span className="value-index">01 / THOUGHTFUL DESIGN</span><h3>Made to feel like you.</h3><p>Timeless silhouettes, considered details, and comfort that stays with you.</p></motion.article>
          <motion.article {...rise} transition={{ duration: .6, delay: .08 }}><span className="value-icon"><PackageCheck size={21}/></span><span className="value-index">02 / QUALITY FIRST</span><h3>Details worth noticing.</h3><p>Thoughtful fabric choices and careful finishing make each piece feel special.</p></motion.article>
          <motion.article {...rise} transition={{ duration: .6, delay: .16 }}><span className="value-icon"><Truck size={21}/></span><span className="value-index">03 / TO YOUR DOOR</span><h3>A little care, delivered.</h3><p>Easy-to-follow ordering, transparent checkout, and thoughtful packaging.</p></motion.article>
          <motion.article {...rise} transition={{ duration: .6, delay: .24 }}><span className="value-icon"><ShieldCheck size={21}/></span><span className="value-index">04 / SHOP WITH EASE</span><h3>Simple, secure checkout.</h3><p>Choose Cash on Delivery or pay securely online with Razorpay when enabled.</p></motion.article>
        </div>
      </section>

      <section className="new-campaign-strip"><div><p className="eyebrow">YOUR NEXT EVERYDAY FAVOURITE</p><h2>Wear what <em>moves you.</em></h2><p>Discover shapes, textures, and little details made to become part of your story.</p><Link to="/shop" className="button button-dark">Shop the collection <ArrowUpRight size={16}/></Link></div><img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1100&q=85" alt="Contemporary fashion collection" loading="lazy"/></section>

      <section className="section-pad new-gallery-section" id="the-edit"><div className="gallery-heading"><div><p className="eyebrow">A MOMENT IN NOOR</p><h2>Worn your <em>way.</em></h2></div><a className="text-link" href="https://instagram.com" target="_blank" rel="noreferrer"><Instagram size={16}/> Follow along <ArrowUpRight size={14}/></a></div><div className="new-gallery-grid"><img src="https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=700&q=85" alt="Textile and wardrobe inspiration" loading="lazy"/><img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=85" alt="Everyday outfit inspiration" loading="lazy"/><img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43e?auto=format&fit=crop&w=700&q=85" alt="An understated wardrobe edit" loading="lazy"/><img src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=700&q=85" alt="Contemporary styling ideas" loading="lazy"/></div></section>

      <section className="new-newsletter"><div className="newsletter-mark"><BadgeCheck size={23}/></div><p className="eyebrow">A NOTE FROM US</p><h2>A little Noor in<br/><em>your inbox.</em></h2><p>New collections, considered edits, and first access to what’s next.</p><form onSubmit={subscribe}><input type="email" value={newsletterEmail} onChange={(event) => setNewsletterEmail(event.target.value)} placeholder="Your email address" aria-label="Your email address" required/><button aria-label="Subscribe"><Plus size={20}/></button></form>{newsletterMessage ? <small className="newsletter-feedback">{newsletterMessage}</small> : <small>No noise, just the good things.</small>}</section>
    </main>
    <footer className="new-site-footer"><div className="footer-top"><div><Link className="wordmark" to="/">NOOR<span>®</span></Link><p>Modesty, made personal.</p></div><div className="footer-links"><div><strong>EXPLORE</strong><Link to="/shop">Shop all</Link><Link to="/shop?category=abaya">Abayas</Link><Link to="/shop?category=crochet">Crochet</Link></div><div><strong>THE HOUSE</strong><Link to="/about">Our story</Link><Link to="/gallery">The edit</Link><Link to="/contact">Contact</Link></div><div><strong>HERE TO HELP</strong><Link to="/faq">FAQs</Link><Link to="/shipping-returns">Shipping & returns</Link><Link to="/cart">Your bag</Link></div></div></div><div className="footer-bottom"><small>© {new Date().getFullYear()} NOOR. Built with intention.</small><small>BHIWANDI, INDIA · DESIGNED FOR EVERYDAY ELEGANCE</small></div></footer>
  </div>;
}
