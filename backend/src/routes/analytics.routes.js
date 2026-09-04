import { Router } from 'express';
import { getSummary, getCategoryBreakdown, getTrend, getTopMerchants } from '../controllers/analytics.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/summary', getSummary);
router.get('/category', getCategoryBreakdown);
router.get('/trend', getTrend);
router.get('/top-merchants', getTopMerchants);

export default router;
