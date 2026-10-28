import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2, ChevronDown, Clock3, Mail, MapPin, MessageCircle, Send, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import { apiRequest } from '../services/api.js';

const lookbook = [
  ['https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=900&q=85', 'Warm textures and everyday layers'],
  ['https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85', 'An edit for everyday movement'],
  ['https://images.unsplash.com/photo-1490481651871-ab68de25d43e?auto=format&fit=crop&w=900&q=85', 'Soft neutrals and considered essentials'],
  ['https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=85', 'Personal style, your own way'],
  ['https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85', 'Contemporary silhouettes'],
  ['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=85', 'Texture in the little details'],
];

const faqs = [
  { question: 'How do I choose the right size?', answer: 'Open a product page and review its size options and fit notes before adding it to your bag. If you are between sizes, contact the store with the product name and your measurements before ordering.' },
  { question: 'Which payment methods are available?', answer: 'Cash on Delivery is available when the store has enabled it. Razorpay online payments—including supported UPI, debit cards, credit cards and other checkout methods—appear after the store configures and tests its Razorpay credentials.' },
  { question: 'How can I check whether an item is in stock?', answer: 'The product page displays availability for the selected colour and size. Stock is checked again by the server when you place an order, so an item in your bag is not reserved until checkout begins.' },
  { question: 'Can I change or cancel an order?', answer: 'Please contact the store promptly with your order reference. Changes and cancellations depend on whether the order has already entered fulfilment; payment refunds are handled after the store reviews the request.' },
  { question: 'How do shipping and returns work?', answer: 'The checkout displays the configured shipping charge. Before launch, the store should publish its final delivery estimate, return eligibility, return window, and refund process here so customers can review the exact policy before ordering.' },
  { question: 'Are the product images representative?', answer: 'The live catalogue should use the retailer’s own approved product photographs. Each product supports a main image plus four additional views so customers can review the garment before purchasing.' },
];

const pageContent = {
  about: { eyebrow: 'THE HOUSE OF NOOR', title: <>Modesty, with <em>meaning.</em></>, intro: 'A considered wardrobe for the days you live in and the moments you remember.', body: 'NOOR is a modestwear concept built around thoughtful silhouettes, tactile details, and ease. Our Abaya and Crochet collections are designed to make getting dressed feel personal rather than complicated.', cta: 'Explore the collection' },
  'shipping-returns': { eyebrow: 'THE PRACTICAL DETAILS', title: <>Delivered with <em>care.</em></>, intro: 'A clear guide to what happens after you place your order.', body: 'Shipping charges are calculated at checkout. Please review your order confirmation and retain your order reference for any delivery question. Before accepting live orders, the store should add its confirmed delivery timelines, courier coverage, returns eligibility, return window, and refund processing rules to this page.', cta: 'Shop the collection' },
};

