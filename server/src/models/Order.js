import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: String, required: true },
  sku: { type: String, default: '' },
  slug: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  size: { type: String, default: '' },
  color: { type: String, default: '' },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const addressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  landmark: { type: String, default: '' },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, index: true },
  customer: { type: addressSchema, required: true },
  items: { type: [orderItemSchema], required: true, validate: (items) => items.length > 0 },
  subtotal: { type: Number, required: true, min: 0 },
  shipping: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['COD', 'RAZORPAY'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  status: { type: String, enum: ['payment_pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'], default: 'confirmed' },
  gatewayOrderId: { type: String, default: '', index: true },
  gatewayPaymentId: { type: String, default: '' },
  reservationTokenHash: { type: String, default: '' },
  stockReleased: { type: Boolean, default: false },
  cancelledAt: { type: Date, default: null },
}, { timestamps: true });

orderSchema.index({ createdAt: -1, status: 1 });
orderSchema.index({ 'customer.phone': 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
