import { Router } from 'express';
import { getAlerts } from '../controllers/insight.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/alerts', getAlerts);

export default router;
