import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { DEFAULT_PROFILE_VISIBILITY } from '../constants/app';

/**
 * Sign up a new user with email and password
 */
export const signUpWithEmail = async (email, password, displayName) => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, {
      displayName: displayName,
    });

    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      photoURL: null,
      skills: [],
      needs: [],
      bio: '',
      streak: {
        count: 0,
        lastActive: null,
      },
      blocked: [],
      profileVisibility: DEFAULT_PROFILE_VISIBILITY,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return user;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

/**
 * Sign in an existing user with email and password
 */
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

/**
 * Sign in with Google
 * Uses Google OAuth with Firebase Authentication
 */
export const signInWithGoogle = async () => {
  try {
    // Import dynamically to avoid issues if not configured
    const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
    const * as Google = await import('expo-auth-session/providers/google');
    const * as WebBrowser = await import('expo-web-browser');

    // Complete auth session for web
    WebBrowser.maybeCompleteAuthSession();

    // Configure Google Auth
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    });

    if (!request) {
      throw new Error('Failed to create Google auth request');
    }

    // Prompt for Google Sign-In
    const result = await promptAsync();

    if (result.type === 'success') {
      const { id_token } = result.params;

      // Create Firebase credential from Google ID token
      const credential = GoogleAuthProvider.credential(id_token);

      // Sign in with Firebase
      const userCredential = await signInWithCredential(auth, credential);

      // Check if user profile exists, if not create one
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create new user profile
        await setDoc(userDocRef, {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || '',
          photoURL: userCredential.user.photoURL || '',
          bio: '',
          skills: [],
          needs: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return userCredential.user;
    } else {
      throw new Error('Google Sign-In cancelled or failed');
    }
  } catch (error) {
    console.error('Google Sign-In error:', error);
    throw error;
  }
};

/**
 * Alternative Google Sign-In implementation using Firebase Web SDK
 * This works better in some scenarios
 */
export const signInWithGoogleWeb = async () => {
  try {
    const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');

    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    const userCredential = await signInWithPopup(auth, provider);

    // Check if user profile exists, if not create one
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || '',
        photoURL: userCredential.user.photoURL || '',
        bio: '',
        skills: [],
        needs: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return userCredential.user;
  } catch (error) {
    console.error('Google Sign-In Web error:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 */
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

/**
 * Update user profile in Firestore
 */
export const updateUserProfile = async (uid, data) => {
  try {
    await setDoc(
      doc(db, 'users', uid),
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
};
