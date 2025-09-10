// App.jsx
import React, { useEffect, useRef } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast, { Toaster } from "react-hot-toast";
import { useSocket } from "./context/SocketContext.jsx";

import Login from "./pages/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import OtpVarify from "./components/OtpVarify";
import UpdatePassword from "./components/UpdatePassword";
import Layout from "./pages/Layout";
import Super from "./components/Super";
import Feed from "./pages/Feed";
import Messages from "./pages/Messages";
import ChatBox from "./pages/ChatBox";
import Connections from "./pages/Connections";
import Discover from "./pages/Discover";
import Profile from "./pages/Profile";
import CreatePost from "./pages/CreatePost";
import AIAssistant from "./pages/AIAssistant";

import { fetchUser } from "./features/user/userSlice";
import { fetchConnections } from "./features/connections/connectionsSlice";
import { addMessage } from "./features/messages/messagesSlice";
import Notification from "./components/Notification";

const App = () => {
  const dispatch = useDispatch();
  const {pathname} = useLocation();
  const pathNameRef = useRef(pathname);
  const currentUser = useSelector((state)=>state.user.value);
  const { on, off } = useSocket();

  useEffect(() => {
    // Only fetch user data if we don't have a user and we're not on auth pages
    // Since we're using cookie-based auth, we can safely try to fetch user data
    // But only if we're not already on a public page
    const isPublicPage = pathname.includes('/login') || 
                        pathname.includes('/register') || 
                        pathname.includes('/forgot-password') || 
                        pathname.includes('/otp-varify') || 
                        pathname.includes('/update-password');
    
    // Don't fetch user data on auth pages to prevent unnecessary API calls
    if (isPublicPage) {
      return;
    }
    
    if (!currentUser) {
      // Add a small delay to prevent rapid API calls
      const timer = setTimeout(() => {
        dispatch(fetchUser());
      }, 100);
      
      return () => clearTimeout(timer);
    }
    
    // Only fetch connections if we have a user
    if (currentUser) {
      dispatch(fetchConnections());
    }
  }, [dispatch, currentUser, pathname]);       
  
  useEffect(()=>{
    // Keep current path in ref for comparison inside socket handler
    pathNameRef.current = pathname;
  },[pathname]);

  useEffect(()=>{
    if(!currentUser?._id) return;

    // Listen for new messages
    const handleNewMessage = (message) => {
      // Socket.IO message received
      
      // Check if we're in the chat with this user
      if(pathNameRef.current === ('/messages/' + (message?.from_user_id?._id || message?.from_user_id))){
        dispatch(addMessage(message));
      } else {
        // Show notification for messages from other users
        toast.custom((t)=>(
          <Notification t={t} message={message} />
        ), { 
          position: 'bottom-right',
          duration: 5000
        });
      }
    };

    // Set up event listeners
    on('newMessage', handleNewMessage);

    // Cleanup event listeners
    return () => {
      off('newMessage', handleNewMessage);
    };
  },[currentUser?._id, dispatch, on, off]);

  
  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#ffffff',
            color: '#333333',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
      <Routes>
        {/* Public routes - No Super wrapper */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/otp-varify" element={<OtpVarify />} />
        <Route path="/update-password" element={<UpdatePassword />} />

        {/* Protected routes - With Super wrapper */}
        <Route element={<Super />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Feed />} />
            <Route path="feed" element={<Feed />} />
            <Route path="messages" element={<Messages />} />
            <Route path="messages/:userId" element={<ChatBox />} />
            <Route path="connections" element={<Connections />} />
            <Route path="discover" element={<Discover />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/:profileId" element={<Profile />} />
            <Route path="create-post" element={<CreatePost />} />
            <Route path="ai-assistant" element={<AIAssistant />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
};

export default App;
