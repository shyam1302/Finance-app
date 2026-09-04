import { Router } from 'express';
import { getTaxBreakdown, addTaxInvestment, updateTaxInvestment, deleteTaxInvestment } from '../controllers/tax.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', getTaxBreakdown);
router.post('/investments', addTaxInvestment);
router.put('/investments/:id', updateTaxInvestment);
router.delete('/investments/:id', deleteTaxInvestment);

export default router;
