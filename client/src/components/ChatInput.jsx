import React, { useState, useRef } from 'react';
import { ImageIcon, SendHorizonal, Smile, X } from 'lucide-react';

const ChatInput = ({ 
    text, 
    setText, 
    image, 
    setImage, 
    onSend, 
    replyTo, 
    onCancelReply,
    onTyping,
    isTyping,
    isUploading = false,
    uploadProgress = 0,
    video,
    setVideo
}) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const mediaInputRef = useRef(null);

    const handleTextChange = (e) => {
        setText(e.target.value);
        onTyping && onTyping(e.target.value);
    };

    const handleSend = () => {
        if (isUploading) return;
        if (text.trim() || image || video) {
            onSend({ videoSelected: !!video });
            setVideo && setVideo(null);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleMediaSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type.startsWith('image/')) {
            setImage(file);
            setVideo && setVideo(null);
        } else if (file.type.startsWith('video/')) {
            setVideo && setVideo(file);
            setImage(null);
        }
    };

    const emojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '😎', '🤔', '😢', '😡', '🥳', '😴'];

    return (
        <div className="bg-white border-t border-gray-200 p-3">
            {/* Clear status chip for uploading */}
            {isUploading && (
                <div className="mb-2 flex items-center gap-2">
                    <div className="px-3 py-1 rounded-full text-xs bg-purple-50 text-purple-700 border border-purple-200">
                        Uploading video… {uploadProgress}%
                    </div>
                    <div className="flex-1 h-1 bg-gray-200 rounded overflow-hidden">
                        <div className="h-full bg-purple-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                </div>
            )}

            {/* Reply preview */}
            {replyTo && (
                <div className="mb-3 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                                    Replying to
                                </span>
                                <span className="text-xs text-purple-600">
                                    {replyTo.from_user_id?.full_name || 'Unknown'}
                                </span>
                            </div>
                            <div className="text-sm text-gray-800 font-medium truncate">
                                {replyTo.text || 'Media message'}
                            </div>
                            {replyTo.message_type === 'image' && (
                                <div className="text-xs text-purple-600 mt-1">📷 Image message</div>
                            )}
                            {replyTo.message_type === 'video' && (
                                <div className="text-xs text-purple-600 mt-1">🎥 Video message</div>
                            )}
                        </div>
                        <button 
                            onClick={onCancelReply}
                            className="p-1 hover:bg-purple-100 rounded-full transition-colors"
                            title="Cancel reply"
                        >
                            <X className="w-4 h-4 text-purple-600" />
                        </button>
                    </div>
                </div>
            )}

            {/* Main input area */}
            <div className="flex items-center gap-2">
                {/* Media button */}
                <button 
                    onClick={() => mediaInputRef.current?.click()}
                    className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    disabled={isUploading}
                >
                    <ImageIcon className="w-5 h-5" />
                </button>

                {/* Text input */}
                <div className="flex-1 relative">
                    <textarea
                        value={text}
                        onChange={handleTextChange}
                        onKeyPress={handleKeyPress}
                        placeholder={replyTo ? "Type a reply..." : "Type a message..."}
                        className="w-full resize-none border border-gray-300 rounded-full px-4 py-2 pr-12 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-70"
                        rows="1"
                        style={{ minHeight: '40px', maxHeight: '120px' }}
                        disabled={isUploading}
                    />
                    
                    {/* Emoji button */}
                    <button 
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                        disabled={isUploading}
                    >
                        <Smile className="w-4 h-4" />
                    </button>
                </div>

                {/* Send button with progress state */}
                <button 
                    onClick={handleSend}
                    className="flex-shrink-0 px-3 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 active:scale-95 transition-all disabled:opacity-60 min-w-[56px] flex items-center justify-center"
                    disabled={isUploading}
                >
                    {isUploading ? `${uploadProgress}%` : <SendHorizonal className="w-5 h-5" />}
                </button>
            </div>

            {/* Emoji picker */}
            {showEmojiPicker && (
                <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="grid grid-cols-6 gap-2">
                        {emojis.map((emoji, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setText(prev => prev + emoji);
                                    setShowEmojiPicker(false);
                                }}
                                className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Image preview */}
            {image && (
                <div className="mt-2 relative inline-block">
                    <img 
                        src={URL.createObjectURL(image)} 
                        alt="Preview" 
                        className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button 
                        onClick={() => setImage(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Video preview */}
            {video && (
                <div className="mt-2 relative inline-block">
                    <video 
                        src={URL.createObjectURL(video)} 
                        className="w-28 h-20 object-cover rounded-lg"
                        controls
                    />
                    <button 
                        onClick={() => setVideo(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Hidden media input */}
            <input 
                ref={mediaInputRef}
                type="file" 
                accept="image/*,video/*"
                onChange={handleMediaSelect}
                className="hidden"
            />
        </div>
    );
};

export default ChatInput;
