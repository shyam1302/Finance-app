import { Router } from 'express';
import { submitQuestionnaire, getProfile } from '../controllers/risk.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.post('/questionnaire', submitQuestionnaire);
router.get('/profile', getProfile);

export default router;
