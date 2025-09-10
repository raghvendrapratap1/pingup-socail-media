import { BadgeCheck, Heart, MessageCircle, Share2, ChevronLeft, ChevronRight, MoreHorizontal, Trash2, Play, Pause } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import moment from 'moment';
import { dummyUserData } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import toast from 'react-hot-toast';

const PostCard = ({post, fetchFeeds, onDeleted, playingVideos, toggleVideo}) => {

    const navigate=useNavigate();

    const contentText = (post?.content || '');
    const postWithHashtags = contentText.replace(/(#\w+)/g,'<span class="text-indigo-600">$1</span>')
    const [likes,setLikes] = useState(Array.isArray(post?.likes_count) ? post.likes_count : []);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [showComments,setShowComments] = useState(false);
    const [comments,setComments] = useState(Array.isArray(post?.comments) ? post.comments : []);
    const [commentText,setCommentText] = useState('');
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingText, setEditingText] = useState('');
    const currentUser=useSelector((state)=>state.user.value);

    const handleLike= async()=>{
        try{
            const {data} = await api.post(`api/post/like`,{postId: post._id})

            if(data.success){
                toast.success(data.message);
                setLikes(prev =>{
                    const previous = Array.isArray(prev) ? prev : [];
                    const currentUserId = currentUser?._id;
                    if(currentUserId && previous.includes(currentUserId)){
                        return previous.filter(id=>id !== currentUserId)
                    }
                    else{
                        return currentUserId ? [...previous, currentUserId] : previous;
                    }
                })
            }
            else{
                toast(data.message)
            }
        }catch(error){
            toast.error(error.message)
        }
    }

    // Check if user can delete comment (comment owner or post owner)
    const canDeleteComment = (comment) => currentUser?._id === comment.user?._id;

    // Check if user can edit comment (only comment owner)
    const canEditComment = (comment) => currentUser?._id === comment.user?._id;

    const startEditComment = (comment) => {
        setEditingCommentId(comment._id);
        setEditingText(comment.text);
    }

    const cancelEditComment = () => {
        setEditingCommentId(null);
        setEditingText('');
    }

    const saveEditComment = async () => {
        const newText = editingText.trim();
        if(!newText) return toast.error('Comment cannot be empty');
        try{
            const { data } = await api.put(`/api/post/comment/update/${post._id}/${editingCommentId}`, { text: newText });
            if(data.success){
                toast.success('Comment updated');
                setComments(Array.isArray(data.comments) ? data.comments : []);
                cancelEditComment();
            }else{
                toast.error(data.message || 'Failed to update comment');
            }
        }catch(error){
            toast.error(error?.response?.data?.message || 'Failed to update comment');
        }
    }

    // Handle post deletion
    const deletePost = async () => {
        try {
            const result = await Swal.fire({
                title: 'Delete Post?',
                text: "This action cannot be undone!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!'
            });

            if (result.isConfirmed) {
                const { data } = await api.delete(`/api/post/delete/${post._id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
                });

                if (data.success) {
                    toast.success('Post deleted successfully!');
                    if (onDeleted) {
                        onDeleted(post._id);
                    }
                } else {
                    toast.error(data.message || 'Failed to delete post');
                }
            }
        } catch (error) {
            console.error('Delete post error:', error);
            toast.error('Failed to delete post');
        }
    }

    // Handle comment deletion
    const deleteComment = async (commentId) => {
        try {
            const result = await Swal.fire({
                title: 'Delete Comment?',
                text: "This action cannot be undone!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!'
            });

            if (result.isConfirmed) {
                const { data } = await api.delete(`/api/post/comment/delete/${post._id}/${commentId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
                });

                if (data.success) {
                    toast.success('Comment deleted successfully!');
                    // Update local comments state
                    setComments(prevComments => prevComments.filter(comment => comment._id !== commentId));
                } else {
                    toast.error(data.message || 'Failed to delete comment');
                }
            }
        } catch (error) {
            console.error('Delete comment error:', error);
            toast.error('Failed to delete comment');
        }
    }

    const nextImage = () => {
        if (Array.isArray(post?.image_urls) && post.image_urls.length > 1) {
            setCurrentImageIndex((prev) => 
                prev === post.image_urls.length - 1 ? 0 : prev + 1
            );
        }
    };

    const prevImage = () => {
        if (Array.isArray(post?.image_urls) && post.image_urls.length > 1) {
            setCurrentImageIndex((prev) => 
                prev === 0 ? post.image_urls.length - 1 : prev - 1
            );
        }
    };

    const nextVideo = () => {
        if (Array.isArray(post?.video_urls) && post.video_urls.length > 1) {
            setCurrentVideoIndex((prev) => 
                prev === post.video_urls.length - 1 ? 0 : prev + 1
            );
        }
    };

    const prevVideo = () => {
        if (Array.isArray(post?.video_urls) && post.video_urls.length > 1) {
            setCurrentVideoIndex((prev) => 
                prev === 0 ? post.video_urls.length - 1 : prev - 1
            );
        }
    };

    const goToImage = (index) => {
        setCurrentImageIndex(index);
    };

    const goToVideo = (index) => {
        setCurrentVideoIndex(index);
    };




    // Function to clean ImageKit URLs for videos
    const getCleanVideoUrl = (url) => {
        if (!url || !url.includes('ik.imagekit.io')) return url;
        
        try {
            // Remove only the problematic transformation parameters (tr:q-auto:f-mp4)
            // but keep the base ImageKit URL structure intact
            if (url.includes('tr:q-auto:f-mp4')) {
                // Remove the transformation part and keep the original URL
                const baseUrl = url.split('tr:q-auto:f-mp4/')[0];
                const filePath = url.split('tr:q-auto:f-mp4/')[1];
                return `${baseUrl}${filePath}`;
            }
            
            // If no problematic transformations, return as is
            return url;
        } catch (error) {
            console.log('Error cleaning video URL:', error);
            return url;
        }
    };

    // Function to get a fallback video URL if the main one fails
    const getFallbackVideoUrl = (url) => {
        if (!url || !url.includes('ik.imagekit.io')) return url;
        
        try {
            // Extract the file path from the URL
            const urlParts = url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            
            // Construct a direct ImageKit URL without transformations
            // This assumes the base ImageKit URL structure
            const baseUrl = 'https://ik.imagekit.io/myidforimage';
            return `${baseUrl}/posts/videos/${fileName}`;
        } catch (error) {
            console.log('Error creating fallback URL:', error);
            return url;
        }
    };

    // Reset image and video index when post changes
    React.useEffect(() => {
        setCurrentImageIndex(0);
        setCurrentVideoIndex(0);
    }, [post._id]);

    // keep comments in sync if post prop updates with server data
    useEffect(()=>{
        setComments(Array.isArray(post?.comments) ? post.comments : []);
    },[post?.comments])

    // fetch comments when toggled open
    useEffect(()=>{
        const fetchComments = async()=>{
            try{
                const {data} = await api.get(`/api/post/comments`, { params: { postId: post._id } });
                if(data.success){
                    setComments(Array.isArray(data.comments) ? data.comments : []);
                }
            }catch(e){/* ignore */}
        }
        if(showComments){ fetchComments(); }
    },[showComments, post._id])

    const submitComment = async()=>{
        const text = commentText.trim();
        if(!text) return;
        try{
            const {data} = await api.post(`/api/post/comments`, { postId: post._id, text });
            if(data.success){
                setComments(Array.isArray(data.comments) ? data.comments : []);
                setCommentText('');
            }else{
                toast.error(data.message);
            }
        }catch(error){
            toast.error(error.message);
        }
    }



    const isOwner = currentUser?._id === post?.user?._id;
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

  return (
    <div className='bg-white rounded-xl shadow p-4 space-y-4 w-full max-w-2xl relative'>
        {/* user info */}
        <div onClick={()=>post?.user?._id && navigate('/profile/' + post.user._id)} className='inline-flex items-center gap-3 cursor-pointer'>
            {post?.user?.profile_picture ? (
                <img src={post.user.profile_picture} alt="" className='w-10 h-10 rounded-full shadow'/>
            ) : null}
            <div>
                <div className='flex items-center space-x-1'>
                    <span>{post?.user?.full_name || 'User'}</span>
                    <BadgeCheck className='w-4 h-4 text-blue-500'/>
                </div>
                <div className='text-gray-500 text-sm'>@{post?.user?.username || 'username'} * {moment (post?.createdAt).fromNow()} </div>
            </div>
        </div>

        {/*Content */}
        {
            post.content && <div className='text-gray-800 text-sm whitespace-pre-line' dangerouslySetInnerHTML={{__html: postWithHashtags}}/>
        }
        
        {/* Images with horizontal scrolling */}
        {Array.isArray(post?.image_urls) && post.image_urls.length > 0 && post.image_urls[currentImageIndex] ? (
            <div className='relative'>
                <div className='relative overflow-hidden rounded-lg'>
                    {/* Single image display */}
                    <img 
                        src={post.image_urls[currentImageIndex]} 
                         className='w-full h-80 object-cover rounded-lg'
                        alt="Post image"
                        onError={(e) => {
                              e.target.style.display = 'none';
                              const errorDiv = document.createElement('div');
                              errorDiv.className = 'w-full h-80 bg-gray-200 flex items-center justify-center text-gray-500 rounded-lg';
                              errorDiv.innerHTML = 'Image not available';
                              e.target.parentNode.appendChild(errorDiv);
                        }}
                    />
                    
                    {/* Navigation arrows - only show if multiple images */}
                    {post.image_urls.length > 1 && (
                        <>
                            {/* Left arrow */}
                            <button 
                                onClick={prevImage}
                                className='absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200'
                            >
                                <ChevronLeft className='w-5 h-5' />
                            </button>
                            
                            {/* Right arrow */}
                            <button 
                                onClick={nextImage}
                                className='absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200'
                            >
                                <ChevronRight className='w-5 h-5' />
                            </button>
                        </>
                    )}
                </div>
                
                {/* Image indicators/dots */}
                {post.image_urls.length > 1 && (
                    <div className='flex justify-center mt-3 space-x-2'>
                        {post.image_urls.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToImage(index)}
                                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                    index === currentImageIndex 
                                        ? 'bg-blue-500 w-6' 
                                        : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                            />
                        ))}
                    </div>
                )}
                
                {/* Image counter */}
                {post.image_urls.length > 1 && (
                    <div className='absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full'>
                        {currentImageIndex + 1} / {post.image_urls.length}
                    </div>
                )}
            </div>
        ) : null}

        {/* Videos with horizontal scrolling */}
        {Array.isArray(post?.video_urls) && post.video_urls.length > 0 && post.video_urls[currentVideoIndex] && post.video_urls[currentVideoIndex].trim() !== '' && post.video_urls[currentVideoIndex].startsWith('http') ? (
            <div className='relative'>
                <div className='relative overflow-hidden rounded-lg'>
                    {/* Single video display */}
                                         <div className='relative group'>
                        <video 
                               src={getCleanVideoUrl(post.video_urls[currentVideoIndex])} 
                               className='w-full h-80 object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform duration-150'
                               controls={false}
                               autoPlay={false}
                               muted={false}
                               loop
                               preload="metadata"
                              onClick={(e) => {
                                  const videoElement = e.target;
                                  const currentState = playingVideos[post.video_urls[currentVideoIndex]];
                                  
                                  // If currently playing, pause it
                                  if (currentState) {
                                      videoElement.pause();
                                      toggleVideo(post.video_urls[currentVideoIndex]);
                                  } else {
                                      // If currently paused, play it
                                      videoElement.play();
                                      toggleVideo(post.video_urls[currentVideoIndex]);
                                  }
                              }}
                            onError={(e) => {
                                  console.log('Video error for URL:', post.video_urls[currentVideoIndex]);
                                  console.log('Cleaned URL:', getCleanVideoUrl(post.video_urls[currentVideoIndex]));
                                  
                                  // Try fallback URL first
                                  const fallbackUrl = getFallbackVideoUrl(post.video_urls[currentVideoIndex]);
                                  if (fallbackUrl !== post.video_urls[currentVideoIndex]) {
                                      console.log('Trying fallback URL:', fallbackUrl);
                                      e.target.src = fallbackUrl;
                                      return; // Don't show error yet, let it try the fallback
                                  }
                                  
                                  // If fallback also fails, show error message
                                e.target.style.display = 'none';
                                const errorDiv = document.createElement('div');
                                  errorDiv.className = 'w-full h-80 bg-gray-200 flex items-center justify-center text-gray-500';
                                errorDiv.innerHTML = 'Video not available';
                                e.target.parentNode.appendChild(errorDiv);
                            }}
                              onLoadStart={() => {
                                  console.log('Loading video from:', getCleanVideoUrl(post.video_urls[currentVideoIndex]));
                              }}
                          />
                          
                          {/* Play/Pause overlay icon - only visible on hover */}
                          <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
                            {playingVideos[post.video_urls[currentVideoIndex]] ? (
                                  <Pause className='w-12 h-12 text-white drop-shadow-lg' />
                            ) : (
                                  <Play className='w-12 h-12 text-white drop-shadow-lg' />
                            )}
                          </div>
                    </div>
                    
                    {/* Navigation arrows - only show if multiple videos */}
                    {post.video_urls.length > 1 && (
                        <>
                            {/* Left arrow */}
                            <button 
                                onClick={prevVideo}
                                className='absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200'
                            >
                                <ChevronLeft className='w-5 h-5' />
                            </button>
                            
                            {/* Right arrow */}
                            <button 
                                onClick={nextVideo}
                                className='absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200'
                            >
                                <ChevronRight className='w-5 h-5' />
                            </button>
                        </>
                    )}
                </div>
                
                {/* Video indicators/dots */}
                {post.video_urls.length > 1 && (
                    <div className='flex justify-center mt-3 space-x-2'>
                        {post.video_urls.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToVideo(index)}
                                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                    index === currentVideoIndex 
                                        ? 'bg-blue-500 w-6' 
                                        : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                            />
                        ))}
                    </div>
                )}
                
                {/* Video counter */}
                {post.video_urls.length > 1 && (
                    <div className='absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full'>
                        {currentVideoIndex + 1} / {post.video_urls.length}
                    </div>
                )}

                {/* Video indicator badge */}
                <div className='absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1'>
                    <Play className='w-3 h-3' />
                    Video
                </div>
            </div>
        ) : null}
        
        {/* Actions */}
        <div className='flex items-center gap-4 text-gray-600 text-sm pt-2 border-t border-gray-300'> 
            <div className='flex items-center gap-1'>
                <Heart className={`w-4 h-4 cursor-pointer ${Array.isArray(likes) && currentUser?._id && likes.includes(currentUser._id) &&   'text-red-500 fill-red-500'}`} onClick={handleLike}/>
                <span>{Array.isArray(likes) ? likes.length : 0}</span>
            </div>
            
            <button className='flex items-center gap-1' onClick={()=>setShowComments(v=>!v)}>
                <MessageCircle className='w-4 h-4'/>
                <span>{Array.isArray(comments) ? comments.length : 0}</span>
            </button>
            

            {isOwner && (
                <div ref={menuRef} className='ml-auto relative'>
                    <button className='p-1 rounded hover:bg-gray-100' onClick={()=>setShowMenu(v=>!v)}>
                        <MoreHorizontal className='w-5 h-5'/>
                    </button>
                    
                    {showMenu && (
                        <div className='absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-32'>
                            <button 
                                onClick={deletePost}
                                className='w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2'
                            >
                                <Trash2 className='w-4 h-4' />
                                Delete Post
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Comments Section */}
        {showComments && (
            <div className='space-y-3 pt-2 border-t border-gray-200'>
                {/* Comment input */}
                <div className='flex gap-2'>
                    <input 
                        type="text" 
                        placeholder="Write a comment..." 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && submitComment()}
                        className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                    />
                    <button 
                        onClick={submitComment}
                        className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
                    >
                        Post
                    </button>
                </div>

                {/* Comments list */}
                <div className='space-y-2 max-h-40 overflow-y-auto scrollbar-hide'>
                    {comments.map((comment, index) => (
                        <div key={index} className='flex items-start gap-2 p-2 bg-gray-50 rounded-lg'>
                            {comment.user?.profile_picture ? (
                            <img 
                                    src={comment.user.profile_picture} 
                                alt="" 
                                className='w-6 h-6 rounded-full'
                            />
                            ) : (
                                <div className='w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold'>
                                    {comment.user?.full_name ? comment.user.full_name.charAt(0) : 'U'}
                                </div>
                            )}
                            <div className='flex-1'>
                                <div className='flex items-center justify-between'>
                                    <div className='text-sm font-medium'>{comment.user?.full_name || 'User'}</div>
                                    <div className='flex items-center gap-2'>
                                        {canEditComment(comment) && (
                                            editingCommentId === comment._id ? (
                                                <>
                                                    <button onClick={saveEditComment} className='text-green-600 text-xs hover:underline'>Save</button>
                                                    <button onClick={cancelEditComment} className='text-gray-500 text-xs hover:underline'>Cancel</button>
                                                </>
                                            ) : (
                                                <button onClick={() => startEditComment(comment)} className='text-blue-600 text-xs hover:underline'>Edit</button>
                                            )
                                        )}
                                        {canDeleteComment(comment) && (
                                            <button 
                                                onClick={() => deleteComment(comment._id)}
                                                className='text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors'
                                                title='Delete comment'
                                            >
                                                <Trash2 className='w-3 h-3' />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {editingCommentId === comment._id ? (
                                    <input
                                        type='text'
                                        className='w-full text-sm border rounded px-2 py-1 mt-1'
                                        value={editingText}
                                        onChange={(e)=>setEditingText(e.target.value)}
                                        onKeyDown={(e)=>{ if(e.key==='Enter') saveEditComment(); if(e.key==='Escape') cancelEditComment(); }}
                                        autoFocus
                                    />
                                ) : (
                                    <div className='text-sm text-gray-700'>{comment.text}</div>
                                )}
                                <div className='text-xs text-gray-500'>{moment(comment.createdAt).fromNow()}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  )
}

export default PostCard
