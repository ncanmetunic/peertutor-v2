import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Create a new community
 */
export const createCommunity = async (creatorId, data) => {
  try {
    const communityRef = await addDoc(collection(db, 'communities'), {
      name: data.name,
      description: data.description,
      topic: data.topic,
      icon: data.icon || '📚',
      createdBy: creatorId,
      members: [creatorId],
      memberCount: 1,
      createdAt: serverTimestamp(),
    });

    // Create default "general" channel
    await addDoc(collection(db, 'communities', communityRef.id, 'channels'), {
      name: 'general',
      description: 'General discussion',
      createdAt: serverTimestamp(),
    });

    return communityRef.id;
  } catch (error) {
    console.error('Error creating community:', error);
    throw error;
  }
};

/**
 * Get all communities
 */
export const getAllCommunities = async () => {
  try {
    const communitiesRef = collection(db, 'communities');
    const q = query(communitiesRef, orderBy('memberCount', 'desc'), limit(50));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting communities:', error);
    throw error;
  }
};

/**
 * Get community by ID
 */
export const getCommunity = async (communityId) => {
  try {
    const communityDoc = await getDoc(doc(db, 'communities', communityId));
    if (communityDoc.exists()) {
      return { id: communityDoc.id, ...communityDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting community:', error);
    throw error;
  }
};

/**
 * Join a community
 */
export const joinCommunity = async (communityId, userId) => {
  try {
    const communityRef = doc(db, 'communities', communityId);
    await updateDoc(communityRef, {
      members: arrayUnion(userId),
      memberCount: increment(1),
    });
  } catch (error) {
    console.error('Error joining community:', error);
    throw error;
  }
};

/**
 * Leave a community
 */
export const leaveCommunity = async (communityId, userId) => {
  try {
    const communityRef = doc(db, 'communities', communityId);
    await updateDoc(communityRef, {
      members: arrayRemove(userId),
      memberCount: increment(-1),
    });
  } catch (error) {
    console.error('Error leaving community:', error);
    throw error;
  }
};

/**
 * Get channels for a community
 */
export const getCommunityChannels = async (communityId) => {
  try {
    const channelsRef = collection(db, 'communities', communityId, 'channels');
    const snapshot = await getDocs(channelsRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting channels:', error);
    throw error;
  }
};

/**
 * Create a channel in a community
 */
export const createChannel = async (communityId, name, description) => {
  try {
    const channelRef = await addDoc(
      collection(db, 'communities', communityId, 'channels'),
      {
        name,
        description,
        createdAt: serverTimestamp(),
      }
    );

    return channelRef.id;
  } catch (error) {
    console.error('Error creating channel:', error);
    throw error;
  }
};

/**
 * Send message to a channel
 */
export const sendChannelMessage = async (communityId, channelId, userId, text) => {
  try {
    const messagesRef = collection(
      db,
      'communities',
      communityId,
      'channels',
      channelId,
      'messages'
    );

    await addDoc(messagesRef, {
      userId,
      text,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error sending channel message:', error);
    throw error;
  }
};

/**
 * Get channel messages
 */
export const getChannelMessages = async (communityId, channelId, limitCount = 50) => {
  try {
    const messagesRef = collection(
      db,
      'communities',
      communityId,
      'channels',
      channelId,
      'messages'
    );
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })).reverse();
  } catch (error) {
    console.error('Error getting channel messages:', error);
    throw error;
  }
};

/**
 * Get user's communities
 */
export const getUserCommunities = async (userId) => {
  try {
    const communitiesRef = collection(db, 'communities');
    const q = query(communitiesRef, where('members', 'array-contains', userId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting user communities:', error);
    throw error;
  }
};
