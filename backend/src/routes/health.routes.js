import { Router } from 'express';
import { getHealthScore } from '../controllers/health.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, getHealthScore);

export default router;
