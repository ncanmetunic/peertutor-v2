import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { db } from './firebase';
import { doc, updateDoc, collection, query, where, orderBy, onSnapshot, getDocs, writeBatch } from 'firebase/firestore';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and save FCM token
 */
export async function registerForPushNotifications(userId) {
  let token;

  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification');
      return null;
    }

    // Get the Expo push token
    token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'peertutorapp-eab5a',
    });

    // Save token to user document
    if (userId && token.data) {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmToken: token.data,
        lastTokenUpdate: new Date(),
      });
      console.log('FCM token saved:', token.data);
    }
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }

  // Android-specific configuration
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token?.data;
}

/**
 * Subscribe to notifications for a user
 */
export function subscribeToNotifications(userId, callback) {
  if (!userId) return () => {};

  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = [];
    snapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    callback(notifications);
  }, (error) => {
    console.error('Error subscribing to notifications:', error);
  });
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId) {
  if (!userId) return 0;

  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId) {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: new Date(),
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId) {
  if (!userId) return;

  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return;
    }

    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        read: true,
        readAt: new Date(),
      });
    });

    await batch.commit();
    console.log(`Marked ${snapshot.size} notifications as read`);
  } catch (error) {
    console.error('Error marking all as read:', error);
    throw error;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId) {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      deleted: true,
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userId) {
  if (!userId) return;

  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', userId));

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return;
    }

    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        deleted: true,
      });
    });

    await batch.commit();
    console.log(`Deleted ${snapshot.size} notifications`);
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type) {
  const icons = {
    connection_request: 'account-multiple-plus',
    connection_accepted: 'account-check',
    new_message: 'message',
    new_event: 'calendar',
    event_reminder: 'bell-ring',
    community_invite: 'account-group',
    new_match: 'star',
  };

  return icons[type] || 'bell';
}

/**
 * Setup notification listeners
 */
export function setupNotificationListeners(navigationRef) {
  // Listener for notifications received while app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received in foreground:', notification);
    }
  );

  // Listener for when user taps on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('Notification tapped:', response);

      const data = response.notification.request.content.data;

      // Navigate based on notification type
      if (navigationRef?.current) {
        switch (data.type) {
          case 'new_message':
            if (data.chatId) {
              navigationRef.current.navigate('chat', { chatId: data.chatId });
            }
            break;
          case 'connection_request':
          case 'connection_accepted':
            navigationRef.current.navigate('connections');
            break;
          case 'new_event':
          case 'event_reminder':
            if (data.eventId) {
              navigationRef.current.navigate('event-details', { id: data.eventId });
            }
            break;
          case 'community_invite':
            if (data.communityId) {
              navigationRef.current.navigate('community-details', { id: data.communityId });
            }
            break;
          case 'new_match':
            if (data.matchedUserId) {
              navigationRef.current.navigate('profile', { userId: data.matchedUserId });
            }
            break;
          default:
            navigationRef.current.navigate('notifications');
        }
      }
    }
  );

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}
