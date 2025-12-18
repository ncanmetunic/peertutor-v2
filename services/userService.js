import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  startAfter,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';

/**
 * Get user profile by UID
 */
export const getUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Alias for getUserProfile
 */
export const getUserById = getUserProfile;

/**
 * Update user profile
 */
export const updateUserProfile = async (uid, data) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Upload profile picture to Firebase Storage
 */
export const uploadProfilePicture = async (uid, imageUri) => {
  try {
    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Create storage reference
    const storageRef = ref(storage, `profile-pictures/${uid}.jpg`);

    // Upload image
    await uploadBytes(storageRef, blob);

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    // Update user profile with photo URL
    await updateUserProfile(uid, { photoURL: downloadURL });

    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

/**
 * Delete profile picture
 */
export const deleteProfilePicture = async (uid) => {
  try {
    const storageRef = ref(storage, `profile-pictures/${uid}.jpg`);
    await deleteObject(storageRef);
    await updateUserProfile(uid, { photoURL: null });
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    throw error;
  }
};

/**
 * Search users by skills or needs
 */
export const searchUsersByTopic = async (topic, limitCount = 20) => {
  try {
    const usersRef = collection(db, 'users');

    // Search in skills
    const skillsQuery = query(
      usersRef,
      where('skills', 'array-contains', topic),
      limit(limitCount)
    );
    const skillsSnapshot = await getDocs(skillsQuery);

    // Search in needs
    const needsQuery = query(
      usersRef,
      where('needs', 'array-contains', topic),
      limit(limitCount)
    );
    const needsSnapshot = await getDocs(needsQuery);

    // Combine results (remove duplicates)
    const users = new Map();

    skillsSnapshot.forEach(doc => {
      users.set(doc.id, { id: doc.id, ...doc.data() });
    });

    needsSnapshot.forEach(doc => {
      if (!users.has(doc.id)) {
        users.set(doc.id, { id: doc.id, ...doc.data() });
      }
    });

    return Array.from(users.values());
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

/**
 * Get all users (for discovery) with pagination
 */
export const getAllUsers = async (limitCount = 20, lastDoc = null) => {
  try {
    const usersRef = collection(db, 'users');
    let q;

    if (lastDoc) {
      // Paginated query
      q = query(
        usersRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(limitCount)
      );
    } else {
      // First page
      q = query(
        usersRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);

    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      _doc: doc, // Store document reference for pagination
    }));

    return {
      users,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === limitCount,
    };
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

/**
 * Get all users (legacy - for backward compatibility)
 */
export const fetchAllUsers = async (limitCount = 50) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

/**
 * Update user streak
 */
export const updateUserStreak = async (uid) => {
  try {
    const userProfile = await getUserProfile(uid);
    if (!userProfile) return;

    const today = new Date().toDateString();
    const lastActive = userProfile.streak?.lastActive
      ? new Date(userProfile.streak.lastActive.toDate()).toDateString()
      : null;

    let newStreak = userProfile.streak?.count || 0;

    if (lastActive === today) {
      // Already active today, no change
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (lastActive === yesterdayStr) {
      // Streak continues
      newStreak += 1;
    } else if (lastActive !== today) {
      // Streak broken, reset to 1
      newStreak = 1;
    }

    await updateUserProfile(uid, {
      streak: {
        count: newStreak,
        lastActive: serverTimestamp(),
      },
    });

    return newStreak;
  } catch (error) {
    console.error('Error updating user streak:', error);
    throw error;
  }
};

/**
 * Block a user
 */
export const blockUser = async (currentUserId, userIdToBlock) => {
  try {
    const userProfile = await getUserProfile(currentUserId);
    const blocked = userProfile.blocked || [];

    if (!blocked.includes(userIdToBlock)) {
      blocked.push(userIdToBlock);
      await updateUserProfile(currentUserId, { blocked });
    }
  } catch (error) {
    console.error('Error blocking user:', error);
    throw error;
  }
};

/**
 * Unblock a user
 */
export const unblockUser = async (currentUserId, userIdToUnblock) => {
  try {
    const userProfile = await getUserProfile(currentUserId);
    const blocked = userProfile.blocked || [];

    const filtered = blocked.filter(id => id !== userIdToUnblock);
    await updateUserProfile(currentUserId, { blocked: filtered });
  } catch (error) {
    console.error('Error unblocking user:', error);
    throw error;
  }
};
