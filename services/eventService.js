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
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Create a new event
 */
export const createEvent = async (creatorId, eventData) => {
  try {
    const eventRef = await addDoc(collection(db, 'events'), {
      title: eventData.title,
      description: eventData.description,
      topic: eventData.topic,
      createdBy: creatorId,
      creatorName: eventData.creatorName,
      startTime: Timestamp.fromDate(new Date(eventData.startTime)),
      endTime: Timestamp.fromDate(new Date(eventData.endTime)),
      isOnline: true,
      participants: [creatorId],
      maxParticipants: eventData.maxParticipants || null,
      createdAt: serverTimestamp(),
    });

    return eventRef.id;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

/**
 * Get all upcoming events
 */
export const getUpcomingEvents = async () => {
  try {
    const eventsRef = collection(db, 'events');
    const now = Timestamp.now();
    const q = query(
      eventsRef,
      where('startTime', '>=', now),
      orderBy('startTime', 'asc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    throw error;
  }
};

/**
 * Get event by ID
 */
export const getEvent = async (eventId) => {
  try {
    const eventDoc = await getDoc(doc(db, 'events', eventId));
    if (eventDoc.exists()) {
      return { id: eventDoc.id, ...eventDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting event:', error);
    throw error;
  }
};

/**
 * Join an event (RSVP)
 */
export const joinEvent = async (eventId, userId) => {
  try {
    const eventRef = doc(db, 'events', eventId);
    const eventDoc = await getDoc(eventRef);
    const eventData = eventDoc.data();

    // Check if event is full
    if (
      eventData.maxParticipants &&
      eventData.participants.length >= eventData.maxParticipants
    ) {
      throw new Error('Event is full');
    }

    await updateDoc(eventRef, {
      participants: arrayUnion(userId),
    });
  } catch (error) {
    console.error('Error joining event:', error);
    throw error;
  }
};

/**
 * Leave an event
 */
export const leaveEvent = async (eventId, userId) => {
  try {
    const eventRef = doc(db, 'events', eventId);
    await updateDoc(eventRef, {
      participants: arrayRemove(userId),
    });
  } catch (error) {
    console.error('Error leaving event:', error);
    throw error;
  }
};

/**
 * Get user's events
 */
export const getUserEvents = async (userId) => {
  try {
    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('participants', 'array-contains', userId),
      orderBy('startTime', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting user events:', error);
    throw error;
  }
};

/**
 * Delete an event (creator only)
 */
export const deleteEvent = async (eventId) => {
  try {
    await deleteDoc(doc(db, 'events', eventId));
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};
