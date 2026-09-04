import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
    getProducts,
    createOrder,
    verifyPayment,
    recordPaymentFailure,
    chatWithAgent
} from '../controllers/commerce.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/products', getProducts);
router.post('/chat', chatWithAgent);
router.post('/order', createOrder);
router.post('/verify', verifyPayment);
router.post('/failure', recordPaymentFailure);

export default router;