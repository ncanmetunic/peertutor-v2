# PeerTutor Setup Guide

## Week 1 Foundation - COMPLETED ✓

You've successfully completed the foundation setup for PeerTutor! Here's what's been implemented:

### ✓ Completed Tasks

1. **Development Environment**
   - Node.js v20.19.5 installed via nvm
   - npm 10.8.2 installed

2. **Project Initialization**
   - Expo project created with React Native
   - Complete folder structure set up
   - All core dependencies installed

3. **Authentication System**
   - Firebase configuration ready
   - Authentication screens (Login & Signup)
   - Zustand auth store with state management
   - Firebase Auth service with email/password support
   - Protected route navigation

4. **Navigation Structure**
   - Expo Router setup with file-based routing
   - Tab navigation (Dashboard, Discover, Communities, Events, Profile)
   - Auth flow routing

5. **Design System**
   - Color theme with primary, secondary, and accent colors
   - Typography system
   - Spacing and layout constants
   - Subject categories (30+ topics)

## Next Steps: Firebase Setup

Before you can test the app, you need to configure Firebase:

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: "PeerTutor" (or your choice)
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Enable **Email/Password** sign-in method
4. (Optional) Enable **Google** sign-in if you plan to implement it

### 3. Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (for development)
4. Select your preferred region
5. Click "Enable"

### 4. Set up Cloud Storage

1. Go to **Storage**
2. Click "Get started"
3. Start in **test mode**
4. Click "Done"

### 5. Get Firebase Config

1. In Project Settings (gear icon) > General
2. Scroll to "Your apps"
3. Click the web icon (</>) to add a web app
4. Register app with nickname "PeerTutor Web"
5. Copy the `firebaseConfig` object

### 6. Update Firebase Configuration

Edit `services/firebase.js` and replace the placeholder config:

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

## Running the App

Once Firebase is configured:

```bash
# Start the development server
npm start

# Or use the shell command with nvm
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && nvm use 20 && npm start
```

### Testing on Your Phone

1. Install **Expo Go** from Play Store or App Store
2. Scan the QR code from the terminal
3. App will load on your device

## What's Working Now

- ✅ App launches with loading screen
- ✅ Redirects to login if not authenticated
- ✅ Login and signup screens with validation
- ✅ Firebase authentication integration
- ✅ Auto-redirect to dashboard after login
- ✅ Tab navigation between main screens
- ✅ Theme and design system applied

## What's Next: Week 2

The next phase will implement:

1. **Profile Management**
   - Complete profile creation flow
   - Skills/needs tag selection
   - Profile picture upload
   - Bio and user info

2. **Matching System**
   - Matching algorithm
   - Match suggestions UI
   - Compatibility scoring

3. **Peer Connection System**
   - Send peer requests
   - Accept/decline requests
   - Connections list

## Troubleshooting

### If you see "Firebase not configured" errors:
- Make sure you've updated `services/firebase.js` with your real Firebase config

### If the app won't start:
```bash
# Clear cache and restart
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && nvm use 20
rm -rf node_modules
npm install
npm start -- --clear
```

### If authentication doesn't work:
- Check Firebase Console > Authentication is enabled
- Verify your Firebase config is correct
- Check browser console for detailed error messages

## Project Structure Overview

```
peertutor-v2/
├── app/                    # Screens (Expo Router)
│   ├── (auth)/            # Login, Signup
│   ├── (tabs)/            # Main app screens
│   └── index.js           # Entry point
├── components/            # Reusable UI components
├── stores/               # Zustand state management
│   └── authStore.js      # Authentication state
├── services/             # Firebase services
│   ├── firebase.js       # Firebase config
│   └── authService.js    # Auth methods
├── constants/            # Theme, subjects, etc.
├── utils/                # Helper functions
└── assets/               # Images, fonts

```

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Native Paper Components](https://callstack.github.io/react-native-paper/)
- [Zustand State Management](https://docs.pmnd.rs/zustand/getting-started/introduction)

---

**Week 1 Status: COMPLETE** ✓

Ready to move to Week 2 when you're ready!
