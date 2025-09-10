import React, { useState, useEffect } from 'react';
import moment from 'moment';
import api from '../api/axios';
import { Smile } from 'lucide-react';

const MessageBubble = ({ message, isOwn, currentUser, onReply, onReact, onForward, onUpdated, onDeleted, uploading=false, progress=0 }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showOptions, setShowOptions] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(message.text || '');
    
    // Update time every minute for real-time feel
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute
        
        return () => clearInterval(interval);
    }, []);

    const canEdit = () => {
        if (!isOwn) return false;
        const created = new Date(message.createdAt).getTime();
        return Date.now() - created <= 60 * 1000; // 1 minute window
    }

    const canDelete = () => isOwn;

    const saveEdit = async () => {
        const text = editText.trim();
        if(!text) return;
        if(!message?._id){
            console.error('Cannot edit: message._id missing', message);
            return;
        }
        try{
            const url = `/api/message/edit/${message._id}`;
            const { data } = await api.put(url, { text });
            if(data?.success){
                setIsEditing(false);
                onUpdated && onUpdated(data.data);
            } else {
                console.error('Edit failed:', data);
            }
        }catch(err){
            console.error('Edit request failed:', err);
        }
    }

    const deleteMsg = async () => {
        if(!message?._id){
            console.error('Cannot delete: message._id missing', message);
            return;
        }
        try{
            const url = `/api/message/delete/${message._id}`;
            const { data } = await api.delete(url);
            if(data?.success){
                onDeleted && onDeleted(message._id);
            } else {
                console.error('Delete failed:', data);
            }
        }catch(err){
            console.error('Delete request failed:', err);
        }
    }

    const react = async (emoji) => {
        if(!message?._id) return;
        try{
            const { data } = await api.post(`/api/message/react/${message._id}`, { emoji });
            if(data?.success){
                onUpdated && onUpdated(data.data);
            }
        }catch(err){
            console.error('React request failed:', err);
        }
    }

    const formatMessageTime = (messageTime) => {
        const messageDate = new Date(messageTime);
        const now = currentTime;
        
        if (moment(messageDate).isSame(now, 'day')) {
            return moment(messageDate).format('HH:mm');
        } else if (moment(messageDate).isSame(moment(now).subtract(1, 'day'), 'day')) {
            return 'Yesterday ' + moment(messageDate).format('HH:mm');
        } else if (moment(messageDate).isSame(now, 'week')) {
            return moment(messageDate).format('ddd HH:mm');
        } else {
            return moment(messageDate).format('DD/MM/YYYY HH:mm');
        }
    };

    const getMessageStatus = () => {
        if (!isOwn) return null;
        
        if (message.delivered && message.seen) {
            return <span className="text-blue-500 text-xs">✓✓✓</span>;
        } else if (message.delivered) {
            return <span className="text-gray-400 text-xs">✓✓</span>;
        } else {
            return <span className="text-gray-400 text-xs">✓</span>;
        }
    };

    const handleMessageOptions = () => {
        setShowOptions(!showOptions);
    };

    const handleReply = () => {
        onReply && onReply(message);
        setShowOptions(false);
    };

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group relative`}>
            {/* Message Bubble */}
            <div className={`relative max-w-sm lg:max-w-md xl:max-w-lg ${
                isOwn ? 'order-2' : 'order-1'
            }`}>
                {/* Reply to message (if exists) */}
                {message.replyTo && (
                    <div className={`mb-2 p-3 rounded-lg border-l-4 ${
                        isOwn 
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-800' 
                            : 'bg-gray-50 border-gray-400 text-gray-700'
                    }`}>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold uppercase tracking-wide">
                                {isOwn ? 'You replied to' : 'Replied to'}
                            </span>
                            <span className="text-xs text-gray-500">
                                {message.replyTo.from_user_id?.full_name || 'Unknown'}
                            </span>
                        </div>
                        <div className="text-sm font-medium truncate">
                            {message.replyTo.text || 'Media message'}
                        </div>
                        {message.replyTo.message_type === 'image' && (
                            <div className="text-xs text-gray-500 mt-1">📷 Image</div>
                        )}
                        {message.replyTo.message_type === 'video' && (
                            <div className="text-xs text-gray-500 mt-1">🎥 Video</div>
                        )}
                    </div>
                )}

                {/* Main Message Bubble */}
                <div className={`relative p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${
                    isOwn 
                        ? 'bg-purple-500 text-white rounded-br-md' 
                        : 'bg-white text-gray-800 rounded-bl-md border border-gray-200'
                } ${message.replyTo ? 'border-l-4 border-l-purple-400' : ''}`}>
                    {/* Reply indicator */}
                    {message.replyTo && (
                        <div className="absolute -left-2 top-2 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">↩</span>
                        </div>
                    )}
                    {/* Uploading overlay for temp messages */}
                    {uploading && (
                        <div className="absolute inset-0 bg-black/20 rounded-lg flex items-end justify-end p-2">
                            <span className="bg-white/90 text-gray-800 text-xs px-2 py-1 rounded-full shadow">Sending… {progress}%</span>
                        </div>
                    )}
                    {/* Message content */}
                    {isEditing ? (
                        <input
                            className="w-full rounded px-2 py-1 text-gray-900"
                            value={editText}
                            onChange={(e)=>setEditText(e.target.value)}
                            onKeyDown={(e)=>{ if(e.key==='Enter') saveEdit(); if(e.key==='Escape') setIsEditing(false); }}
                            autoFocus
                        />
                    ) : (
                        <>
                            {message.message_type === 'image' && message.media_url ? (
                                <img 
                                    src={message.media_url} 
                                    alt="" 
                                    className='w-full max-w-sm rounded-lg mb-2'
                                />
                            ) : null}
                            <p className="mb-1 break-words">
                                {message.text}
                                {message.edited && <span className="ml-2 text-xs opacity-70">(edited)</span>}
                            </p>
                        </>
                    )}
                    
                    {/* Reactions attached under the bubble (inside) */}
                    {Array.isArray(message.reactions) && message.reactions.length > 0 && (
                        <div className={`mt-2 flex flex-wrap gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            {message.reactions.map(r => (
                                <div key={r.emoji} className={`bg-white/80 ${isOwn ? 'text-gray-800' : 'text-gray-700'} border border-gray-200 rounded-full px-2 py-0.5 shadow-sm flex items-center gap-1`}>
                                    <span>{r.emoji}</span>
                                    <span className="text-[11px]">{Array.isArray(r.users) ? r.users.length : 0}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Timestamp and Status */}
                    <div className={`flex items-center justify-end gap-1 text-xs ${
                        isOwn ? 'text-white opacity-80' : 'text-gray-500'
                    }`}>
                        <span className="font-medium">
                            {formatMessageTime(message.createdAt)}
                        </span>
                        {getMessageStatus()}
                    </div>
                </div>

                {/* Message Options Menu */}
                <div className={`absolute top-0 ${isOwn ? 'left-0' : 'right-0'} transform -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10`}>
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 min-w-32">
                        <button 
                            onClick={handleReply}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                        >
                            <span>↩️</span> Reply
                        </button>
                        <div className="flex items-center gap-1 px-2 py-1">
                            {['👍','❤️','😂','😮','😢','🙏'].map(e => (
                                <button key={e} onClick={()=>react(e)} className="text-lg hover:scale-110 transition-transform">
                                    {e}
                                </button>
                            ))}
                        </div>
                        {isOwn && canEdit() && !isEditing && (
                            <button 
                                onClick={()=> setIsEditing(true)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                            >
                                ✏️ Edit
                            </button>
                        )}
                        {isOwn && (
                            <button 
                                onClick={deleteMsg}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2 text-red-600"
                            >
                                🗑️ Delete
                            </button>
                        )}
                        {isEditing && (
                            <button 
                                onClick={saveEdit}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2 text-green-600"
                            >
                                💾 Save
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Removed external reactions container */}

            {/* User Avatar (for received messages) */}
            {!isOwn && message.from_user_id?.profile_picture && (
                <div className="order-2 ml-2 self-end">
                    <img 
                        src={message.from_user_id.profile_picture} 
                        alt="" 
                        className="w-8 h-8 rounded-full"
                    />
                </div>
            )}
        </div>
    );
};

export default MessageBubble;
