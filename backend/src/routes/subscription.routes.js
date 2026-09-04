import { Router } from 'express';
import { getSubscriptions, addSubscription, updateSubscription, deleteSubscription } from '../controllers/subscription.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', getSubscriptions);
router.post('/', addSubscription);
router.put('/:id', updateSubscription);
router.delete('/:id', deleteSubscription);

export default router;
