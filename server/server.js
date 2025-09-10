import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import googleAuth from './middleware/googleAuth.js';
import userRoutes from "./routes/userRoutes.js";
import errorHandler from './middleware/errorHandler.js';
import postRouter from './routes/postRoutes.js';
import storyRouter from './routes/storyRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import geminiRouter from './routes/geminiRoutes.js';
import storyQueue from './queues/storyQueue.js';

const app = express();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO setup
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
  }
});

// console.log("fdhfxd  hfc "+process.env.FRONTEND_URL);
// Socket.IO connection handling
io.use((socket, next) => {
  const userId = socket.handshake.auth.userId;
  if (userId) {
    socket.userId = userId;
    next();
  } else {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  // Join user's personal room
  socket.on('join', ({ userId }) => {
    socket.join(`user_${userId}`);
  });
  
  // Handle typing events
  socket.on('typing', ({ to_user_id }) => {
    // Emit to the recipient that user is typing
    socket.to(`user_${to_user_id}`).emit('userTyping', {
      from_user_id: socket.userId
    });
  });
  
  socket.on('stopTyping', ({ to_user_id }) => {
    // Emit to the recipient that user stopped typing
    socket.to(`user_${to_user_id}`).emit('userStopTyping', {
      from_user_id: socket.userId
    });
  }); 

  // Handle disconnection
  socket.on('disconnect', () => {
    // User disconnected
  });
});

// Make io available to routes
app.set('io', io);

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}))

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(session({
    secret:"secret",
    resave:false,
    saveUninitialized:true
}))
app.use(cookieParser());

// Serve static files from client build directory
app.use(express.static(path.join(process.cwd(), 'client', 'dist')));

// Handle favicon.ico requests specifically
app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content response for favicon
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/auth/google/callback'
},(accessToken,refreshToken,profile,done)=>{
    return done(null,profile);
}))

passport.serializeUser((user,done)=>{
    done(null,user)
})

passport.deserializeUser((user,done)=>{
    done(null,user)
})

app.get('/auth/google',passport.authenticate('google',{
    scope:["email","profile"],
    prompt:"select_account"
}))

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: process.env.FRONTEND_URL + '/login' || 'http://localhost:5173/login' }),
  googleAuth,
  (req, res) => {
    // login success → redirect to Feed page
    res.redirect(process.env.FRONTEND_URL + '/feed' || 'http://localhost:5173/feed'); // feed route explicitly define karo
  }
);


app.use('/api/user',userRoutes)
app.use('/api/post',postRouter)
app.use('/api/story',storyRouter)
app.use('/api/message',messageRouter)
await connectDB();


// gemini  api call 
app.use('/api/gemini',geminiRouter);

// Initialize Bull queue
try {
    storyQueue.on('completed', (job) => {
        // Job completed successfully
    });

    storyQueue.on('failed', (job, err) => {
        // Job failed
    });

    storyQueue.on('error', (error) => {
        // Bull queue error
    });
} catch (error) {
    // Bull queue setup failed
}

// Error handler should be registered after all routes
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    await storyQueue.close();
    server.close(() => {
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    await storyQueue.close();
    server.close(() => {
        process.exit(0);
    });
});
