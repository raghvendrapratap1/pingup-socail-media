import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { addMessage, fetchMessages, resetMessages, updateMessage as updateMessageAction, deleteMessage as deleteMessageAction } from '../features/messages/messagesSlice';
import toast from 'react-hot-toast';
import moment from 'moment';
import MessageBubble from '../components/MessageBubble';
import ChatHeader from '../components/ChatHeader';
import ChatInput from '../components/ChatInput';
import TypingIndicator from '../components/TypingIndicator';
import { useSocket } from '../context/SocketContext';
import Swal from 'sweetalert2';

const ChatBox = () => {
    const {messages}=useSelector((state)=>state.messages);

    const {userId} = useParams();
    const dispatch = useDispatch();
    const { emit, on, off } = useSocket();

    const [text,setText]=useState('');
    const [image,setImage]=useState(null);
    const [videoFile,setVideoFile]=useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [user,setUser]=useState(null);
    const [replyTo, setReplyTo] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [lastSeen, setLastSeen] = useState(null);
    const messagesEndRef=useRef(null);
    const typingTimeoutRef = useRef(null);
    const currentUser = useSelector((state)=>state.user.value);

    const connections = useSelector((state)=>state.connections.connections)

    const fetchUserMessages = async()=>{
        try{
            dispatch(fetchMessages({userId}))
        }catch(error){
            toast.error(error.message);
        }
    }

    const sendMessages = async({ videoSelected } = {})=>{
        try{
            if(!text && !image && !videoFile) return 
            const formData = new FormData();
            formData.append('to_user_id', userId);
            formData.append('text',text);
            const media = videoSelected ? videoFile : image;
            if(media){ formData.append('media', media) }
            if(replyTo) { formData.append('reply_to', replyTo._id) }

            // Optimistic temp message
            const tempId = `temp-${Date.now()}`;
            const tempMessage = {
                _id: tempId,
                from_user_id: currentUser?._id,
                to_user_id: userId,
                text,
                message_type: media ? (media.type?.startsWith('video/') ? 'video' : 'image') : 'text',
                media_url: media ? URL.createObjectURL(media) : undefined,
                createdAt: new Date().toISOString(),
                delivered: false,
                seen: false,
                reactions: [],
                reply_to: replyTo ? {
                    _id: replyTo._id,
                    text: replyTo.text,
                    message_type: replyTo.message_type,
                    from_user_id: replyTo.from_user_id
                } : undefined
            };
            dispatch(addMessage(tempMessage));

            setIsUploading(!!media);
            setUploadProgress(0);

            const {data} = await api.post('/api/message/send',formData,{
                onUploadProgress: (evt)=>{
                    if (!evt.total) return;
                    const pct = Math.round((evt.loaded * 100) / evt.total);
                    setUploadProgress(pct);
                }
            });

            if(data.success){
                setText('');
                setImage(null);
                setVideoFile(null);
                setReplyTo(null);
                // Replace temp with real
                dispatch(deleteMessageAction(tempId));
                dispatch(addMessage(data.message));
                setIsUploading(false);
                setUploadProgress(0);
                setIsTyping(false);
                emit('stopTyping', { to_user_id: userId });
            }
            else{
                throw new Error(data.message);
            }
        }catch(error){
            setIsUploading(false);
            setUploadProgress(0);
            // Remove temp message on error
            // We don't have tempId here if exception before declared; ensure safe
            // In this scope tempId exists; remove it
            try { dispatch(deleteMessageAction(tempId)); } catch {}
            toast.error(error.message)
        }
    }

    // Handle typing events
    const handleTyping = (text) => {
        // Emit typing event
        if (!isTyping) {
            setIsTyping(true);
            emit('typing', { to_user_id: userId });
        }
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        // Set timeout to stop typing indicator
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            emit('stopTyping', { to_user_id: userId });
        }, 2000); // Stop typing indicator after 2 seconds of no input
    };

    const handleReply = (message) => {
        setReplyTo(message);
    };

    const handleCancelReply = () => {
        setReplyTo(null);
    };

    const handleClearChat = async () => {
        try {
            const result = await Swal.fire({
                title: 'Clear Chat?',
                text: `Are you sure you want to clear all messages with ${user?.full_name}? This action cannot be undone.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Yes, clear chat!',
                cancelButtonText: 'Cancel',
                reverseButtons: true,
                customClass: {
                    popup: 'rounded-lg',
                    confirmButton: 'rounded-lg',
                    cancelButton: 'rounded-lg'
                }
            });

            if (result.isConfirmed) {
                // Show loading state
                Swal.fire({
                    title: 'Clearing chat...',
                    text: 'Please wait while we clear your messages.',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Call API to clear messages
                const { data } = await api.delete(`/api/message/clear-chat/${userId}`);
                
                if (data.success) {
                    // Clear messages from Redux store
                    dispatch(resetMessages());
                    
                    // Show success message
                    Swal.fire({
                        title: 'Chat Cleared!',
                        text: 'All messages have been cleared successfully.',
                        icon: 'success',
                        confirmButtonColor: '#10b981',
                        customClass: {
                            popup: 'rounded-lg',
                            confirmButton: 'rounded-lg'
                        }
                    });
                    
                    toast.success('Chat cleared successfully!');
                } else {
                    throw new Error(data.message || 'Failed to clear chat');
                }
            }
        } catch (error) {
            console.error('Error clearing chat:', error);
            
            // Show error message
            Swal.fire({
                title: 'Error!',
                text: error.message || 'Failed to clear chat. Please try again.',
                icon: 'error',
                confirmButtonColor: '#ef4444',
                customClass: {
                    popup: 'rounded-lg',
                    confirmButton: 'rounded-lg'
                }
            });
            
            toast.error('Failed to clear chat');
        }
    };





    const handleSearch = () => {
        toast.success('Search feature coming soon!');
    };

    const handleCall = () => {
        toast.success('Call feature coming soon!');
    };

    const handleVideoCall = () => {
        toast.success('Video call feature coming soon!');
    };

    useEffect(()=>{
        if(connections.length > 0){
            const user = connections.find(connection=>connection._id === userId)
            setUser(user);
            // Default to offline - in real app, this would come from Socket.IO
            setIsOnline(false);
            setLastSeen(new Date(Date.now() - Math.random() * 86400000)); // Random last seen
        }
    },[connections,userId])

    useEffect(()=>{
        fetchUserMessages()
        
        // Listen for typing events
        const handleUserTyping = (data) => {
            if (data.from_user_id === userId) {
                setOtherUserTyping(true);
            }
        };
        
        const handleUserStopTyping = (data) => {
            if (data.from_user_id === userId) {
                setOtherUserTyping(false);
            }
        };
        
        on('userTyping', handleUserTyping);
        on('userStopTyping', handleUserStopTyping);
        
        // Socket.IO is now handled globally in App.jsx
        return ()=>{
            dispatch(resetMessages());
            off('userTyping', handleUserTyping);
            off('userStopTyping', handleUserStopTyping);
            
            // Clear typing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        }
    },[userId,currentUser?._id, on, off, emit])

    // Scroll to bottom when messages change or when user enters chat
    useEffect(()=>{
        messagesEndRef.current?.scrollIntoView({behavior:"smooth"})
    },[messages]);

    // Scroll to bottom when user enters the chat
    useEffect(()=>{
        if (user) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({behavior:"smooth"})
            }, 100);
        }
    },[user]);

    // Function to group messages by date
    const groupMessagesByDate = () => {
        const sortedMessages = [...messages].sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt));
        const grouped = [];
        let currentDate = null;
        let currentGroup = [];

        sortedMessages.forEach((message, index) => {
            const messageDate = moment(message.createdAt).format('YYYY-MM-DD');
            
            if (messageDate !== currentDate) {
                // Save previous group if exists
                if (currentGroup.length > 0) {
                    grouped.push({
                        type: 'date',
                        date: currentDate,
                        messages: currentGroup
                    });
                }
                
                // Start new group
                currentDate = messageDate;
                currentGroup = [message];
            } else {
                currentGroup.push(message);
            }
        });

        // Add the last group
        if (currentGroup.length > 0) {
            grouped.push({
                type: 'date',
                date: currentDate,
                messages: currentGroup
            });
        }

        return grouped;
    };

    const formatDateHeader = (dateString) => {
        const date = moment(dateString);
        const today = moment();
        const yesterday = moment().subtract(1, 'day');

        if (date.isSame(today, 'day')) {
            return 'Today';
        } else if (date.isSame(yesterday, 'day')) {
            return 'Yesterday';
        } else if (date.isSame(today, 'week')) {
            return date.format('dddd'); // Day name (Monday, Tuesday, etc.)
        } else {
            return date.format('DD/MM/YYYY'); // Full date
        }
    };

  return user ? (
    <div className='flex flex-col h-screen bg-gray-50'>
        {/* WhatsApp-style header */}
        <ChatHeader 
            user={user}
            isOnline={isOnline}
            lastSeen={lastSeen}
            onSearch={handleSearch}
            onCall={handleCall}
            onVideoCall={handleVideoCall}
            onClearChat={handleClearChat}
        />

        {/* Messages area */}
        <div className='flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4'>
            <div className='max-w-4xl mx-auto space-y-4'>
                {
                    groupMessagesByDate().map((group, groupIndex) => (
                        <div key={group.date} className="space-y-2">
                            {/* Date separator */}
                            <div className="flex justify-center my-4">
                                <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                                    {formatDateHeader(group.date)}
                                </div>
                            </div>
                            
                            {/* Messages for this date */}
                            {group.messages.map((message, index) => {
                                const fromId = message?.from_user_id?._id || message?.from_user_id;
                                const isOwn = currentUser?._id && fromId === currentUser._id;
                                const isTemp = (message?._id || '').startsWith('temp-');
                                return (
                                    <MessageBubble
                                        key={message._id || `${group.date}-${index}`}
                                        message={message}
                                        isOwn={isOwn}
                                        currentUser={currentUser}
                                        onReply={handleReply}
                                        onUpdated={(updated)=> dispatch(updateMessageAction(updated))}
                                        onDeleted={(id)=> dispatch(deleteMessageAction(id))}
                                        uploading={isTemp && isUploading}
                                        progress={isTemp ? uploadProgress : 0}
                                    />
                                )
                            })}
                        </div>
                    ))
                }
                
                {/* Typing indicator */}
                <TypingIndicator isTyping={otherUserTyping} userName={user.full_name} />
                
                <div ref={messagesEndRef} />
            </div>
        </div>

        {/* WhatsApp-style input */}
        <ChatInput
            text={text}
            setText={setText}
            image={image}
            setImage={setImage}
            onSend={sendMessages}
            replyTo={replyTo}
            onCancelReply={handleCancelReply}
            onTyping={handleTyping}
            isTyping={isTyping}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            video={videoFile}
            setVideo={setVideoFile}
        />
    </div>
  ) : (
    <div className="flex items-center justify-center h-screen">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading chat...</p>
        </div>
    </div>
  )
}

export default ChatBox