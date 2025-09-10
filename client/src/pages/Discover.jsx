import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import UserCard from '../components/UserCard'
import api from '../api/axios'


const Discover = () => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [input, setInput] = useState("")
    const currentUser = useSelector((state) => state.user.value)

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const { data } = await api.post('/api/user/discover', { input })
            if (data.success) {
                const sorted = Array.isArray(data.users)
                    ? [...data.users].sort((a, b) => {
                        const aFollowers = Array.isArray(a?.followers) ? a.followers.length : 0
                        const bFollowers = Array.isArray(b?.followers) ? b.followers.length : 0
                        return bFollowers - aFollowers
                    })
                    : []
                setUsers(sorted)
            } else {
                console.error('Failed to fetch users:', data.message)
            }
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = async (e) => {
        if (e.key === 'Enter') {
            await fetchUsers()
        }
    }

    useEffect(() => {
        if (currentUser) {
            fetchUsers()
        }
    }, [currentUser])

    if (!currentUser) {
        return <div className="flex items-center justify-center h-full">Please log in to discover users.</div>
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Discover People</h1>
            
            {/* Search Input */}
            <div className="mb-6">
                <input 
                    type="text" 
                    placeholder="Search people by name, username, bio or location..." 
                    className="w-full p-3 border border-gray-300 rounded-md"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyUp={handleSearch}
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((user) => (
                        <UserCard key={user._id} user={user} onUserUpdate={fetchUsers} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default Discover;
