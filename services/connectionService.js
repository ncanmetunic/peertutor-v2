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
  or,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Send a peer connection request
 */
export const sendConnectionRequest = async (fromUserId, toUserId) => {
  try {
    // Check if request already exists
    const existingRequest = await getConnectionRequest(fromUserId, toUserId);
    if (existingRequest) {
      throw new Error('Connection request already sent');
    }

    // Create connection request
    const connectionRef = await addDoc(collection(db, 'connections'), {
      users: [fromUserId, toUserId],
      status: 'pending',
      requestedBy: fromUserId,
      createdAt: serverTimestamp(),
    });

    return connectionRef.id;
  } catch (error) {
    console.error('Error sending connection request:', error);
    throw error;
  }
};

/**
 * Get connection request between two users
 */
export const getConnectionRequest = async (userId1, userId2) => {
  try {
    const connectionsRef = collection(db, 'connections');
    const q = query(
      connectionsRef,
      where('users', 'array-contains', userId1)
    );

    const snapshot = await getDocs(q);
    const connection = snapshot.docs.find(doc => {
      const data = doc.data();
      return data.users.includes(userId2);
    });

    return connection ? { id: connection.id, ...connection.data() } : null;
  } catch (error) {
    console.error('Error getting connection request:', error);
    throw error;
  }
};

/**
 * Accept a connection request
 */
export const acceptConnectionRequest = async (connectionId) => {
  try {
    const connectionRef = doc(db, 'connections', connectionId);
    await updateDoc(connectionRef, {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error accepting connection request:', error);
    throw error;
  }
};

/**
 * Decline/delete a connection request
 */
export const declineConnectionRequest = async (connectionId) => {
  try {
    const connectionRef = doc(db, 'connections', connectionId);
    await deleteDoc(connectionRef);
  } catch (error) {
    console.error('Error declining connection request:', error);
    throw error;
  }
};

/**
 * Get all pending requests for a user
 */
export const getPendingRequests = async (userId) => {
  try {
    const connectionsRef = collection(db, 'connections');
    const q = query(
      connectionsRef,
      where('users', 'array-contains', userId),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting pending requests:', error);
    throw error;
  }
};

/**
 * Get all accepted connections for a user
 */
export const getConnections = async (userId) => {
  try {
    const connectionsRef = collection(db, 'connections');
    const q = query(
      connectionsRef,
      where('users', 'array-contains', userId),
      where('status', '==', 'accepted')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting connections:', error);
    throw error;
  }
};

/**
 * Check if two users are connected
 */
export const areUsersConnected = async (userId1, userId2) => {
  try {
    const connection = await getConnectionRequest(userId1, userId2);
    return connection && connection.status === 'accepted';
  } catch (error) {
    console.error('Error checking connection status:', error);
    throw error;
  }
};
