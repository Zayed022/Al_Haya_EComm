import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, CreditCard, LockKeyhole, PackageCheck, Truck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import { useCart } from '../context/CartContext.jsx';
import { apiRequest } from '../services/api.js';
import { formatCurrency } from '../utils/currency.js';

const FREE_SHIPPING_AT = 2499;
const SHIPPING_FEE = 99;
const initialForm = { name: '', email: '', phone: '', address: '', landmark: '', city: '', state: 'Maharashtra', postalCode: '' };

export default function CheckoutPage() {
  const { items: cartItems, clearCart, directCheckoutItems, clearDirectCheckout } = useCart();
  const items = directCheckoutItems?.length ? directCheckoutItems : cartItems;
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_AT ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;
  const razorpayConfigured = Boolean(import.meta.env.VITE_RAZORPAY_KEY_ID);
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
  }

  function validate() {
    const errors = {};
    if (form.name.trim().length < 2) errors.name = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address.';
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, '').slice(-10))) errors.phone = 'Enter a valid 10-digit Indian mobile number.';
    if (form.address.trim().length < 8) errors.address = 'Enter your complete street address.';
    if (form.city.trim().length < 2) errors.city = 'Enter your city.';
    if (form.state.trim().length < 2) errors.state = 'Enter your state.';
    if (!/^\d{6}$/.test(form.postalCode.trim())) errors.postalCode = 'Enter a valid 6-digit PIN code.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function orderPayload() {
    return {
      customer: { ...form, phone: form.phone.replace(/\D/g, '').slice(-10) },
      paymentMethod,
      items: items.map((item) => ({ productId: item.productId, variantId: item.variantId, quantity: item.quantity })),
    };
  }

  async function loadRazorpay() {
    if (window.Razorpay) return true;
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function submitOrder(event) {
    event.preventDefault();
    setError('');
    if (items.length === 0) { navigate('/cart'); return; }
    if (!validate()) return;
    setLoading(true);
    try {
      if (paymentMethod === 'COD') {
        const result = await apiRequest('/orders', { method: 'POST', body: JSON.stringify(orderPayload()) });
        const order = result.order;
        sessionStorage.setItem('noor-last-order', JSON.stringify(order));
        if (directCheckoutItems?.length) clearDirectCheckout(); else clearCart();
        navigate(`/order-confirmation/${order.orderNumber}`, { state: { order } });
        return;
      }

      if (!razorpayConfigured) throw new Error('Online payment is not configured yet. Add VITE_RAZORPAY_KEY_ID to client/.env and Razorpay credentials to server/.env, or choose Cash on Delivery.');
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Razorpay Checkout could not be loaded. Check your connection and try again.');
      const created = await apiRequest('/payments/razorpay/order', { method: 'POST', body: JSON.stringify(orderPayload()) });
      const razorpay = new window.Razorpay({
        key: created.keyId,
        amount: created.payment.amount,
        currency: created.payment.currency,
        name: 'NOOR',
        description: `Order ${created.order.orderNumber}`,
        order_id: created.payment.id,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        notes: { orderNumber: created.order.orderNumber },
        theme: { color: '#454735' },
        handler: async (response) => {
          try {
            const verified = await apiRequest('/payments/razorpay/verify', { method: 'POST', body: JSON.stringify({ orderNumber: created.order.orderNumber, ...response }) });
            sessionStorage.setItem('noor-last-order', JSON.stringify(verified.order));
            if (directCheckoutItems?.length) clearDirectCheckout(); else clearCart();
            navigate(`/order-confirmation/${verified.order.orderNumber}`, { state: { order: verified.order } });
          } catch (verificationError) {
            setError(`${verificationError.message} If your bank was charged, please contact the store with order ${created.order.orderNumber}.`);
          } finally { setLoading(false); }
        },
        modal: { ondismiss: async () => { try { await apiRequest('/payments/razorpay/cancel', { method: 'POST', body: JSON.stringify({ orderNumber: created.order.orderNumber, reservationToken: created.reservationToken }) }); } catch { /* Expiry reconciliation handles abandoned reservations. */ } setLoading(false); } },
      });
      razorpay.on('payment.failed', (response) => setError(response.error?.description || 'Payment failed. Please try again or choose Cash on Delivery.'));
      razorpay.open();
      setLoading(false);
    } catch (submitError) {
      setError(submitError.message || 'We could not place your order. Please try again.');
      setLoading(false);
    }
  }

  if (items.length === 0) return <div className="storefront"><SiteHeader/><section className="checkout-empty"><CheckCircle2 size={31}/><h1>Your bag is empty.</h1><p>Add a piece before heading to checkout.</p><Link to="/shop" className="button button-dark">Explore the collection <ArrowRight size={15}/></Link></section></div>;

  return <div className="storefront"><SiteHeader/><main className="checkout-page section-pad">
    <div className="detail-breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/cart">Your bag</Link><span>/</span><strong>Checkout</strong></div>
    <div className="checkout-heading"><p className="eyebrow">ONE LAST LITTLE THING</p><h1>Make it <em>yours.</em></h1><p>You're {itemCount === 1 ? 'one step' : 'a few steps'} away from your Noor pieces.</p></div>
    <div className="checkout-layout"><form id="checkout-form" className="checkout-form-panel" onSubmit={submitOrder} noValidate>
      <div className="checkout-step-heading"><span>01</span><div><h2>Delivery details</h2><p>Where should we send your order?</p></div></div>
      <div className="checkout-fields"><Field label="Full name" name="name" value={form.name} onChange={updateField} error={fieldErrors.name} placeholder="Your full name" autoComplete="name"/><div className="checkout-two-col"><Field label="Email address" name="email" type="email" value={form.email} onChange={updateField} error={fieldErrors.email} placeholder="you@example.com" autoComplete="email"/><Field label="Mobile number" name="phone" type="tel" value={form.phone} onChange={updateField} error={fieldErrors.phone} placeholder="10-digit mobile number" autoComplete="tel"/></div><Field label="House / flat, street and area" name="address" value={form.address} onChange={updateField} error={fieldErrors.address} placeholder="Flat, building, street, area" autoComplete="street-address"/><Field label="Landmark (optional)" name="landmark" value={form.landmark} onChange={updateField} placeholder="Nearby landmark"/><div className="checkout-two-col"><Field label="City" name="city" value={form.city} onChange={updateField} error={fieldErrors.city} placeholder="City" autoComplete="address-level2"/><Field label="State" name="state" value={form.state} onChange={updateField} error={fieldErrors.state} placeholder="State" autoComplete="address-level1"/></div><Field label="PIN code" name="postalCode" value={form.postalCode} onChange={updateField} error={fieldErrors.postalCode} placeholder="6-digit PIN code" autoComplete="postal-code"/></div>
      <div className="checkout-separator"/><div className="checkout-step-heading"><span>02</span><div><h2>Choose how to pay</h2><p>Pick the option that feels right.</p></div></div>
      <div className="payment-method-list"><label className={`payment-method ${paymentMethod === 'COD' ? 'selected' : ''}`}><input type="radio" name="paymentMethod" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')}/><span className="payment-method-icon"><PackageCheck size={19}/></span><span className="payment-method-copy"><strong>Cash on Delivery</strong><small>Pay when your order arrives.</small></span><span className="payment-radio"/></label><label className={`payment-method ${paymentMethod === 'RAZORPAY' ? 'selected' : ''} ${!razorpayConfigured ? 'payment-disabled' : ''}`}><input type="radio" name="paymentMethod" value="RAZORPAY" checked={paymentMethod === 'RAZORPAY'} onChange={() => setPaymentMethod('RAZORPAY')} disabled={!razorpayConfigured}/><span className="payment-method-icon"><CreditCard size={19}/></span><span className="payment-method-copy"><strong>Pay online with Razorpay</strong><small>UPI, debit / credit cards and other supported methods.</small>{!razorpayConfigured && <em>Available after payment credentials are configured.</em>}</span><span className="payment-radio"/></label></div>
      <div className="checkout-security-note"><LockKeyhole size={15}/><span>Your details are submitted securely. Never share your OTP or card PIN with anyone.</span></div>
      {error && <div className="checkout-error" role="alert">{error}</div>}
      <button className="button button-dark place-order-button" type="submit" disabled={loading}>{loading ? 'Processing your order…' : paymentMethod === 'COD' ? 'Place COD order' : 'Continue to secure payment'} <ArrowRight size={16}/></button>
      <Link to="/cart" className="checkout-back-link"><ArrowLeft size={14}/> Back to your bag</Link>
    </form>
    <aside className="checkout-summary"><p className="eyebrow">YOUR NOOR EDIT</p><h2>In your order.</h2><div className="checkout-summary-items">{items.map((item) => <div className="checkout-summary-item" key={item.key}><div className="summary-item-image"><img src={item.image} alt={item.name}/><span>{item.quantity}</span></div><div className="summary-item-name"><strong>{item.name}</strong><small>{item.color && `${item.color} · `}{item.size}</small></div><strong>{formatCurrency(item.price * item.quantity)}</strong></div>)}</div><div className="summary-line"><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div><div className="summary-line"><span>Shipping</span><strong>{shipping === 0 ? 'Complimentary' : formatCurrency(shipping)}</strong></div><div className="summary-line summary-total"><span>Total</span><strong>{formatCurrency(total)}</strong></div><div className="checkout-summary-foot"><Truck size={16}/><span>{shipping === 0 ? 'Your order qualifies for complimentary shipping.' : `Add ${formatCurrency(FREE_SHIPPING_AT - subtotal)} more to unlock complimentary shipping.`}</span></div><p className="checkout-legal">By placing your order, you agree to the store's shipping, return, and privacy policies.</p></aside></div>
  </main><footer className="checkout-footer"><Link to="/">NOOR®</Link><span>Thoughtful design, delivered with care.</span><Link to="/contact">Need help?</Link></footer></div>;
}

function Field({ label, name, value, onChange, error, type = 'text', placeholder, autoComplete }) {
  return <label className={`checkout-field ${error ? 'has-error' : ''}`}><span>{label}</span><input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={Boolean(error)}/>{error && <small>{error}</small>}</label>;
}
