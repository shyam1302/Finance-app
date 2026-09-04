import { Router } from 'express';
import { getLoans, addLoan, updateLoan, deleteLoan } from '../controllers/loan.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', getLoans);
router.post('/', addLoan);
router.put('/:id', updateLoan);
router.delete('/:id', deleteLoan);

export default router;
