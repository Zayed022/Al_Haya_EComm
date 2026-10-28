import { Router } from 'express';
import { getProductBySlug, listCategories, listProducts } from '../controllers/catalogController.js';
const router = Router();
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
router.get('/categories', asyncRoute(listCategories));
router.get('/products', asyncRoute(listProducts));
router.get('/products/:slug', asyncRoute(getProductBySlug));
export default router;
