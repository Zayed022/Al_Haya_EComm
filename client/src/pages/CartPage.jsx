import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import SiteHeader from '../components/SiteHeader.jsx';
import { useCart } from '../context/CartContext.jsx';
import { formatCurrency } from '../utils/currency.js';

const FREE_SHIPPING_AT = 2499;
const SHIPPING_FEE = 99;

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, clearDirectCheckout } = useCart();
  useEffect(() => { clearDirectCheckout(); }, [clearDirectCheckout]);
  const navigate = useNavigate();
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_AT ? 0 : SHIPPING_FEE;
  const remaining = Math.max(0, FREE_SHIPPING_AT - subtotal);

  return <div className="storefront"><SiteHeader/><main className="cart-page section-pad">
    <div className="detail-breadcrumb"><Link to="/">Home</Link><span>/</span><strong>Your bag</strong></div>
    <div className="cart-heading"><div><p className="eyebrow">YOUR NOOR EDIT</p><h1>Your bag<span> ({items.reduce((sum, item) => sum + item.quantity, 0)})</span></h1><p>Thoughtful pieces, almost yours.</p></div><Link to="/shop" className="text-link"><ArrowLeft size={14}/> Keep exploring</Link></div>
    {items.length === 0 ? <div className="empty-cart"><span className="empty-cart-icon"><ShoppingBag size={26}/></span><p className="eyebrow">A LITTLE SPACE FOR SOMETHING LOVELY</p><h2>Your bag is taking a breather.</h2><p>Browse the collection and add the pieces that feel like you.</p><Link to="/shop" className="button button-dark">Explore the collection <ArrowRight size={15}/></Link></div> : <div className="cart-layout">
      <section className="cart-items-panel"><div className="cart-column-labels"><span>PRODUCT</span><span>QUANTITY</span><span>TOTAL</span></div>{items.map((item) => <article key={item.key} className="cart-item-row"><Link to={`/products/${item.slug}`} className="cart-item-image"><img src={item.image} alt={item.name}/></Link><div className="cart-item-info"><Link to={`/products/${item.slug}`}><h2>{item.name}</h2></Link><p>{item.color && `${item.color} · `}{item.size}</p><p className="cart-item-unit-price">{formatCurrency(item.price)} each</p><button type="button" className="remove-cart-item" onClick={() => removeItem(item.key)}><Trash2 size={13}/> Remove</button></div><div className="cart-quantity-stepper"><button type="button" aria-label="Decrease quantity" disabled={item.quantity <= 1} onClick={() => updateQuantity(item.key, item.quantity - 1)}><Minus size={12}/></button><span>{item.quantity}</span><button type="button" aria-label="Increase quantity" disabled={item.quantity >= item.stock} onClick={() => updateQuantity(item.key, item.quantity + 1)}><Plus size={12}/></button></div><strong className="cart-line-total">{formatCurrency(item.price * item.quantity)}</strong></article>)}
        <div className="cart-continue"><Link to="/shop"><ArrowLeft size={14}/> Continue shopping</Link><span>Prices include applicable discounts shown.</span></div>
      </section>
      <aside className="cart-summary"><p className="eyebrow">ORDER SUMMARY</p><h2>A good choice.</h2>{remaining > 0 ? <div className="shipping-progress"><p>Add <strong>{formatCurrency(remaining)}</strong> more for complimentary shipping.</p><span><i style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_AT) * 100)}%` }}/></span></div> : <div className="free-shipping-note">✳ Your order ships on us.</div>}<div className="summary-line"><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div><div className="summary-line"><span>Shipping</span><strong>{shipping === 0 ? 'Complimentary' : formatCurrency(shipping)}</strong></div><div className="summary-line summary-total"><span>Estimated total</span><strong>{formatCurrency(subtotal + shipping)}</strong></div><p className="summary-tax-note">Shipping and any applicable taxes are confirmed at checkout.</p><button className="button button-dark cart-checkout-button" type="button" onClick={() => navigate('/checkout')}>Continue to checkout <ArrowRight size={15}/></button><div className="cart-payment-note"><span>PAY YOUR WAY</span><p>Cash on Delivery or Razorpay online payment, where enabled.</p></div></aside>
    </div>}
  </main><footer className="new-site-footer compact-footer"><div className="footer-top"><div><Link className="wordmark" to="/">NOOR<span>®</span></Link><p>Modesty, made personal.</p></div><div className="footer-links"><div><strong>EXPLORE</strong><Link to="/shop">Shop all</Link><Link to="/shop?category=abaya">Abayas</Link><Link to="/shop?category=crochet">Crochet</Link></div><div><strong>HELP</strong><Link to="/contact">Contact</Link><Link to="/shipping-returns">Shipping & returns</Link></div></div></div><div className="footer-bottom"><small>© {new Date().getFullYear()} NOOR. Built with intention.</small><small>BHIWANDI, INDIA</small></div></footer></div>;
}
