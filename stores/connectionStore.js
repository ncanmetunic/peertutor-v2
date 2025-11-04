import { create } from 'zustand';
import {
  sendConnectionRequest,
  getConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  getPendingRequests,
  getConnections,
  areUsersConnected,
} from '../services/connectionService';
import { getUserProfile } from '../services/userService';

const useConnectionStore = create((set, get) => ({
  // State
  pendingRequests: [],
  sentRequests: [],
  connections: [],
  loading: false,
  error: null,

  // Send connection request
  sendRequest: async (fromUserId, toUserId) => {
    try {
      set({ loading: true, error: null });
      const requestId = await sendConnectionRequest(fromUserId, toUserId);

      // Add to sent requests
      set((state) => ({
        sentRequests: [
          ...state.sentRequests,
          {
            id: requestId,
            users: [fromUserId, toUserId],
            status: 'pending',
            requestedBy: fromUserId,
          },
        ],
        loading: false,
      }));

      return requestId;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Accept connection request
  acceptRequest: async (connectionId) => {
    try {
      set({ loading: true, error: null });
      await acceptConnectionRequest(connectionId);

      // Move from pending to connections
      set((state) => ({
        pendingRequests: state.pendingRequests.filter(r => r.id !== connectionId),
        connections: [
          ...state.connections,
          {
            ...state.pendingRequests.find(r => r.id === connectionId),
            status: 'accepted',
          },
        ],
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Decline connection request
  declineRequest: async (connectionId) => {
    try {
      set({ loading: true, error: null });
      await declineConnectionRequest(connectionId);

      // Remove from pending requests
      set((state) => ({
        pendingRequests: state.pendingRequests.filter(r => r.id !== connectionId),
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Fetch pending requests
  fetchPendingRequests: async (userId) => {
    try {
      set({ loading: true, error: null });
      const requests = await getPendingRequests(userId);

      // Separate incoming and outgoing requests
      const incoming = requests.filter(r => r.requestedBy !== userId);
      const outgoing = requests.filter(r => r.requestedBy === userId);

      // Fetch user details for incoming requests
      const requestsWithUsers = await Promise.all(
        incoming.map(async (request) => {
          const otherUserId = request.users.find(id => id !== userId);
          const userProfile = await getUserProfile(otherUserId);
          return {
            ...request,
            user: userProfile,
          };
        })
      );

      set({
        pendingRequests: requestsWithUsers,
        sentRequests: outgoing,
        loading: false,
      });

      return requestsWithUsers;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Fetch all connections
  fetchConnections: async (userId) => {
    try {
      set({ loading: true, error: null });
      const connections = await getConnections(userId);

      // Fetch user details for each connection
      const connectionsWithUsers = await Promise.all(
        connections.map(async (connection) => {
          const otherUserId = connection.users.find(id => id !== userId);
          const userProfile = await getUserProfile(otherUserId);
          return {
            ...connection,
            user: userProfile,
          };
        })
      );

      set({
        connections: connectionsWithUsers,
        loading: false,
      });

      return connectionsWithUsers;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Check if users are connected
  checkConnection: async (userId1, userId2) => {
    try {
      return await areUsersConnected(userId1, userId2);
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () =>
    set({
      pendingRequests: [],
      sentRequests: [],
      connections: [],
      loading: false,
      error: null,
    }),
}));

export default useConnectionStore;
