import { Router } from 'express';
import { ping, chat } from '../controller/geminiController.js';
import validateChatRequest from '../middleware/geminiValidate.js';

const router = Router();

// Only two endpoints as requested
router.get('/', ping);
router.post('/chat', validateChatRequest, chat);

export default router;


