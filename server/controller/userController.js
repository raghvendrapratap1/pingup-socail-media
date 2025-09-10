//Get User Data using userId;

import imagekit from "../config/imageKit.js";
import Connection from "../models/Connection.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import fs from 'fs';
import { sendConnectionRequestReminder } from "../utils/sendEmail.js";

export const logoutUser=async(req,res,next)=>{
     try {
        // Browser/Postman me stored cookie clear kar do
        res.clearCookie('accessToken', {
            httpOnly: true,       // cookie sirf server se access ho
            secure: process.env.NODE_ENV === 'production', // HTTPS me secure
            sameSite: 'lax',
        });

        return res.json({ success: true, message: "User logged out, accessToken deleted" });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}

// Delete User Account
export const deleteAccount = async(req,res,next)=>{
    try {
        const userId = req.userId;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ success: false, message: "Password is required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Verify password
        const bcrypt = await import('bcryptjs');
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Incorrect password" });
        }

        // Delete user's posts and their media
        const userPosts = await Post.find({ user: userId });
        for (const post of userPosts) {
            // Delete post images from ImageKit
            if (post.image_urls && post.image_urls.length > 0) {
                for (const imageUrl of post.image_urls) {
                    try {
                        const urlParts = imageUrl.split('/');
                        const fileName = urlParts[urlParts.length - 1];
                        await imagekit.deleteFile(fileName);
                    } catch (mediaError) {
                        // Post image deletion error
                    }
                }
            }

            // Delete post videos from ImageKit
            if (post.video_urls && post.video_urls.length > 0) {
                for (const videoUrl of post.video_urls) {
                    try {
                        const urlParts = videoUrl.split('/');
                        const fileName = urlParts[urlParts.length - 1];
                        await imagekit.deleteFile(fileName);
                    } catch (mediaError) {
                        // Post video deletion error
                    }
                }
            }
        }

        // Delete user's stories and their media
        const Story = await import('../models/Story.js');
        const userStories = await Story.default.find({ user: userId });
        for (const story of userStories) {
            if (story.media_url && story.media_type !== 'text') {
                try {
                    const urlParts = story.media_url.split('/');
                    const fileName = urlParts[urlParts.length - 1];
                                            await imagekit.deleteFile(fileName);
                } catch (mediaError) {
                    // Story media deletion error
                }
            }
        }

        // Delete user's profile and cover pictures from ImageKit
        if (user.profile_picture) {
            try {
                const urlParts = user.profile_picture.split('/');
                const fileName = urlParts[urlParts.length - 1];
                await imagekit.deleteFile(fileName);
            } catch (mediaError) {
                // Profile picture deletion error
            }
        }

        if (user.cover_picture) {
            try {
                const urlParts = user.cover_picture.split('/');
                const fileName = urlParts[urlParts.length - 1];
                await imagekit.deleteFile(fileName);
            } catch (mediaError) {
                // Cover picture deletion error
            }
        }

        // Remove user from other users' connections and following lists
        await User.updateMany(
            { connections: userId },
            { $pull: { connections: userId } }
        );

        await User.updateMany(
            { following: userId },
            { $pull: { following: userId } }
        );

        // Delete user's posts
        await Post.deleteMany({ user: userId });

        // Delete user's stories
        await Story.default.deleteMany({ user: userId });

        // Delete user's connections
        await Connection.deleteMany({ 
            $or: [{ user1: userId }, { user2: userId }] 
        });

        // Delete user's messages
        const Messages = await import('../models/Messages.js');
        await Messages.default.deleteMany({ 
            $or: [{ from_user_id: userId }, { to_user_id: userId }] 
        });

        // Finally, delete the user
        await User.findByIdAndDelete(userId);

        // Clear cookie
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });

        return res.json({ success: true, message: "Account deleted successfully" });

    } catch (error) {
        console.error("Delete account error:", error);
        return res.status(500).json({ success: false, message: "Failed to delete account" });
    }
}


