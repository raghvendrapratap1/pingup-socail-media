import  upload  from '../config/multer.js';
import { addPost, getFeedPosts, likePost, deletePost, getPostComments, addPostComment, getLikedPosts, deleteComment, updateComment } from '../controller/postController.js';
import auth from '../middleware/auth.js';
import express from 'express';

const postRouter = express.Router();

// Updated to accept both images and videos with flexible field name
postRouter.post('/add', upload.array('media', 10), auth, addPost);

postRouter.get('/feed', auth, getFeedPosts);

postRouter.post('/comments', auth, addPostComment);

postRouter.get('/comments', auth, getPostComments);

postRouter.put('/comment/update/:postId/:commentId', auth, updateComment);

postRouter.delete('/comment/delete/:postId/:commentId', auth, deleteComment);

postRouter.post('/like', auth, likePost);

postRouter.delete('/delete/:postId', auth, deletePost);

postRouter.get('/liked', auth, getLikedPosts);

export default postRouter;