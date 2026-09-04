import { Router } from 'express';
import { getInvestments, addInvestment, refreshPrices, updateInvestment, deleteInvestment } from '../controllers/investment.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', getInvestments);
router.post('/', addInvestment);
router.post('/refresh-prices', refreshPrices);
router.put('/:id', updateInvestment);
router.delete('/:id', deleteInvestment);

export default router;
