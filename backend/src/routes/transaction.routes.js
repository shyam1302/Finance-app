import { Router } from 'express';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, importTransactions } from '../controllers/transaction.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createTransactionSchema, updateTransactionSchema } from '../validators/transaction.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/', getTransactions);
router.post('/', validate(createTransactionSchema), createTransaction);
router.post('/import', importTransactions);
router.put('/:id', validate(updateTransactionSchema), updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
