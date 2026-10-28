import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, SlidersHorizontal, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { apiRequest } from '../services/api.js';
import { demoCategories, demoProducts, getProductStock } from '../data/demoProducts.js';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState(demoProducts);
  const [categories, setCategories] = useState(demoCategories);
  const [priceFilter, setPriceFilter] = useState('all');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('featured');
  const [mobileFilters, setMobileFilters] = useState(false);
  const category = searchParams.get('category') || 'all';
  const search = searchParams.get('search') || '';

  useEffect(() => {
    let alive = true;
    apiRequest('/categories').then((result) => { if (alive) setCategories(Array.isArray(result.categories) ? result.categories : []); }).catch(() => { /* Keep preview categories available offline. */ });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const query = new URLSearchParams({ limit: '48' });
    if (category !== 'all') query.set('category', category);
    if (search) query.set('search', search);
    apiRequest(`/products?${query.toString()}`).then((result) => {
      if (!alive) return;
      setProducts(Array.isArray(result.products) ? result.products : []);
      setError('');
    }).catch(() => {
      if (!alive) return;
      const filteredDemo = demoProducts.filter((product) => (category === 'all' || product.category?.slug === category) && (!search || `${product.name} ${product.description}`.toLowerCase().includes(search.toLowerCase())));
      setProducts(filteredDemo);
      setError('Showing preview products while the catalogue API is unavailable.');
    }).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [category, search]);

  const filtered = useMemo(() => [...products].filter((product) => {
    const price = Number(product.price) || 0;
    const inPriceBand = priceFilter === 'all' || (priceFilter === 'under-2500' && price < 2500) || (priceFilter === '2500-3500' && price >= 2500 && price <= 3500) || (priceFilter === 'over-3500' && price > 3500);
    return inPriceBand && (!availableOnly || getProductStock(product) > 0);
  }).sort((a, b) => {
    if (sort === 'price-low') return a.price - b.price;
    if (sort === 'price-high') return b.price - a.price;
    if (sort === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
  }), [products, sort, priceFilter, availableOnly]);

  function chooseCategory(value) {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') next.delete('category'); else next.set('category', value);
    setSearchParams(next);
  }

  function clearFilters() {
    setPriceFilter('all');
    setAvailableOnly(false);
    setSearchParams(search ? { search } : {});
  }

  return <div className="storefront"><SiteHeader/><main className="shop-page">
    <section className="shop-hero"><div className="shop-hero-overlay"/><div className="shop-hero-copy"><p className="eyebrow">A WARDROBE, CONSIDERED</p><h1>{category === 'abaya' ? <>The Abaya <em>edit.</em></> : category === 'crochet' ? <>Texture & <em>form.</em></> : <>Find your <em>favourite.</em></>}</h1><p>Pieces to live in. Details to love. A little more you, every day.</p><div className="shop-breadcrumb"><Link to="/">Home</Link><span>/</span><span>{category === 'all' ? 'Shop all' : category[0].toUpperCase() + category.slice(1)}</span></div></div></section>
    <section className="shop-content section-pad">
      <div className="shop-toolbar"><div><p className="eyebrow">THE NOOR COLLECTION</p><h2>{search ? `Results for “${search}”` : category === 'all' ? 'All the pieces' : `${category[0].toUpperCase()}${category.slice(1)} collection`} <span>{filtered.length}</span></h2></div><div className="shop-controls"><button type="button" className="filter-toggle" onClick={() => setMobileFilters((open) => !open)}><SlidersHorizontal size={15}/> Filters</button><label className="sort-control">Sort by <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label></div></div>
      <div className={`shop-layout ${mobileFilters ? 'filters-open' : ''}`}><aside className="shop-filters"><div className="filter-heading"><strong>FILTER BY</strong><button type="button" onClick={clearFilters}>Clear all</button><button className="filter-close" type="button" aria-label="Close filters" onClick={() => setMobileFilters(false)}><X size={16}/></button></div><div className="filter-group"><p>COLLECTION</p>{[['all', 'All pieces'], ...categories.filter((item) => item.active !== false).map((item) => [item.slug, item.name])].map(([value, label]) => <button key={value} type="button" className={category === value ? 'filter-option active' : 'filter-option'} onClick={() => chooseCategory(value)}><span>{label}</span><span className="filter-radio"/></button>)}</div><div className="filter-group price-filter-group"><p>PRICE</p><label className="price-filter-select"><span className="sr-only">Filter by price</span><select value={priceFilter} onChange={(event) => setPriceFilter(event.target.value)}><option value="all">Any price</option><option value="under-2500">Under ₹2,500</option><option value="2500-3500">₹2,500–₹3,500</option><option value="over-3500">Over ₹3,500</option></select></label><label className="availability-filter"><input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)}/><span>Available now</span></label></div><div className="filter-note"><span>✳</span><p>Thoughtful silhouettes. Easy-to-love details. Find the piece that feels like you.</p><Link to="/about">Our philosophy <ArrowRight size={13}/></Link></div></aside>
        <div className="shop-results">{error && <p className="preview-note">{error}</p>}{loading ? <div className="shop-loading">Curating your collection<span>···</span></div> : filtered.length ? <div className="new-product-grid shop-product-grid">{filtered.map((product, index) => <ProductCard key={product._id || product.slug} product={product} index={index}/>)}</div> : <div className="empty-collection"><span>✳</span><h3>Nothing here just yet.</h3><p>Try another collection or clear your search to explore all pieces.</p><button className="button button-dark" onClick={() => { setSearchParams({}); }}>Explore all pieces <ArrowRight size={15}/></button></div>}</div>
      </div>
    </section>
    <motion.section className="shop-bottom-note" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}><span>✳</span><p>Made to be worn, lived in, and loved.</p><Link to="/">A little about Noor <ArrowRight size={14}/></Link></motion.section>
  </main><SimpleFooter/></div>;
}

function SimpleFooter() {
  return <footer className="new-site-footer compact-footer"><div className="footer-top"><div><Link className="wordmark" to="/">NOOR<span>®</span></Link><p>Modesty, made personal.</p></div><div className="footer-links"><div><strong>EXPLORE</strong><Link to="/shop">Shop all</Link><Link to="/shop?category=abaya">Abayas</Link><Link to="/shop?category=crochet">Crochet</Link></div><div><strong>HELP</strong><Link to="/contact">Contact</Link><Link to="/shipping-returns">Shipping & returns</Link><Link to="/cart">Your bag</Link></div></div></div><div className="footer-bottom"><small>© {new Date().getFullYear()} NOOR. Built with intention.</small><small>BHIWANDI, INDIA</small></div></footer>;
}
