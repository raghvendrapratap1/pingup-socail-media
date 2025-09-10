import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema({
    emoji: { type: String, required: true },
    users: [{ type: String, ref: 'User' }]
}, { _id: false });

const messageSchema = new mongoose.Schema({
    from_user_id: {type:String,ref:'User',required:true},
    to_user_id: {type:String,ref:'User',required:true},
    text: {type:String,trim:true},
    message_type: {type:String,enum:['text','image','video']},
    media_url:{type:String},
    seen:{type:Boolean,default:false},
    edited:{type:Boolean,default:false},
    editedAt:{type:Date},
    reactions: { type: [reactionSchema], default: [] },
    reply_to: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
},{
    timestamps:true,minimize:false
})

const Message = mongoose.model('Message',messageSchema);
export default Message;
