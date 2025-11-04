import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

/**
 * Create or get existing chat between two users
 */
export const createOrGetChat = async (userId1, userId2) => {
  try {
    // Check if chat already exists
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', userId1));
    const snapshot = await getDocs(q);

    const existingChat = snapshot.docs.find(doc => {
      const data = doc.data();
      return data.participants.includes(userId2);
    });

    if (existingChat) {
      return { id: existingChat.id, ...existingChat.data() };
    }

    // Create new chat
    const chatRef = await addDoc(chatsRef, {
      participants: [userId1, userId2],
      lastMessage: null,
      lastMessageTime: null,
      unreadCount: {
        [userId1]: 0,
        [userId2]: 0,
      },
      createdAt: serverTimestamp(),
    });

    return { id: chatRef.id, participants: [userId1, userId2] };
  } catch (error) {
    console.error('Error creating/getting chat:', error);
    throw error;
  }
};

/**
 * Send a message in a chat
 */
export const sendMessage = async (chatId, senderId, text, fileData = null) => {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    const messageData = {
      senderId,
      text: text || '',
      fileURL: fileData?.url || null,
      fileName: fileData?.name || null,
      fileType: fileData?.type || null,
      createdAt: serverTimestamp(),
      read: false,
    };

    await addDoc(messagesRef, messageData);

    // Update chat metadata
    const chatRef = doc(db, 'chats', chatId);
    const chatDoc = await getDoc(chatRef);
    const chatData = chatDoc.data();

    // Increment unread count for other participant
    const otherUserId = chatData.participants.find(id => id !== senderId);

    await updateDoc(chatRef, {
      lastMessage: text || '📎 File',
      lastMessageTime: serverTimestamp(),
      [`unreadCount.${otherUserId}`]: increment(1),
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Upload file to chat
 */
export const uploadChatFile = async (chatId, fileUri, fileName, fileType) => {
  try {
    const response = await fetch(fileUri);
    const blob = await response.blob();

    const timestamp = Date.now();
    const storageRef = ref(storage, `chat-files/${chatId}/${timestamp}_${fileName}`);

    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);

    return {
      url: downloadURL,
      name: fileName,
      type: fileType,
    };
  } catch (error) {
    console.error('Error uploading chat file:', error);
    throw error;
  }
};

/**
 * Get all chats for a user
 */
export const getUserChats = async (userId) => {
  try {
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting user chats:', error);
    throw error;
  }
};

/**
 * Subscribe to chat messages (real-time)
 */
export const subscribeToMessages = (chatId, callback) => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(messages);
  });
};

/**
 * Subscribe to user chats (real-time)
 */
export const subscribeToUserChats = (userId, callback) => {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTime', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(chats);
  });
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (chatId, userId) => {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      [`unreadCount.${userId}`]: 0,
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

/**
 * Get total unread count for user
 */
export const getTotalUnreadCount = async (userId) => {
  try {
    const chats = await getUserChats(userId);
    return chats.reduce((total, chat) => {
      return total + (chat.unreadCount?.[userId] || 0);
    }, 0);
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};
