
import fs from 'fs'
import imagekit from '../config/imageKit.js';
import Message from '../models/Messages.js';

//Send Message
export const sendMessage = async(req,res)=>{
    try{
        const userId = req.userId;
        const {to_user_id, text, reply_to} = req.body;
        const file= req.file; // renamed: can be image or video

        let media_url = '';
        let message_type = file ? (file.mimetype?.startsWith('video/') ? 'video' : 'image') : 'text' ;

        if(message_type === 'image' || message_type === 'video'){
            const fileBuffer = fs.readFileSync(file.path);
            const response = await imagekit.upload({
                file:fileBuffer,
                fileName:file.originalname,
                folder: message_type === 'video' ? 'messages/videos' : 'messages/images'
            });

            media_url = response.url; // use direct URL returned
        }

        const messageData = {
            from_user_id: userId,
            to_user_id,
            text,
            message_type,
            media_url
        };

        // Add reply_to if provided
        if(reply_to) {
            messageData.reply_to = reply_to;
        }

        const created = await Message.create(messageData);

        const populated = await Message.findById(created._id)
            .populate('from_user_id to_user_id')
            .populate({
                path: 'reply_to',
                populate: {
                    path: 'from_user_id',
                    select: 'full_name username profile_picture'
                }
            });

        res.json({success:true,message: populated});

        // Send message to recipient using Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${to_user_id}`).emit('newMessage', populated);
        }
     }catch(error){
        res.json({success:false,message:error.message});
    }
}

// Edit Message (allowed within 1 minute by sender only)
export const editMessage = async(req,res)=>{
    try{
        const userId = req.userId;
        const { messageId } = req.params;
        const { text } = req.body;

        if(!text || !text.trim()){
            return res.status(400).json({success:false,message:'Message cannot be empty'});
        }

        const message = await Message.findById(messageId);
        if(!message) return res.status(404).json({success:false,message:'Message not found'});
        if(String(message.from_user_id) !== String(userId)){
            return res.status(403).json({success:false,message:'Not authorized to edit this message'});
        }

        // 1 minute window
        const oneMinute = 60 * 1000;
        if(Date.now() - new Date(message.createdAt).getTime() > oneMinute){
            return res.status(400).json({success:false,message:'Edit window expired'});
        }

        message.text = text.trim();
        message.edited = true;
        message.editedAt = new Date();
        await message.save();

        return res.json({success:true,message:'Message updated', data: message});
    }catch(error){
        res.status(500).json({success:false,message:error.message});
    }
}

// Delete Message (sender only)
export const deleteMessage = async(req,res)=>{
    try{
        const userId = req.userId;
        const { messageId } = req.params;

        const message = await Message.findById(messageId);
        if(!message) return res.status(404).json({success:false,message:'Message not found'});
        if(String(message.from_user_id) !== String(userId)){
            return res.status(403).json({success:false,message:'Not authorized to delete this message'});
        }

        await Message.findByIdAndDelete(messageId);
        return res.json({success:true,message:'Message deleted'});
    }catch(error){
        res.status(500).json({success:false,message:error.message});
    }
}

//Get Chat Message
export const getChatMessage = async (req,res)=>{
    try{
        const userId= req.userId;

        const {to_user_id} = req.body;

        const messages = await Message.find({
            $or:[
                {from_user_id: userId, to_user_id},
                {from_user_id: to_user_id, to_user_id:userId},
            ]
        }).populate('from_user_id to_user_id')
        .populate({
            path: 'reply_to',
            populate: {
                path: 'from_user_id',
                select: 'full_name username profile_picture'
            }
        }).sort({createdAt: -1});

        //Mark Messages has seen
        await Message.updateMany({from_user_id: to_user_id,to_user_id:userId},{seen:true});

        res.json({success:true,messages})
    }catch(error){
        res.json({success:false,message:error.message})
    }
}

export const getUserRecentMessages = async(req,res)=>{
    try{
        const userId = req.userId;
        // Fetch both sent and received messages for this user
        const messages = await Message.find({
            $or: [
                { to_user_id: userId },
                { from_user_id: userId },
            ]
        }).populate('from_user_id to_user_id').sort({createdAt: -1});

        res.json({success:true,messages});

    }catch(error){
        res.json({success:false,message: error.message})
    }
};

// Clear chat messages between two users
export const clearChat = async (req, res) => {
    try {
        const userId = req.userId;
        const { to_user_id } = req.params;

        if (!to_user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Delete all messages between the two users
        const result = await Message.deleteMany({
            $or: [
                { from_user_id: userId, to_user_id: to_user_id },
                { from_user_id: to_user_id, to_user_id: userId }
            ]
        });

        res.json({
            success: true,
            message: 'Chat cleared successfully',
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('Error clearing chat:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear chat'
        });
    }
};

// Toggle Reaction (add/remove for current user)
export const toggleReaction = async(req,res)=>{
    try{
        const userId = req.userId;
        const { messageId } = req.params;
        const { emoji } = req.body;

        if(!emoji) return res.status(400).json({success:false,message:'Emoji is required'});

        const message = await Message.findById(messageId);
        if(!message) return res.status(404).json({success:false,message:'Message not found'});

        let reaction = message.reactions.find(r => r.emoji === emoji);
        if(!reaction){
            reaction = { emoji, users: [String(userId)] };
            message.reactions.push(reaction);
        } else {
            const hasReacted = reaction.users.includes(String(userId));
            if(hasReacted){
                reaction.users = reaction.users.filter(id => id !== String(userId));
                // Remove reaction entirely if no users left
                if(reaction.users.length === 0){
                    message.reactions = message.reactions.filter(r => r.emoji !== emoji);
                }
            }else{
                reaction.users.push(String(userId));
            }
        }

        await message.save();
        return res.json({success:true,message:'Reaction updated', data: message});
    }catch(error){
        res.status(500).json({success:false,message:error.message});
    }
}