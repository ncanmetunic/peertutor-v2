import { create } from 'zustand';
import {
  createOrGetChat,
  sendMessage,
  uploadChatFile,
  getUserChats,
  subscribeToMessages,
  subscribeToUserChats,
  markMessagesAsRead,
  getTotalUnreadCount,
} from '../services/chatService';
import { getUserProfile } from '../services/userService';

const useChatStore = create((set, get) => ({
  // State
  chats: [],
  currentChat: null,
  messages: [],
  loading: false,
  error: null,
  unreadCount: 0,
  chatSubscription: null,
  messageSubscription: null,

  // Create or get chat
  createOrGetChat: async (userId1, userId2) => {
    try {
      set({ loading: true, error: null });
      const chat = await createOrGetChat(userId1, userId2);

      // Fetch other user's profile
      const otherUserId = chat.participants.find(id => id !== userId1);
      const userProfile = await getUserProfile(otherUserId);

      set({
        currentChat: { ...chat, otherUser: userProfile },
        loading: false,
      });

      return chat;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Send message
  sendMessage: async (chatId, senderId, text, fileUri = null, fileName = null, fileType = null) => {
    try {
      let fileData = null;

      // Upload file if provided
      if (fileUri && fileName) {
        fileData = await uploadChatFile(chatId, fileUri, fileName, fileType);
      }

      await sendMessage(chatId, senderId, text, fileData);
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Subscribe to user chats
  subscribeToChats: (userId) => {
    const { chatSubscription } = get();

    // Unsubscribe from previous subscription
    if (chatSubscription) {
      chatSubscription();
    }

    const unsubscribe = subscribeToUserChats(userId, async (chats) => {
      // Fetch user profiles for all chats
      const chatsWithUsers = await Promise.all(
        chats.map(async (chat) => {
          const otherUserId = chat.participants.find(id => id !== userId);
          const userProfile = await getUserProfile(otherUserId);
          return { ...chat, otherUser: userProfile };
        })
      );

      set({ chats: chatsWithUsers });
    });

    set({ chatSubscription: unsubscribe });
    return unsubscribe;
  },

  // Subscribe to messages in current chat
  subscribeToMessages: (chatId) => {
    const { messageSubscription } = get();

    // Unsubscribe from previous subscription
    if (messageSubscription) {
      messageSubscription();
    }

    const unsubscribe = subscribeToMessages(chatId, (messages) => {
      set({ messages });
    });

    set({ messageSubscription: unsubscribe });
    return unsubscribe;
  },

  // Mark messages as read
  markAsRead: async (chatId, userId) => {
    try {
      await markMessagesAsRead(chatId, userId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  },

  // Update unread count
  updateUnreadCount: async (userId) => {
    try {
      const count = await getTotalUnreadCount(userId);
      set({ unreadCount: count });
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  },

  // Set current chat
  setCurrentChat: (chat) => {
    set({ currentChat: chat, messages: [] });
  },

  // Clear current chat
  clearCurrentChat: () => {
    const { messageSubscription } = get();
    if (messageSubscription) {
      messageSubscription();
    }
    set({ currentChat: null, messages: [], messageSubscription: null });
  },

  // Cleanup subscriptions
  cleanup: () => {
    const { chatSubscription, messageSubscription } = get();
    if (chatSubscription) chatSubscription();
    if (messageSubscription) messageSubscription();
    set({
      chats: [],
      currentChat: null,
      messages: [],
      chatSubscription: null,
      messageSubscription: null,
    });
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useChatStore;
