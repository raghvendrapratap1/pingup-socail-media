import React, { use, useEffect, useState } from 'react'
import {Users,UserPlus,UserCheck,UserRoundPen,MessageSquare} from 'lucide-react'
import { useNavigate } from 'react-router-dom';

import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { fetchConnections } from '../features/connections/connectionsSlice';
import toast from 'react-hot-toast';
import api from '../api/axios';

const Connections = () => {
    const navigate=useNavigate();
    const dispatch = useDispatch()
    const [currentTab,setCurrentTab]=useState('Followers');
    const token = localStorage.getItem('token') || '';
    const {connections,pendingConnections,followers,following} = useSelector((state)=>state.connections);
    const dataArray=[
        {label: 'Followers' , value: followers, icon: Users, count: followers?.length || 0},
        {label: 'Following' , value: following, icon: UserCheck, count: following?.length || 0},
        {label: 'Pending' , value: pendingConnections, icon: UserRoundPen, count: pendingConnections?.length || 0},
        {label: 'Connections' , value: connections, icon: UserPlus, count: connections?.length || 0},
    ]

    const handleUnFollow = async(userId)=>{
        try{
            const {data} = await api.post('/api/user/unfollow',{id:userId},{
                headers: {Authorization: `Bearer ${token}`}
            })
            if(data.success){
                toast.success(data.message);
                dispatch(fetchConnections());
            }else{
                toast.error(data.message);
            }
        }catch(error){
            toast.error(error?.response?.data?.message || error.message);
        }
    }

    const acceptConnection = async(userId)=>{
        try{
            const {data} = await api.post('/api/user/accept',{id:userId},{
                headers: {Authorization: `Bearer ${token}`}
            })
            if(data.success){
                toast.success(data.message);
                dispatch(fetchConnections());
            }else{
                toast.error(data.message);
            }
        }catch(error){
            toast.error(error?.response?.data?.message || error.message);
        }
    }

    useEffect(()=>{
        dispatch(fetchConnections());
    },[dispatch])
  return (
    <div className='min-h-screen bg-slate-50'>
        <div className='max-w-6xl mx-auto p-6'>

            {/* title */}
            <div className='mb-8'>
                <h1 className='text-3xl font-bold   text-slate-900 mb-2'>Connections</h1>
                <p className='text-slate-600'>Manage your network and discover new connections</p>
            </div>
            {/* Counts */}
            <div className='mb-8 flex flex-wrap gap-6'>
                {
                    dataArray.map((item,index)=>(
                        <div key={index} className='flex flex-col items-center justify-center gap-1 border h-20 w-40 border-gray bg-white shadow rounded-md'>
                            <b className='text-2xl text-indigo-600'>{item.value?.length || 0}</b>
                            <p className='text-slate-600'>{item.label}</p>
                        </div>
                    ))
                }
            </div>

            {/* Tabs */}
            <div className='inline-flex flex-wrap items-center border border-gray-200 rounded-md bg-white shadow-sm'>
                {
                    dataArray.map((tab)=>(
                        <button onClick={()=>setCurrentTab(tab.label)} key={tab.label} className={`cursor-pointer flex items-center px-3 py-1 text-sm rounded-md transition-colors  ${currentTab===tab.label ? 'bg-white font-medium text-black' : 'text-gray-500 hover:text-black'}`}>
                            <tab.icon className='w-4 h-4'/>
                            <span className='ml-1'>{tab.label}</span>
                            {tab.count !== undefined && (
                                <span className='ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full'>{tab.count}</span>
                            )}
                        </button>
                    ))
                }
            </div>

            {/* Connections */}
{/* Connections */}
<div className='flex flex-wrap gap-6 mt-6'>
  {
    dataArray.find((item) =>
      item.label === currentTab
    )?.value?.map((user) => (
      <div key={user._id} className='w-full max-w-88 flex gap-5 p-6 bh-white shadow rounded-md'>

        {
          user?.profile_picture ? (
            <img
              src={user.profile_picture}
              alt="profile"
              className="rounded-full w-12 h-12 shadow-md mx-auto object-cover"
            />
          ) : (
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-600 text-white text-lg font-bold shadow-md mx-auto">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "?"}
            </div>
          )
        }

        <div className='flex-1'>
          <p className='font-medium text-slate-700'>{user.full_name}</p>
          <p className='text-slate-500'>@{user.username}</p>
          <p className='text-sm text-gray-600'>{user.bio.slice(0, 30)}...</p>

          <div className='flex max-sm:flex-col gap-2 mt-4'>
            {
              <button onClick={() => navigate(`/profile/${user._id}`)} className='w-full p-2 text-sm rounded bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition text-white cursor-pointer'>View Profile</button>
            }
            {
              currentTab === 'Following' && (
                <button onClick={() => handleUnFollow(user._id)} className='wI-full p-2 text-sm rounded bg-slate-100 hover:bg-slate-200 text-black active:scale-95 transition cursor-pointer'>Unfollow
                </button>
              )
            }
            {
              currentTab === 'Pending' && (
                <button onClick={() => acceptConnection(user._id)} className='w-full p-2 text-sm rounded bg-slate-100 hover:bg-slate-200 text-black active:scale-95 transition cursor-pointer'>Accept
                </button>
              )
            }
            {
              currentTab === 'Connections' && (
                <button onClick={() => navigate(`/messages/${user._id}`)} className='w-full p-2 text-sm rounded bg-slate-100 hover:bg-slate-200  text-slate-800  active:scale-95 transition cursor-pointer flex items-center justify-center gap-1'><MessageSquare className='w-4 h-4' />
                  Message
                </button>
              )
            }
          </div>
        </div>
      </div>
    ))
  }
</div>

        </div>
    </div>
  )
}

export default Connections;
