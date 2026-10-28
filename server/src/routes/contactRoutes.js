import { Router } from 'express';
import { createContactMessage } from '../controllers/contactController.js';
const router = Router();
router.post('/', (req, res, next) => Promise.resolve(createContactMessage(req, res)).catch(next));
export default router;
