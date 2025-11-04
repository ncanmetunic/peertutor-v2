import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyANGTZ4toKIeYFePTFQhcnUTtj9vO2lcKo",
  authDomain: "peertutorapp-eab5a.firebaseapp.com",
  projectId: "peertutorapp-eab5a",
  storageBucket: "peertutorapp-eab5a.firebasestorage.app",
  messagingSenderId: "81449387073",
  appId: "1:81449387073:web:57ad950087c19569d732c0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

// Initialize Cloud Functions
const functions = getFunctions(app);

export { app, auth, db, storage, functions };
export default app;
