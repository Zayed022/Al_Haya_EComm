import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getProductImage } from '../data/demoProducts.js';

const CartContext = createContext(null);
const STORAGE_KEY = 'noor-store-cart-v1';
const DIRECT_CHECKOUT_KEY = 'noor-direct-checkout-v1';

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function loadDirectCheckout() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(DIRECT_CHECKOUT_KEY) || 'null');
    return Array.isArray(saved) && saved.length ? saved : null;
  } catch {
    return null;
  }
}

function createCartLine(product, variant, quantity = 1) {
  if (!product || !variant) return null;
  const stock = Math.max(0, Number(variant.stock) || 0);
  const requested = Math.max(1, Math.floor(Number(quantity) || 1));
  if (!stock) return null;
  return {
    key: `${product._id}:${variant._id}`,
    productId: product._id,
    slug: product.slug,
    variantId: variant._id,
    name: product.name,
    image: getProductImage(product),
    price: Number(product.price) || 0,
    size: variant.size || 'One size',
    color: variant.color || '',
    sku: variant.sku || '',
    stock,
    quantity: Math.min(stock, requested),
  };
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const [directCheckoutItems, setDirectCheckoutItems] = useState(loadDirectCheckout);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* Storage may be unavailable in private browsing. */ }
  }, [items]);

  useEffect(() => {
    try { if (directCheckoutItems?.length) sessionStorage.setItem(DIRECT_CHECKOUT_KEY, JSON.stringify(directCheckoutItems)); else sessionStorage.removeItem(DIRECT_CHECKOUT_KEY); } catch { /* Session storage is optional. */ }
  }, [directCheckoutItems]);

  const addToCart = useCallback((product, variant, quantity = 1) => {
    const line = createCartLine(product, variant, quantity);
    if (!line) return;
    setItems((current) => {
      const existing = current.find((item) => item.key === line.key);
      if (existing) return current.map((item) => item.key === line.key ? { ...item, stock: line.stock, quantity: Math.min(line.stock, item.quantity + line.quantity) } : item);
      return [...current, line];
    });
  }, []);

  const beginDirectCheckout = useCallback((product, variant, quantity = 1) => {
    const line = createCartLine(product, variant, quantity);
    if (line) setDirectCheckoutItems([line]);
  }, []);

  const clearDirectCheckout = useCallback(() => setDirectCheckoutItems(null), []);

  const updateQuantity = useCallback((key, quantity) => {
    const nextQuantity = Math.floor(Number(quantity));
    setItems((current) => current.map((item) => item.key === key
      ? { ...item, quantity: Math.min(item.stock, Math.max(1, nextQuantity || 1)) }
      : item));
  }, []);

  const removeItem = useCallback((key) => setItems((current) => current.filter((item) => item.key !== key)), []);
  const clearCart = useCallback(() => setItems([]), []);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const value = useMemo(() => ({ items, addToCart, beginDirectCheckout, directCheckoutItems, clearDirectCheckout, updateQuantity, removeItem, clearCart, itemCount, subtotal }), [items, addToCart, beginDirectCheckout, directCheckoutItems, clearDirectCheckout, updateQuantity, removeItem, clearCart, itemCount, subtotal]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider.');
  return context;
}
