import { Router } from 'express';
import { cancelRazorpayOrder, createRazorpayOrder, verifyRazorpayPayment } from '../controllers/paymentController.js';
const router = Router();
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
router.post('/razorpay/order', asyncRoute(createRazorpayOrder));
router.post('/razorpay/verify', asyncRoute(verifyRazorpayPayment));
router.post('/razorpay/cancel', asyncRoute(cancelRazorpayOrder));
export default router;
