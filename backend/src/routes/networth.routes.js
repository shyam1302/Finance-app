import { Router } from 'express';
import { getNetWorth, getNetWorthHistory, createSnapshot } from '../controllers/networth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', getNetWorth);
router.get('/history', getNetWorthHistory);
router.post('/snapshot', createSnapshot);

export default router;
