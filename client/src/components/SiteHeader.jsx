import { useState } from 'react';
import { ArrowUpRight, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

export default function SiteHeader() {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/shop${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`);
    setSearchOpen(false);
    setMenuOpen(false);
  };

  return <>
    <div className="announcement">A softer kind of statement. Complimentary shipping on orders over ₹2,499.</div>
    <header className="site-header new-site-header">
      <button className="icon-button mobile-menu" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={20}/> : <Menu size={20}/>}</button>
      <Link to="/" className="wordmark" aria-label="Noor home">NOOR<span>®</span></Link>
      <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`}>
        <Link to="/shop" onClick={() => setMenuOpen(false)}>Shop all</Link>
        <Link to="/shop?category=abaya" onClick={() => setMenuOpen(false)}>Abayas</Link>
        <Link to="/shop?category=crochet" onClick={() => setMenuOpen(false)}>Crochet</Link>
        <a href="/#story" onClick={() => setMenuOpen(false)}>Our story</a>
        <a href="/#the-edit" onClick={() => setMenuOpen(false)}>The edit</a>
      </nav>
      <div className="header-actions">
        <button className="icon-button" type="button" aria-label="Search products" onClick={() => setSearchOpen((open) => !open)}>{searchOpen ? <X size={19}/> : <Search size={19}/>}</button>
        <Link to="/cart" className="icon-button bag-button" aria-label={`Shopping bag, ${itemCount} items`}><ShoppingBag size={19}/><span className="cart-count">{itemCount}</span></Link>
      </div>
    </header>
    {searchOpen && <form className="header-search-panel" onSubmit={submitSearch}><Search size={17}/><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your next favourite…" aria-label="Search products"/><button type="submit">Search <ArrowUpRight size={14}/></button></form>}
  </>;
}
