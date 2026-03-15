# HerSecure – Women's Safety Platform

Elite AI-powered personal security platform. Real-time protection, emergency SOS, safe routing, and intelligent threat detection.

## 🚀 Key Features

- **Neural SOS Engine**: Multi-trigger emergency system (Manual, Voice, Shake).
- **AI Threat Scanner**: Real-time client-side object detection using TensorFlow.js.
- **Tactical Safe Route**: AI-optimized walking routes based on safety scores.
- **Guardian Network**: Automated SMS alerts and live location sharing via Twilio.
- **Secure Link**: Cryptographic, time-limited location sharing.
- **GuardianAI**: 24/7 AI-powered safety assistance.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4, Framer Motion.
- **Backend**: Next.js API Routes, NextAuth.js, Mongoose.
- **Database**: MongoDB Atlas.
- **AI/ML**: TensorFlow.js (COCO-SSD), Pollinations.ai.
- **Communication**: Twilio SMS API.
- **Mapping**: Leaflet, OpenStreetMap, OSRM.

## 📦 Deployment Guide

### 1. Environment Variables
Copy `.env.example` to `.env.local` and fill in the required credentials:
- `MONGODB_URI`: Your MongoDB connection string.
- `NEXTAUTH_SECRET`: A secure random string for session encryption.
- `NEXTAUTH_URL`: Your deployment URL (e.g., `https://hersecure.vercel.app`).
- `NEXT_PUBLIC_APP_URL`: Same as `NEXTAUTH_URL`.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`: Twilio credentials for SMS alerts.

### 2. Build and Start
```bash
# Install dependencies
npm install

# Run production build
npm run build

# Start production server
npm start
```

### 3. PWA Setup
HerSecure is a Progressive Web App. To ensure it's installable:
- Verify icons are present in `/public`.
- Ensure `manifest.json` and `sw.js` are correctly configured in `/public`.
- Serve over HTTPS (required for PWA status).

## 📄 Documentation
Comprehensive project report and technical specifications are available in [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md).
