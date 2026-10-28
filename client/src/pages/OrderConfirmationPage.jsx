import { useEffect, useState } from 'react';
import { Check, PackageCheck, ArrowRight, Copy } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import { formatCurrency } from '../utils/currency.js';

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const [order, setOrder] = useState(location.state?.order || null);

  useEffect(() => {
    if (order) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem('noor-last-order') || 'null');
      if (saved?.orderNumber === orderNumber) setOrder(saved);
    } catch { /* Session storage is optional. */ }
  }, [order, orderNumber]);

  async function copyOrderNumber() {
    try { await navigator.clipboard.writeText(orderNumber); setCopied(true); } catch { setCopied(false); }
  }

  return <div className="storefront"><SiteHeader/><main className="order-confirmation-page section-pad"><div className="confirmation-card"><div className="confirmation-icon"><Check size={29}/></div><p className="eyebrow">A VERY GOOD DAY FOR YOUR WARDROBE</p><h1>Thank you.<br/><em>It's on its way.</em></h1><p className="confirmation-intro">Your order has been received. We'll take good care of the details from here.</p><div className="confirmation-order-number"><span>ORDER REFERENCE</span><strong>{orderNumber}</strong><button type="button" onClick={copyOrderNumber} aria-label="Copy order number">{copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? 'Copied' : 'Copy'}</button></div>{order && <div className="confirmation-order-summary"><div><span>Order total</span><strong>{formatCurrency(order.total ?? order.totalAmount ?? 0)}</strong></div><div><span>Payment method</span><strong>{order.paymentMethod === 'RAZORPAY' ? 'Razorpay' : 'Cash on Delivery'}</strong></div><div><span>Order status</span><strong>{order.status || 'Confirmed'}</strong></div></div>}<div className="confirmation-next-steps"><div><span><PackageCheck size={17}/></span><p><strong>What's next?</strong><small>Keep your order reference handy. The store team can use it to help with any questions.</small></p></div><div><span><Check size={17}/></span><p><strong>We'll keep you informed.</strong><small>Order and delivery updates will follow through the contact details provided.</small></p></div></div><Link className="button button-dark" to="/shop">Continue exploring <ArrowRight size={15}/></Link></div></main><footer className="checkout-footer"><Link to="/">NOOR®</Link><span>Thoughtful design, delivered with care.</span><Link to="/contact">Need help?</Link></footer></div>;
}
