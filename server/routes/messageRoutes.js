import express from 'express';
import { getChatMessage, sendMessage, clearChat, editMessage, deleteMessage, toggleReaction } from '../controller/messageController.js';
import upload from '../config/multer.js';
import auth from '../middleware/auth.js';

const messageRouter = express.Router();
messageRouter.post('/send',upload.single('media'),auth,sendMessage);
messageRouter.post('/get',auth,getChatMessage);
messageRouter.put('/edit/:messageId',auth,editMessage);
messageRouter.delete('/delete/:messageId',auth,deleteMessage);
messageRouter.post('/react/:messageId',auth,toggleReaction);

export default messageRouter;