export const getUserData = async(req,res,next)=>{
    try{
        const userId = req.userId;

        const user = await User.findById(userId);

        if(!user){
            return res.json({success:false , message: "User not found"});
        }
        res.json({success:true,user});
    }catch(error){
        return res.json({success:false , message: error.message});

    }
}

//Update User Data
export const updateUserData = async(req,res,next)=>{
    try{
        const userId = req.userId;

        let {username,bio,location,full_name} = req.body;

        const tempuser = await User.findById(userId);

        !username  &&  (username = tempuser.username);

        if(tempuser.username  !== username){
             const user = await User.findOne({username});  

            if(user){
                // we will not change the username if it is taken by already someone
                username = tempuser.username;
            }
        }
        const updatedData = {
            username,
            bio,
            location,
            full_name
        }

const profile = req.files?.profile?.[0];
const cover = req.files?.cover?.[0];

if(profile){
    const buffer = fs.readFileSync(profile.path);
    const response = await imagekit.upload({
        file: buffer,
        fileName: profile.originalname
    });
    const url = imagekit.url({
        path: response.filePath,
        transformation: [
            {quality:'auto'},
            {format:'webp'},
            {width:'512'}
        ]
    });
    updatedData.profile_picture = url;
}

if(cover){
    const buffer = fs.readFileSync(cover.path);
    const response = await imagekit.upload({
        file: buffer,
        fileName: cover.originalname
    });
    const url = imagekit.url({
        path: response.filePath,
        transformation: [
            {quality:'auto'},
            {format:'webp'},
            {width:'1280'}
        ]
    });
    updatedData.cover_photo = url;
}


        const user = await User.findByIdAndUpdate(userId,updatedData,{new : true});
        
        res.json({success : true,user,message : 'Profile updated successfully'});
    }
    catch(error){
        return res.json({success:false , message: error.message});

    }
}


//Find Users using username , email ,  location , name 
export const discoversUsers = async(req,res,next)=>{
    try{
        const userId = req.userId;

        const {input}  = req.body;

        const allUsers = await User.find(
            {
                $or:[
                    {username:new RegExp(input,'i')},
                    {email:new RegExp(input,'i')},
                    {full_name:new RegExp(input,'i')},
                    {location:new RegExp(input,'i')}
                ]
            }
        )

        const filteredUser = allUsers.filter(user=>user._id.toString() !== userId);

        // Get current user's following list to check isFollowing status
        const currentUser = await User.findById(userId);
        const followingIds = currentUser.following.map(id => id.toString());

        // Get connection status for each user
        const connections = await Connection.find({
            $or: [
                { from_user_id: userId, to_user_id: { $in: filteredUser.map(u => u._id) } },
                { from_user_id: { $in: filteredUser.map(u => u._id) }, to_user_id: userId }
            ]
        });

        // Create a map of connection statuses
        const connectionStatusMap = {};
        connections.forEach(conn => {
            const otherUserId = conn.from_user_id.toString() === userId ? conn.to_user_id.toString() : conn.from_user_id.toString();
            connectionStatusMap[otherUserId] = conn.status;
        });

        // Add isFollowing and connectionStatus to each user
        const usersWithStatus = filteredUser.map(user => ({
            ...user.toObject(),
            isFollowing: followingIds.includes(user._id.toString()),
            connectionStatus: connectionStatusMap[user._id.toString()] || null
        }));

        res.json({success: true,users:usersWithStatus})


    }catch(error){
        return res.json({success:false , message: error.message});

    }
}

//follow user
export const followUser = async(req,res,next)=>{
    try{
        const userId = req.userId;

        const {id}  = req.body;

        const user = await User.findById(userId);

        if(user.following.includes(id)){
            return res.json({success:false,message:'You are already following this user'})
        }

        user.following.push(id);
        await user.save();

        const toUser = await User.findById(id);
        toUser.followers.push(userId);
        await toUser.save();

        res.json({success:true,message:'Now you are following this user'})
        

    }catch(error){
        return res.json({success:false , message: error.message});

    }
}

