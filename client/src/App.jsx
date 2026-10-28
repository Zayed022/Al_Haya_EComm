import { Route, Routes } from 'react-router-dom';
import Storefront from './pages/Storefront.jsx';
import ShopPage from './pages/ShopPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderConfirmationPage from './pages/OrderConfirmationPage.jsx';
import AdminEntry from './pages/AdminEntry.jsx';
import BrandInfoPage from './pages/BrandInfoPage.jsx';
import AdminMessagesPage from './pages/AdminMessagesPage.jsx';
import AdminOrdersPage from './pages/AdminOrdersPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminProductsPage from './pages/AdminProductsPage.jsx';
import ProtectedAdmin from './components/ProtectedAdmin.jsx';

export default function App() {
  return <Routes>
    <Route path="/" element={<Storefront />} />
    <Route path="/shop" element={<ShopPage />} />
    <Route path="/products/:slug" element={<ProductDetailPage />} />
    <Route path="/cart" element={<CartPage />} />
    <Route path="/checkout" element={<CheckoutPage />} />
    <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
    <Route path="/about" element={<BrandInfoPage />} />
    <Route path="/gallery" element={<BrandInfoPage />} />
    <Route path="/contact" element={<BrandInfoPage />} />
    <Route path="/faq" element={<BrandInfoPage />} />
    <Route path="/shipping-returns" element={<BrandInfoPage />} />
    <Route path="/admin" element={<AdminEntry />} />
    <Route path="/admin/dashboard" element={<ProtectedAdmin><AdminDashboard /></ProtectedAdmin>} />
    <Route path="/admin/products" element={<ProtectedAdmin><AdminProductsPage /></ProtectedAdmin>} />
    <Route path="/admin/messages" element={<ProtectedAdmin><AdminMessagesPage /></ProtectedAdmin>} />
    <Route path="/admin/orders" element={<ProtectedAdmin><AdminOrdersPage /></ProtectedAdmin>} />
    <Route path="*" element={<Storefront />} />
  </Routes>;
}
