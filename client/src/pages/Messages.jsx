import React, { useMemo, useEffect, useState } from 'react'
import { dummyConnectionsData } from '../assets/assets'
import { Eye, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import moment from 'moment';

const Messages = () => {

    const {connections} =  useSelector((state)=>state.connections)
    const currentUser = useSelector((state) => state.user.value);
    const navigate=useNavigate();
    const [recentMessages, setRecentMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    const uniqueConnections = useMemo(() => {
        const idToUser = new Map();
        for (const user of connections || []) {
            if (user && user._id && !idToUser.has(user._id)) {
                idToUser.set(user._id, user);
            }
        }
        return Array.from(idToUser.values());
    }, [connections]);

    // Fetch recent messages for all connections
    const fetchRecentMessages = async () => {
        setLoading(true);
        try {
            const { data } = await api.post('/api/user/recent-messages');
            console.log('Recent messages data:', data); // Debug log
            if (data.success) {
                const allMessages = data.messages || [];
                const currentUserId = currentUser?._id;

                // Map: otherUserId -> latest message
                const convoMap = new Map();

                for (const msg of allMessages) {
                    const fromId = msg.from_user_id?._id || msg.from_user_id;
                    const toId = msg.to_user_id?._id || msg.to_user_id;

                    const isSentByMe = fromId === currentUserId;

                    // Determine the other participant consistently
                    const otherUserObj = isSentByMe ? (msg.to_user_id || {}) : (msg.from_user_id || {});
                    const otherUserId = otherUserObj?._id || otherUserObj;

                    // Skip self-conversations if any exist
                    if (!otherUserId || otherUserId === currentUserId) continue;

                    const enriched = {
                        ...msg,
                        isSentByMe,
                        otherUser: otherUserObj,
                    };

                    const existing = convoMap.get(otherUserId);
                    if (!existing || new Date(msg.createdAt) > new Date(existing.createdAt)) {
                        convoMap.set(otherUserId, enriched);
                    }
                }

                const sorted = Array.from(convoMap.values()).sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );

                setRecentMessages(sorted);
            }
        } catch (error) {
            console.error('Error fetching recent messages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (uniqueConnections.length > 0) {
            fetchRecentMessages();
        }
    }, [uniqueConnections]);

    // Helper function to get last message for a user
    const getLastMessage = (userId) => {
        const conversation = recentMessages.find(conv => {
            const otherUserId = conv.otherUser?._id || conv.otherUser;
            return otherUserId === userId;
        });
        return conversation;
    };

    // Get sorted connections based on recent messages
    const getSortedConnections = () => {
        if (recentMessages.length === 0) return uniqueConnections;
        
        // Create a map of userId -> last message timestamp
        const userTimestampMap = new Map();
        recentMessages.forEach(conv => {
            const otherUserId = conv.otherUser?._id || conv.otherUser;
            if (otherUserId) {
                userTimestampMap.set(otherUserId, new Date(conv.createdAt));
            }
        });
        
        // Sort connections by their last message timestamp
        return [...uniqueConnections].sort((a, b) => {
            const aTimestamp = userTimestampMap.get(a._id);
            const bTimestamp = userTimestampMap.get(b._id);
            
            // If both have timestamps, sort by most recent
            if (aTimestamp && bTimestamp) {
                return bTimestamp - aTimestamp;
            }
            
            // If only one has timestamp, prioritize the one with timestamp
            if (aTimestamp && !bTimestamp) return -1;
            if (!aTimestamp && bTimestamp) return 1;
            
            // If neither has timestamp, maintain original order
            return 0;
        });
    };

    // Helper function to format message time
    const formatMessageTime = (timestamp) => {
        if (!timestamp) return '';
        
        const messageTime = moment(timestamp);
        const now = moment();
        
        if (messageTime.isSame(now, 'day')) {
            return messageTime.format('HH:mm');
        } else if (messageTime.isSame(now.subtract(1, 'day'), 'day')) {
            return 'Yesterday';
        } else if (messageTime.isSame(now, 'week')) {
            return messageTime.format('ddd');
        } else {
            return messageTime.format('DD/MM');
        }
    };

  return (
    <div className='min-h-screen bg-white'>
        <div className='w-full px-6'>
            
            {/* Header */}
            <div className='border-b border-gray-200 px-6 py-4'>
                <div className='flex items-center justify-between'>
                    <h1 className='text-xl font-semibold text-gray-900'>Messages</h1>
                </div>
            </div>

            {/* Messages List */}
            <div className='divide-y divide-gray-100'>
                {getSortedConnections().length > 0 ? (
                    getSortedConnections().map((user) => {
                        const lastMessage = getLastMessage(user._id);
                        console.log(`Last message for ${user.full_name}:`, lastMessage); // Debug log
                        return (
                            <div 
                                key={user._id} 
                                onClick={() => navigate(`/messages/${user._id}`)}
                                className='flex items-center gap-3 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors'
                            >
                                {/* Profile Picture - Clickable for Profile */}
                                <div 
                                    className='relative flex-shrink-0'
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/profile/${user._id}`);
                                    }}
                                >
                                    {user.profile_picture ? (
                                        <img 
                                            src={user.profile_picture} 
                                            className='w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity' 
                                            alt="" 
                                        />
                                    ) : (
                                        <div className='w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold cursor-pointer hover:opacity-80 transition-opacity'>
                                            {user.full_name ? user.full_name.charAt(0) : 'U'}
                                        </div>
                                    )}
                                    {/* Online indicator */}
                                    <div className='absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 rounded-full border-2 border-white'></div>
                                </div>

                                {/* User Info and Last Message */}
                                <div className='flex-1 min-w-0'>
                                    <div className='flex items-center justify-between'>
                                        <h3 className='font-medium text-gray-900 truncate'>{user.full_name}</h3>
                                        {lastMessage && (
                                            <span className='text-xs text-gray-500 flex-shrink-0 ml-2'>
                                                {formatMessageTime(lastMessage.createdAt)}
                                            </span>
                                        )}
                                    </div>
                                    <p className='text-sm text-gray-500 truncate'>
                                        {lastMessage ? (
                                            <>
                                                {lastMessage.isSentByMe && <span className='text-gray-400'>You: </span>}
                                                {lastMessage.text ? (
                                                    lastMessage.text
                                                ) : lastMessage.image ? (
                                                    'Image'
                                                ) : lastMessage.message ? (
                                                    lastMessage.message
                                                ) : (
                                                    'Media message'
                                                )}
                                            </>
                                        ) : (
                                            ''
                                        )}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className='flex flex-col items-center justify-center py-16 px-6'>
                        <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
                            <MessageSquare className='w-8 h-8 text-gray-400' />
                        </div>
                        <h3 className='text-lg font-medium text-gray-900 mb-2'>No messages yet</h3>
                        <p className='text-gray-500 text-center'>Start a conversation with your connections</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  )
}

export default Messages;
