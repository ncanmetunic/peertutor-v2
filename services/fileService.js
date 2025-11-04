import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from './firebase';
import { generateUniqueFileName } from '../utils/fileHelpers';

/**
 * Upload a file to Firebase Storage and create Firestore metadata
 */
export const uploadFile = async (communityId, fileUri, metadata) => {
  try {
    // Fetch file from URI
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // Generate unique filename
    const uniqueFileName = generateUniqueFileName(metadata.fileName);

    // Create storage reference
    const storagePath = `community-files/${communityId}/${uniqueFileName}`;
    const storageRef = ref(storage, storagePath);

    // Upload file
    await uploadBytes(storageRef, blob);

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    // Create Firestore metadata
    const fileData = {
      fileName: metadata.fileName,
      fileType: metadata.fileType,
      fileSize: metadata.fileSize,
      downloadURL,
      storagePath,
      communityId,
      channelId: metadata.channelId || null,
      uploadedBy: metadata.uploadedBy,
      description: metadata.description || '',
      tags: metadata.tags || [],
      uploadedAt: serverTimestamp(),
    };

    const fileRef = await addDoc(collection(db, 'files'), fileData);

    return {
      id: fileRef.id,
      ...fileData,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Get files for a community (optionally filtered by channel)
 */
export const getFiles = async (communityId, channelId = null, limitCount = 30) => {
  try {
    const filesRef = collection(db, 'files');
    let q;

    if (channelId) {
      q = query(
        filesRef,
        where('communityId', '==', communityId),
        where('channelId', '==', channelId),
        orderBy('uploadedAt', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(
        filesRef,
        where('communityId', '==', communityId),
        orderBy('uploadedAt', 'desc'),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting files:', error);
    throw error;
  }
};

/**
 * Get file by ID
 */
export const getFile = async (fileId) => {
  try {
    const fileDoc = await getDoc(doc(db, 'files', fileId));
    if (fileDoc.exists()) {
      return { id: fileDoc.id, ...fileDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting file:', error);
    throw error;
  }
};

/**
 * Delete a file (both from Storage and Firestore)
 */
export const deleteFile = async (fileId) => {
  try {
    // Get file metadata
    const fileData = await getFile(fileId);

    if (!fileData) {
      throw new Error('File not found');
    }

    // Delete from Storage
    const storageRef = ref(storage, fileData.storagePath);
    await deleteObject(storageRef);

    // Delete from Firestore
    await deleteDoc(doc(db, 'files', fileId));
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Get files uploaded by a specific user
 */
export const getUserFiles = async (userId, limitCount = 50) => {
  try {
    const filesRef = collection(db, 'files');
    const q = query(
      filesRef,
      where('uploadedBy', '==', userId),
      orderBy('uploadedAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting user files:', error);
    throw error;
  }
};

/**
 * Search files by tags or filename
 */
export const searchFiles = async (communityId, searchTerm) => {
  try {
    const filesRef = collection(db, 'files');
    const q = query(
      filesRef,
      where('communityId', '==', communityId),
      orderBy('uploadedAt', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const files = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Client-side filtering for filename and tags
    const searchLower = searchTerm.toLowerCase();
    return files.filter(file => {
      const fileNameMatch = file.fileName.toLowerCase().includes(searchLower);
      const tagMatch = file.tags?.some(tag => tag.toLowerCase().includes(searchLower));
      const descMatch = file.description?.toLowerCase().includes(searchLower);

      return fileNameMatch || tagMatch || descMatch;
    });
  } catch (error) {
    console.error('Error searching files:', error);
    throw error;
  }
};
