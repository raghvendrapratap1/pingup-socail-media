import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import api from '../../api/axios.js';

const initialState = {
    messages:[]  
}

export const fetchMessages = createAsyncThunk('messages/fetchMessages',async({userId})=>{
    const {data} = await api.post('/api/message/get',{to_user_id:userId});
    return data.success ? data : null;
})
const messagesSlice = createSlice({
    name:'messages',
    initialState,
    reducers:{
        setMessages:(state,action)=>{
            state.messages = action.payload;
        },
        addMessage:(state,action)=>{
            state.messages = [...state.messages,action.payload]
        },
        updateMessage:(state,action)=>{
            const updated = action.payload;
            state.messages = state.messages.map(m => (m._id === updated._id ? { ...m, ...updated } : m));
        },
        deleteMessage:(state,action)=>{
            const id = action.payload;
            state.messages = state.messages.filter(m => m._id !== id);
        },
        resetMessages:(state)=>{
            state.messages = [];
        },
    },
    extraReducers:(builder)=>{
        builder.addCase(fetchMessages.fulfilled, (state,action)=>{
            if(action.payload){
                state.messages = action.payload.messages
            } 
        })
    }
})

export const {setMessages,addMessage,updateMessage,deleteMessage,resetMessages} = messagesSlice.actions;

export default messagesSlice.reducer;
