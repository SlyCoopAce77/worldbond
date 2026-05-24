# WorldBond

A global social app built with React Native and Node.js. Connect with people from different countries through real-time chat, auto-translation, daily match-making, stories, photo feed, voice/video calls, and more.

## Features

- **Auth** — Register, login, JWT access/refresh tokens with auto-refresh
- **Daily Bond Matches** — Compatibility-scored daily matches based on connection type, language, location, and activity
- **Direct Messaging** — Real-time DMs with auto-translation, reply threads, reactions, image sharing, and gifts
- **Group Chats** — Category-based rooms (Gaming, Travel, Music, Food, etc.) with sub-rooms and auto-translation
- **Random World Connect** — Instant anonymous chat with someone from a different country, auto-translated
- **Stories** — 24-hour photo stories with filters, captions, and view tracking
- **Photo Feed** — Global photo feed with likes, comments, and filters
- **Explore / Places** — Check in to real-world places, chat with others there, leave reviews
- **Virtual Events** — Create and join live events with in-event chat
- **Icebreaker** — Daily question answered by users worldwide
- **Language Exchange** — Find partners who speak the language you want to learn
- **Experiences** — Post and apply to real-world experiences (travel, mentorship, etc.)
- **Follow System** — Follow users and receive notifications when someone follows you
- **Ghost Score** — Reliability score that tracks whether users respond to their matches
- **Voice & Video Calls** — WebRTC-based calling through the server
- **Premium Subscription** — Bond Plus tier with expanded access to features

## Tech Stack

| Layer | Tech |
|-------|------|
| Mobile | React Native 0.73 |
| Navigation | React Navigation (stack + bottom tabs) |
| Real-time | Socket.io |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | JWT (access + refresh tokens) |
| Translation | Google Cloud Translate API |
| Image Storage | Cloudinary (optional) |
| Deployment | Railway |

## Project Structure

```
worldbond/
├── app/                        # React Native app
│   └── src/
│       ├── screens/            # All screens
│       ├── components/         # Reusable UI components
│       ├── navigation/         # Stack + tab navigator
│       ├── services/           # Socket.io client, auth API
│       └── context/            # PremiumContext
└── server/                     # Node.js backend
    └── src/
        ├── auth/               # JWT auth routes + middleware
        ├── profiles/           # User profile management
        ├── matching/           # Daily match algorithm
        ├── experiences/        # Experiences feature
        ├── ghostScore/         # Reliability scoring
        ├── database/           # DB connection + migrations
        ├── socket.js           # All Socket.io event handlers
        └── index.js            # Express app entry point
```

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/SlyCoopAce77/worldbond.git
cd worldbond
```

### 2. Backend

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env` and fill in:

```env
DATABASE_URL=postgresql://user:password@host:5432/worldbond
JWT_SECRET=your_secret_here
GOOGLE_TRANSLATE_API_KEY=your_key_here   # optional
CLOUDINARY_URL=cloudinary://...          # optional
```

```bash
npm run dev
```

The server runs on port `3001` and auto-runs DB migrations on startup.

### 3. React Native App

```bash
cd app
npm install

# iOS
npx pod-install ios
npx react-native run-ios

# Android
npx react-native run-android
```

Update the server URL in `app/src/services/socket.js`:

```js
export const SERVER_URL = 'http://localhost:3001'; // local dev
// export const SERVER_URL = 'https://your-app.up.railway.app'; // production
```

### 4. Optional Services

**Google Translate** — Without it the app still works, messages just won't be translated between languages.

**Cloudinary** — Without it, images are stored locally in `server/uploads/`. Set `CLOUDINARY_URL` in `.env` to enable cloud storage.

**PostgreSQL** — Without `DATABASE_URL`, the Bond features (matches, profiles, experiences, auth) are disabled. The socket-only features (group chat, random connect, icebreaker, places) still work.

## Deployment (Railway)

1. Create a Railway project and add a PostgreSQL plugin
2. Deploy the `server/` folder — Railway auto-detects Node.js
3. Set environment variables in the Railway dashboard
4. Copy the Railway URL into `app/src/services/socket.js`
