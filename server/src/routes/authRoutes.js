import { Router } from 'express';
import { bootstrapAdmin, login, logout, me } from '../controllers/authController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
const router = Router();
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAdmin, me);
router.post('/bootstrap-admin', bootstrapAdmin);
export default router;
