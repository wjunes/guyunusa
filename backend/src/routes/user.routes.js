import { Router } from 'express';
import { getProfile, updateProfile, deleteAccount } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);
router.get('/',    getProfile);
router.put('/',    updateProfile);
router.delete('/', deleteAccount);

export default router;
