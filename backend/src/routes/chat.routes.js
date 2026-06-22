import { Router } from 'express';
import { sendMessage, getConversations, getMessages, deleteConversation } from '../controllers/chat.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);
router.post('/message',               sendMessage);
router.get('/conversations',          getConversations);
router.get('/conversations/:id',      getMessages);
router.delete('/conversations/:id',   deleteConversation);

export default router;
