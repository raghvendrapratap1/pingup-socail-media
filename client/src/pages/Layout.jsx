import { Menu, X } from 'lucide-react';
import React, { useState } from 'react'
import { Outlet } from 'react-router-dom';
import { dummyUserData } from '../assets/assets';
import Loading from '../components/Loading';
import Sidebar from '../components/Sidebar';
import { useSelector } from 'react-redux'

const Layout = () => {
   
    const user=useSelector((state)=>state.user.value);
    const [sidebarOpen,setSidebarOpen]=useState(false);

  return user ? (
    <div className='w-full flex h-screen overflow-hidden'>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          
        <div className='flex-1 bg-slate-50 overflow-y-auto scrollbar-hide'>
            <Outlet/>
        </div>
        {
            sidebarOpen ? 
            <X className='absolute top-3 p-2 z-100 bg-white rounded-md shadow w-10 h-10 text-gray-600 sm:hidden' onClick={()=>setSidebarOpen(false)}/>
            :
            <Menu className='absolute top-3 p-2 z-100 bg-white rounded-md shadow w-10 h-10 text-gray-600 sm:hidden' onClick={()=>setSidebarOpen(true)}/>
        }

        {/* Mobile overlay to close sidebar when tapping outside */}
        {sidebarOpen && (
            <div
                className='fixed inset-0 bg-black/30 sm:hidden z-10'
                onClick={()=>setSidebarOpen(false)}
            />
        )}
       
    </div>
  ) : (
    <Loading/>
  )
}

export default Layout;
