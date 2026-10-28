import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { summary } from '../controllers/adminController.js';
import { listContactMessages, updateContactMessageStatus } from '../controllers/contactController.js';
import { listAdminOrders } from '../controllers/adminOrderController.js';
import {
  archiveAdminCategory,
  archiveAdminProduct,
  createAdminCategory,
  createAdminProduct,
  createCloudinarySignature,
  listAdminCategories,
  listAdminProducts,
  updateAdminProduct,
  updateAdminCategory,
  restoreAdminCategory,
} from '../controllers/adminCatalogController.js';
const router = Router();
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
router.use(requireAdmin);
router.get('/summary', asyncRoute(summary));
router.get('/orders', asyncRoute(listAdminOrders));
router.get('/products', asyncRoute(listAdminProducts));
router.post('/products', asyncRoute(createAdminProduct));
router.put('/products/:id', asyncRoute(updateAdminProduct));
router.delete('/products/:id', asyncRoute(archiveAdminProduct));
router.get('/contact-messages', asyncRoute(listContactMessages));
router.patch('/contact-messages/:id', asyncRoute(updateContactMessageStatus));
router.get('/categories', asyncRoute(listAdminCategories));
router.post('/categories', asyncRoute(createAdminCategory));
router.put('/categories/:id', asyncRoute(updateAdminCategory));
router.patch('/categories/:id/restore', asyncRoute(restoreAdminCategory));
router.delete('/categories/:id', asyncRoute(archiveAdminCategory));
router.post('/media/signature', asyncRoute(createCloudinarySignature));
export default router;
