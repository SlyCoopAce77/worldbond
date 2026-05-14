# 🌍 WorldBond

Connect with people around the world. Real-time chat with auto-translation + group chats by interest + voice calls.

## Features
- Direct messaging with auto-translation (your message → their language)
- Group chats by category: Gaming, Sports, Bars & Nightlife, Music, Food, Travel, Language Learning, Movies & TV
- Sub-rooms within each category (e.g. Gaming → #fps-shooters, #kpop, etc.)
- Voice & video call support
- Shows each user's country and language

## Setup

### 1. Backend Server

```bash
cd worldbond/server
npm install
cp .env.example .env
# Add your Google Translate API key to .env
npm run dev
```

### 2. React Native App

```bash
cd worldbond/app
npm install
# For iOS
npx pod-install ios
npx react-native run-ios
# For Android
npx react-native run-android
```

### 3. Google Translate API Key (optional — app works without it, just no translation)
1. Go to console.cloud.google.com
2. Enable the Cloud Translation API
3. Create an API key
4. Paste it into server/.env as GOOGLE_TRANSLATE_API_KEY

## How it works
- User picks their name, language, and country on login
- Server knows each user's language
- When you send a message, the server translates it into the recipient's language before delivering
- Group chats work the same way — everyone gets messages in their own language
- Voice/video calls use WebRTC signaling through the server