export default function BrandInfoPage() {
  const { pathname } = useLocation();
  const page = pathname.replace(/^\//, '').replace(/\/$/, '') || 'about';
  const content = pageContent[page];
  const [openFaq, setOpenFaq] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  async function submitContact(event) {
    event.preventDefault();
    setSending(true);
    setFeedback({ type: '', message: '' });
    try {
      const response = await apiRequest('/contact', { method: 'POST', body: JSON.stringify(form) });
      setFeedback({ type: 'success', message: response.message || 'Thank you. Your message has been received.' });
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Your message could not be sent. Please try again.' });
    } finally {
      setSending(false);
    }
  }

  return <div className="storefront"><SiteHeader/><main className="brand-info-page">
    <div className="brand-info-breadcrumb"><Link to="/"><ArrowLeft size={13}/> Home</Link><span>/</span><span>{page.replace('-', ' ')}</span></div>
    {page === 'gallery' ? <>
      <section className="info-hero info-gallery-hero"><p className="eyebrow">THE NOOR LOOKBOOK</p><h1>Little details.<br/><em>Whole feeling.</em></h1><p>Ideas, textures, and silhouettes to make your own.</p><Link className="button button-light" to="/shop">Shop the edit <ArrowUpRight size={15}/></Link></section>
      <section className="info-gallery-grid section-pad">{lookbook.map(([src, alt], index) => <motion.figure key={src} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: .45, delay: (index % 3) * .06 }}><img src={src} alt={alt} loading="lazy"/><figcaption><span>LOOK {String(index + 1).padStart(2, '0')}</span><strong>{alt}</strong><Link to="/shop">Explore pieces <ArrowUpRight size={13}/></Link></figcaption></motion.figure>)}</section>
    </> : page === 'faq' ? <section className="info-faq-wrap section-pad"><div className="info-intro-column"><p className="eyebrow">GOOD TO KNOW</p><h1>A few things,<br/><em>made clear.</em></h1><p>Quick answers about finding your fit, placing an order, and what comes next.</p><Link to="/contact" className="text-link">Still have a question? <ArrowRight size={15}/></Link></div><div className="info-faq-list">{faqs.map((faq, index) => <article className={`info-faq-item ${openFaq === index ? 'open' : ''}`} key={faq.question}><button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}><span>{String(index + 1).padStart(2, '0')}</span><strong>{faq.question}</strong><ChevronDown size={18}/></button>{openFaq === index && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>{faq.answer}</motion.p>}</article>)}</div></section> : page === 'contact' ? <section className="info-contact-layout section-pad"><div className="info-contact-copy"><p className="eyebrow">WE'RE HERE TO HELP</p><h1>Let's talk<br/><em>things through.</em></h1><p>Product questions, sizing help, or an existing order — send us a note and the store team can follow up.</p><div className="info-contact-note"><span><MessageCircle size={19}/></span><div><strong>A note for the store team</strong><p>Share the product name or order reference when you can. It helps us understand what you need.</p></div></div><div className="info-contact-note"><span><Clock3 size={19}/></span><div><strong>Response times</strong><p>Messages are saved in the store inbox for an administrator to review. Response time depends on the team's working hours.</p></div></div><div className="info-contact-note"><span><MapPin size={19}/></span><div><strong>Made in Bhiwandi, India</strong><p>A local manufacturing story with a thoughtful point of view.</p></div></div></div><form className="info-contact-form" onSubmit={submitContact}><p className="eyebrow">WRITE TO NOOR</p><h2>Send a message.</h2><label>Your name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} maxLength={100} autoComplete="name" placeholder="Full name"/></label><div className="contact-form-two"><label>Email address<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={254} autoComplete="email" placeholder="you@example.com"/></label><label>Phone (optional)<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={30} autoComplete="tel" placeholder="Mobile number"/></label></div><label>Subject<input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required minLength={3} maxLength={120} placeholder="How can we help?"/></label><label>Your message<textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required minLength={10} maxLength={3000} rows={5} placeholder="Tell us a little more..."/></label>{feedback.message && <p className={`info-form-feedback ${feedback.type}`} role="status">{feedback.message}</p>}<button className="button button-dark" type="submit" disabled={sending}>{sending ? 'Sending your note…' : 'Send message'} <Send size={15}/></button><small>Your details are used to respond to this request. Please do not include payment card details or one-time passwords.</small></form></section> : <>
      <section className={`info-hero ${page === 'about' ? 'info-about-hero' : 'info-policy-hero'}`}><p className="eyebrow">{content?.eyebrow || 'THE NOOR JOURNAL'}</p><h1>{content?.title || <>The little details<br/><em>matter.</em></>}</h1><p>{content?.intro || 'Find the information you need to shop with confidence.'}</p>{page === 'about' && <img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1600&q=85" alt="Modern fashion silhouette"/>}</section>
      <section className="info-copy-section section-pad"><div className="info-copy-mark"><Sparkles size={20}/><span>NOOR · BHIWANDI</span></div><div><p className="eyebrow">{page === 'about' ? 'OUR POINT OF VIEW' : 'PLEASE READ BEFORE ORDERING'}</p><h2>{page === 'about' ? <>A wardrobe that feels<br/><em>like your own.</em></> : <>The important things,<br/><em>without surprises.</em></>}</h2><p>{content?.body}</p>{page === 'about' && <p>We want product information, photography, inventory, and checkout to be as considered as the pieces themselves. Every live product page is designed to show five views, helpful variant information, and clear availability before you add a piece to your bag.</p>}<Link className="button button-dark" to="/shop">{content?.cta || 'Explore the collection'} <ArrowRight size={15}/></Link></div></section>
      {page === 'shipping-returns' && <section className="info-policy-cards section-pad"><article><span><Truck size={21}/></span><h3>Shipping</h3><p>Available shipping charges are displayed in the checkout summary. Check your order confirmation and keep your order reference close.</p></article><article><span><ShieldCheck size={21}/></span><h3>Returns & refunds</h3><p>The business owner must publish the exact return window, eligibility criteria, and refund rules before launch. Contact the store with your order reference to start a request.</p></article><article><span><Mail size={21}/></span><h3>Need clarification?</h3><p>Write to the team before placing an order if a policy or product detail is unclear.</p><Link to="/contact">Contact the store <ArrowRight size={14}/></Link></article></section>}
    </>}
    <section className="info-bottom-cta"><p className="eyebrow">FIND SOMETHING THAT FEELS LIKE YOU</p><h2>A little more <em>you.</em></h2><Link className="button button-light" to="/shop">Shop the collection <ArrowUpRight size={15}/></Link></section>
  </main><footer className="new-site-footer compact-footer"><div className="footer-top"><div><Link className="wordmark" to="/">NOOR<span>®</span></Link><p>Modesty, made personal.</p></div><div className="footer-links"><div><strong>EXPLORE</strong><Link to="/shop">Shop all</Link><Link to="/shop?category=abaya">Abayas</Link><Link to="/shop?category=crochet">Crochet</Link></div><div><strong>THE HOUSE</strong><Link to="/about">Our story</Link><Link to="/gallery">The edit</Link><Link to="/contact">Contact</Link></div><div><strong>HELP</strong><Link to="/faq">FAQs</Link><Link to="/shipping-returns">Shipping & returns</Link><Link to="/cart">Your bag</Link></div></div></div><div className="footer-bottom"><small>© {new Date().getFullYear()} NOOR. Built with intention.</small><small>BHIWANDI, INDIA</small></div></footer></div>;
}
