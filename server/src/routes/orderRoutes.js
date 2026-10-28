import { Router } from 'express';
import { createCodOrder } from '../controllers/orderController.js';
const router = Router();
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
router.post('/', asyncRoute(createCodOrder));
export default router;
