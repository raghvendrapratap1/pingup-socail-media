import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { fetchConnections } from '../features/connections/connectionsSlice'
import { BadgeCheck, UserPlus, Check, X, Heart, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'

const UserCard = ({ user, onUserUpdate }) => {
    const [loading, setLoading] = useState(false)
    const [followLoading, setFollowLoading] = useState(false)
    const [isFollowing, setIsFollowing] = useState(user?.isFollowing || false)
    const [connectionStatus, setConnectionStatus] = useState(user?.connectionStatus || null)
    const dispatch = useDispatch()

    // Sync state with user prop changes
    useEffect(() => {
        setIsFollowing(user?.isFollowing || false)
        setConnectionStatus(user?.connectionStatus || null)
    }, [user?._id, user?.isFollowing, user?.connectionStatus])

    // Debug: Log state changes
    useEffect(() => {
        // Component state updated
    }, [isFollowing, connectionStatus, user?.full_name])
    // Rendering UserCard component

    // Check for connection status updates when status is pending
    useEffect(() => {
        if (connectionStatus === 'pending') {
            const checkConnectionStatus = async () => {
                try {
                    const { data } = await api.post('/api/user/discover', { input: '' })
                    if (data.success) {
                        const updatedUser = data.users.find(u => u._id === user._id)
                        if (updatedUser && updatedUser.connectionStatus === 'accepted') {
                            setConnectionStatus('accepted')
                            toast.success(`Connection accepted! You are now connected with ${user?.full_name}`)
                        }
                    }
                } catch (error) {
                    console.error('Error checking connection status:', error)
                }
            }

            // Check every 5 seconds if connection is pending
            const interval = setInterval(checkConnectionStatus, 5000)
            return () => clearInterval(interval)
        }
    }, [connectionStatus, user._id])

    const handleConnectionRequest = async () => {
        // Connect button clicked
        
        // Handle different states with appropriate toasts
        if (connectionStatus === 'accepted') {
            // Showing connected toast
            toast.success(`You are connected with ${user?.full_name}`)
            return
        }
        if (connectionStatus === 'pending') {
            // Showing pending toast
            toast(`⏳Connection request pending with ${user?.full_name}`, {
                style: {
                    background: '#ffffff',
                    color: '#333333',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                },
            })
            return
        }

        // Initial state - send connection request
        try {
            setLoading(true)
            // Sending connection request
            const { data } = await api.post('/api/user/connect', { id: user._id })
            // Connection request response received
            if (data.success) {
                setConnectionStatus('pending')
                // Connection request sent successfully
                toast.success(`Connection request sent to ${user?.full_name}`)
                // Don't call onUserUpdate to preserve local state
                // Refresh connections in Redux store
                dispatch(fetchConnections())
            } else {
                // Connection request failed
                toast.error(data.message)
            }
        } catch (error) {
            console.error('Error sending connection request:', error)
            console.error('Error response:', error.response?.data)
            const errorMessage = error.response?.data?.message || 'Failed to send connection request'
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }


    const handleFollow = async () => {
        try {
            setFollowLoading(true)
            const { data } = await api.post('/api/user/follow', { id: user._id })
            if (data.success) {
                setIsFollowing(true)
                // Follow successful
                toast.success('User followed successfully!')
                // Don't call onUserUpdate to preserve local state
            } else {
                toast.error(data.message || 'Failed to follow user')
            }
        } catch (error) {
            console.error('Error following user:', error)
            toast.error('Failed to follow user')
        } finally {
            setFollowLoading(false)
        }
    }

    const handleUnfollow = async () => {
        try {
            setFollowLoading(true)
            const { data } = await api.post('/api/user/unfollow', { id: user._id })
            if (data.success) {
                setIsFollowing(false)
                // Unfollow successful
                toast.success('User unfollowed successfully!')
                // Don't call onUserUpdate to preserve local state
            } else {
                toast.error(data.message || 'Failed to unfollow user')
            }
        } catch (error) {
            console.error('Error unfollowing user:', error)
            toast.error('Failed to unfollow user')
        } finally {
            setFollowLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                    <Link to={`/profile/${user?._id}`} className="block">
                        {user?.profile_picture ? (
                            <img
                                src={user.profile_picture}
                                alt="profile"
                                className="w-12 h-12 rounded-full object-cover cursor-pointer"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold cursor-pointer">
                                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                            </div>
                        )}
                    </Link>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1">
                        <Link to={`/profile/${user?._id}`} className="truncate">
                            <p className="text-sm font-medium text-gray-900 truncate hover:underline cursor-pointer">
                                {user?.full_name || 'User'}
                            </p>
                        </Link>
                        <BadgeCheck className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                        @{user?.username || 'username'}
                    </p>
                    {user?.bio && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {user.bio}
                        </p>
                    )}
                </div>
            </div>
            
            <div className="mt-4 flex space-x-2">
                {/* Follow Button - Always visible */}
                <button
                    onClick={isFollowing ? handleUnfollow : handleFollow}
                    disabled={followLoading}
                    className="flex-1 bg-pink-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-pink-600 disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                    <Heart className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
                    <span>{isFollowing ? 'Followed' : 'Follow'}</span>
                </button>
                
                {/* Connect Button - Always visible */}
                <button
                    onClick={handleConnectionRequest}
                    disabled={loading}
                    className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                    {connectionStatus === 'pending' ? (
                        <>
                            <Clock className="w-4 h-4" />
                            <span>Pending</span>
                        </>
                    ) : connectionStatus === 'accepted' ? (
                        <>
                            <Check className="w-4 h-4" />
                            <span>Connected</span>
                        </>
                    ) : (
                        <>
                            <UserPlus className="w-4 h-4" />
                            <span>Connect</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}

export default UserCard
