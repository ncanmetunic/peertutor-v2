import { create } from 'zustand';
import {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  searchUsersByTopic,
  getAllUsers,
  updateUserStreak,
  blockUser,
  unblockUser,
} from '../services/userService';

const useUserStore = create((set, get) => ({
  // State
  currentUserProfile: null,
  users: [],
  loading: false,
  error: null,

  // Set current user profile
  setCurrentUserProfile: (profile) => {
    set({ currentUserProfile: profile });
  },

  // Fetch current user profile
  fetchCurrentUserProfile: async (uid) => {
    try {
      set({ loading: true, error: null });
      const profile = await getUserProfile(uid);
      set({ currentUserProfile: profile, loading: false });
      return profile;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update current user profile
  updateCurrentUserProfile: async (uid, data) => {
    try {
      set({ loading: true, error: null });
      await updateUserProfile(uid, data);

      // Refresh profile
      const updatedProfile = await getUserProfile(uid);
      set({ currentUserProfile: updatedProfile, loading: false });

      return updatedProfile;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Upload profile picture
  uploadProfilePicture: async (uid, imageUri) => {
    try {
      set({ loading: true, error: null });
      const photoURL = await uploadProfilePicture(uid, imageUri);

      // Update local state
      set((state) => ({
        currentUserProfile: {
          ...state.currentUserProfile,
          photoURL,
        },
        loading: false,
      }));

      return photoURL;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Search users
  searchUsers: async (topic) => {
    try {
      set({ loading: true, error: null });
      const users = await searchUsersByTopic(topic);
      set({ users, loading: false });
      return users;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Fetch all users
  fetchAllUsers: async () => {
    try {
      set({ loading: true, error: null });
      const users = await getAllUsers();
      set({ users, loading: false });
      return users;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update streak
  updateStreak: async (uid) => {
    try {
      const newStreak = await updateUserStreak(uid);

      // Update local state
      set((state) => ({
        currentUserProfile: {
          ...state.currentUserProfile,
          streak: {
            count: newStreak,
            lastActive: new Date(),
          },
        },
      }));

      return newStreak;
    } catch (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  },

  // Block user
  blockUser: async (currentUserId, userIdToBlock) => {
    try {
      await blockUser(currentUserId, userIdToBlock);

      // Update local state
      set((state) => ({
        currentUserProfile: {
          ...state.currentUserProfile,
          blocked: [...(state.currentUserProfile.blocked || []), userIdToBlock],
        },
      }));
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  },

  // Unblock user
  unblockUser: async (currentUserId, userIdToUnblock) => {
    try {
      await unblockUser(currentUserId, userIdToUnblock);

      // Update local state
      set((state) => ({
        currentUserProfile: {
          ...state.currentUserProfile,
          blocked: (state.currentUserProfile.blocked || []).filter(
            (id) => id !== userIdToUnblock
          ),
        },
      }));
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () =>
    set({
      currentUserProfile: null,
      users: [],
      loading: false,
      error: null,
    }),
}));

export default useUserStore;