//UnFollow User
export const unfollowUser = async(req,res,next)=>{
    try{
        const userId = req.userId;
        const {id}  = req.body;

        // Use atomic $pull updates to handle ObjectId comparison correctly
        await User.findByIdAndUpdate(userId, { $pull: { following: id } });
        await User.findByIdAndUpdate(id, { $pull: { followers: userId } });

        res.json({success:true,message:'You are no longer follwoing this user'})
        
    }catch(error){
        return res.json({success:false , message: error.message});

    }
}

//Send Connection Request 

export const sendConnectionRequest  = async(req,res,next)=>{
    try{
        const userId=req.userId;
        const { id } = req.body;

        // Validate required fields
        if (!id) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        // check if user has send more than 20 connection requests in the last 24 hours 

        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const ConnectionRequests = await Connection.find({from_user_id:userId,created_at:{$gt: last24Hours}});

        if(ConnectionRequests.length >= 20){
            return res.json({success : false , message:'You have sent more than 20 connection requests in the last 24 hours'})
        }

        //check if users are already connected

        const connection = await Connection.findOne({
            $or:[
                {from_user_id: userId, to_user_id: id},
                {from_user_id: id, to_user_id: userId}
                
            ]
        });

        if(!connection){
            const newConnection = await Connection.create({
                from_user_id: userId,
                to_user_id:id
            })

            //triggered for connections via email
            await sendConnectionRequestReminder(newConnection._id);

            return res.json({success:true,message:'Connection request sent successfully'})
        }else if(connection && connection.status === 'accepted'){
            return res.json({success : false , message:'You are already connected with this users'});
        }
        
        return res.json({success:false,message:'Connection request pending'});
    }catch(error){
        return res.json({success:false , message: error.message});
    }
}


//Get User Connection
export const getUserConnections  = async(req,res,next)=>{
    try{
        const userId=req.userId;

        const user =  await User.findById(userId).populate('connections followers following')

        // Deduplicate by _id to avoid duplicate cards in UI
        const dedupe = (arr=[]) => {
            const map = new Map();
            arr.forEach((u)=>{ if(u?._id) map.set(String(u._id), u); });
            return Array.from(map.values());
        };

        const connections = dedupe(user.connections);
        const followers = dedupe(user.followers);
        const following = dedupe(user.following);

        const pendingConnections =  (await Connection.find({to_user_id: userId , status: 'pending'}).populate('from_user_id')).map(connection=>connection.from_user_id)
        
        res.json({success:true,connections,followers,following,pendingConnections});

    }catch(error){
        return res.json({success:false , message: error.message});
    }
}

//Accept Connection Request
export const acceptConnectionRequest  = async(req,res,next)=>{
    try{
        const userId=req.userId;

        const {id} = req.body;

        const connection = await Connection.findOne({from_user_id:id,to_user_id:userId});

        if(!connection){
            return res.json({success:false,message:'Connection not found'});
        }

        // Use $addToSet to avoid duplicates
        await User.findByIdAndUpdate(userId, {$addToSet: { connections: id }});
        await User.findByIdAndUpdate(id, {$addToSet: { connections: userId }});
       
        connection.status = 'accepted';
        await connection.save();

        res.json({success:true,message:'Connection accepted successfully' })

    }catch(error){
        return res.json({success:false , message: error.message});
    }
}

//GET USER PROFILES

export const getUserProfiles = async(req,res)=>{
    try{
        const {profileId} = req.body;
        const profile = await User.findById(profileId);

        if(!profileId){
            return res.json({success:false,message:'Profile not found'});
        };
        const posts = await Post.find({user:profileId}).populate('user');

        res.json({success:true,profile,posts});
    }catch(error){
        res.json({success:true,message:error.message})
    }
}