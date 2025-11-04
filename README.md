# PeerTutor - Social Learning Platform

A React Native mobile app built with Expo that helps students connect, share knowledge, and grow together through peer-to-peer tutoring and collaborative learning.

## Features

### Core Features
- **User Profiles**: Create profiles with skills (teaching) and needs (learning)
- **Smart Matching**: Algorithm-based peer matching for compatible connections
- **Peer Requests**: Send and accept connection requests with mutual approval
- **Real-time Chat**: 1-on-1 messaging with file and media sharing
- **Discover**: Browse and search for peers by topic

### Advanced Features
- **Streaks System**: Track daily learning/teaching activity
- **Communities**: Discord-style channels for subject-based discussions
- **Events**: Create and join study events, workshops, and group sessions
- **File Library**: Upload and share study materials (PDFs, documents, notes)
- **Link Sharing**: Share resources with URL previews
- **Notifications**: Push, in-app, and customizable notification preferences
- **Moderation**: User reporting, blocking, and content filtering
- **Admin Dashboard**: Moderation and user management tools

## Tech Stack

- **Frontend**: React Native + Expo
- **Language**: JavaScript (ES6+)
- **State Management**: Zustand
- **Backend**: Firebase (Firestore, Auth, Storage, Cloud Functions)
- **Navigation**: Expo Router
- **UI Components**: React Native Paper

## Prerequisites

- Node.js v20+ (LTS)
- npm or yarn
- Expo Go app on your mobile device (for testing)
- Firebase account

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable the following services:
   - **Authentication** (Email/Password, Google)
   - **Firestore Database**
   - **Cloud Storage**
   - **Cloud Functions**
   - **Cloud Messaging (FCM)**

4. Get your Firebase configuration:
   - Go to Project Settings > General
   - Scroll to "Your apps" section
   - Click "Add app" or select existing app
   - Copy the Firebase SDK configuration

5. Update the Firebase config in `services/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Run the App

```bash
# Start the development server
npm start

# Or run on specific platform
npm run android  # Android emulator
npm run ios      # iOS simulator (macOS only)
npm run web      # Web browser
```

### 4. Test on Your Device

1. Install **Expo Go** app from Play Store (Android) or App Store (iOS)
2. Scan the QR code from the terminal
3. The app will load on your device

## Project Structure

```
peertutor-v2/
├── app/                  # Expo Router screens
│   ├── (auth)/          # Authentication screens
│   ├── (tabs)/          # Main tab navigation
│   ├── chat/            # Chat screens
│   ├── community/       # Community screens
│   ├── event/           # Event screens
│   ├── notifications/   # Notification center
│   └── admin/           # Admin dashboard
├── components/          # Reusable UI components
├── stores/             # Zustand state management stores
├── services/           # Firebase and API services
├── utils/              # Helper functions
├── constants/          # Theme, subjects, and other constants
└── assets/             # Images, fonts, and other assets
```

## Development Roadmap

- [x] Week 1: Foundation & Setup
- [x] Week 2: Core Social Features (Profile, Matching, Peer Requests)
- [x] Week 3: Chat & Discovery
- [x] Week 3+: Communities & Events (Base implementation)
- [ ] Week 4: Complete Community/Event detail pages & File Library
- [ ] Week 5: Gamification (Streaks) & Admin Dashboard
- [ ] Week 6: Notifications & Moderation

## Firebase Collections Schema

- `users`: User profiles with skills and needs
- `matches`: Suggested peer matches
- `connections`: Approved peer relationships
- `chats`: Chat metadata and messages
- `communities`: Subject-based communities
- `events`: Study events and workshops
- `fileLibrary`: Shared study materials
- `reports`: User reports and moderation
- `notifications`: Push and in-app notifications

## Scripts

- `npm start`: Start Expo development server
- `npm run android`: Run on Android
- `npm run ios`: Run on iOS (macOS only)
- `npm run web`: Run in web browser

## Contributing

This is a personal project. Feel free to fork and customize for your needs!

## License

MIT License
