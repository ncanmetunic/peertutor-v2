import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  signUpWithEmail,
  signInWithEmail,
  signOutUser,
  getUserProfile,
} from '../services/authService';

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  userProfile: null,
  loading: true,
  error: null,

  // Initialize auth listener
  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        try {
          const profile = await getUserProfile(user.uid);
          set({
            user: user,
            userProfile: profile,
            loading: false,
            error: null,
          });
        } catch (error) {
          console.error('Error fetching user profile:', error);
          set({
            user: user,
            userProfile: null,
            loading: false,
            error: error.message,
          });
        }
      } else {
        // User is signed out
        set({
          user: null,
          userProfile: null,
          loading: false,
          error: null,
        });
      }
    });

    return unsubscribe;
  },

  // Sign up
  signUp: async (email, password, displayName) => {
    try {
      set({ loading: true, error: null });
      const user = await signUpWithEmail(email, password, displayName);
      const profile = await getUserProfile(user.uid);
      set({
        user: user,
        userProfile: profile,
        loading: false,
        error: null,
      });
      return user;
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Sign in
  signIn: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const user = await signInWithEmail(email, password);
      const profile = await getUserProfile(user.uid);
      set({
        user: user,
        userProfile: profile,
        loading: false,
        error: null,
      });
      return user;
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      set({ loading: true, error: null });
      await signOutUser();
      set({
        user: null,
        userProfile: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Refresh user profile
  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const profile = await getUserProfile(user.uid);
      set({ userProfile: profile });
    } catch (error) {
      console.error('Error refreshing profile:', error);
      set({ error: error.message });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
