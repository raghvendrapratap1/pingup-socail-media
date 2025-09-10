# 🚀 Deployment Guide

## **Prerequisites**
- MongoDB Atlas account
- ImageKit account
- Google OAuth credentials
- Gemini AI API key
- Email service (Gmail recommended)
- Redis service (for Bull queue)

## **Step 1: Environment Setup**

### **Backend (.env)**
```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# JWT Secret (generate a strong random string)
JWT_SECRET=your_very_long_random_secret_key_here

# ImageKit Configuration
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_endpoint

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-domain.com/auth/google/callback

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key


# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

# Redis (for Bull queue)
REDIS_URL=redis://username:password@host:port

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend-domain.com
```

### **Frontend (.env)**
```bash
VITE_BASEURL=https://your-backend-domain.com
VITE_SOCKET_URL=https://your-backend-domain.com
```

## **Step 2: Database Setup**
1. Create MongoDB Atlas cluster
2. Get connection string
3. Update MONGODB_URI in backend .env

## **Step 3: ImageKit Setup**
1. Create ImageKit account
2. Get public key, private key, and URL endpoint
3. Update ImageKit credentials in backend .env

## **Step 4: Google OAuth Setup**
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs
4. Update Google credentials in backend .env

## **Step 5: AI Services Setup**
1. Get Gemini AI API key from Google AI Studio
2. Update API key in backend .env

## **Step 6: Email Setup**
1. Enable 2-factor authentication on Gmail
2. Generate app password
3. Update email credentials in backend .env

## **Step 7: Redis Setup**
1. Create Redis instance (Redis Cloud, Upstash, etc.)
2. Get connection URL
3. Update REDIS_URL in backend .env

## **Step 8: Build & Deploy**

### **Local Build Test**
```bash
# Install all dependencies
npm run install:all

# Build frontend
npm run build

# Test production build
npm run deploy:build
```

### **Deploy to Platform**

#### **Option A: Vercel (Recommended)**
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

#### **Option B: Railway**
1. Push code to GitHub
2. Connect repository to Railway
3. Set environment variables
4. Deploy

#### **Option C: Render**
1. Push code to GitHub
2. Connect repository to Render
3. Set environment variables
4. Deploy

## **Step 9: Domain & SSL**
1. Point domain to your deployment
2. Enable SSL/HTTPS
3. Update FRONTEND_URL and GOOGLE_CALLBACK_URL

## **Step 10: Testing**
1. Test user registration/login
2. Test file uploads
3. Test real-time features
4. Test AI features
5. Test email functionality

## **Common Issues & Solutions**

### **CORS Error**
- Ensure FRONTEND_URL is correct in backend .env
- Check CORS configuration in server.js

### **Database Connection Error**
- Verify MONGODB_URI format
- Check network access in MongoDB Atlas

### **File Upload Error**
- Verify ImageKit credentials
- Check file size limits

### **Socket.IO Connection Error**
- Ensure VITE_BASEURL is correct in frontend .env
- Check Socket.IO CORS configuration

## **Monitoring & Maintenance**
- Monitor application logs
- Set up error tracking (Sentry, LogRocket)
- Monitor database performance
- Set up uptime monitoring

## **Security Checklist**
- [ ] Strong JWT secret
- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] File upload restrictions
- [ ] HTTPS enabled
- [ ] Regular dependency updates
