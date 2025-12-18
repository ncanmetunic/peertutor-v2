const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

/**
 * Helper function to send push notification
 */
async function sendPushNotification(userId, notification) {
  try {
    // Get user's FCM token
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || !userData.fcmToken) {
      console.log(`No FCM token for user ${userId}`);
      return;
    }

    // Send notification
    const message = {
      token: userData.fcmToken,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      android: {
        priority: 'high',
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    await admin.messaging().send(message);
    console.log(`Notification sent to user ${userId}`);
  } catch (error) {
    console.error(`Error sending notification to user ${userId}:`, error);
  }
}

/**
 * Helper function to create in-app notification
 */
async function createInAppNotification(userId, notification) {
  try {
    await db.collection('notifications').add({
      userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`In-app notification created for user ${userId}`);
  } catch (error) {
    console.error(`Error creating in-app notification for user ${userId}:`, error);
  }
}

/**
 * Trigger: New connection request
 * Sends notification when user receives a connection request
 */
exports.onConnectionRequest = functions.firestore
  .document('connections/{connectionId}')
  .onCreate(async (snap, context) => {
    const connection = snap.data();
    const { toUserId, fromUserId, status } = connection;

    if (status !== 'pending') {
      return null;
    }

    // Get sender's information
    const fromUserDoc = await db.collection('users').doc(fromUserId).get();
    const fromUser = fromUserDoc.data();

    if (!fromUser) {
      return null;
    }

    const notification = {
      type: 'connection_request',
      title: 'New Connection Request',
      body: `${fromUser.displayName || 'Someone'} wants to connect with you`,
      data: {
        fromUserId,
        connectionId: context.params.connectionId,
        type: 'connection_request',
      },
    };

    // Send both push and in-app notification
    await Promise.all([
      sendPushNotification(toUserId, notification),
      createInAppNotification(toUserId, notification),
    ]);

    return null;
  });

/**
 * Trigger: Connection accepted
 * Sends notification when connection request is accepted
 */
exports.onConnectionAccepted = functions.firestore
  .document('connections/{connectionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if status changed to accepted
    if (before.status === 'pending' && after.status === 'accepted') {
      const { fromUserId, toUserId } = after;

      // Get accepter's information
      const toUserDoc = await db.collection('users').doc(toUserId).get();
      const toUser = toUserDoc.data();

      if (!toUser) {
        return null;
      }

      const notification = {
        type: 'connection_accepted',
        title: 'Connection Accepted',
        body: `${toUser.displayName || 'Someone'} accepted your connection request`,
        data: {
          userId: toUserId,
          connectionId: context.params.connectionId,
          type: 'connection_accepted',
        },
      };

      // Notify the original requester
      await Promise.all([
        sendPushNotification(fromUserId, notification),
        createInAppNotification(fromUserId, notification),
      ]);
    }

    return null;
  });

/**
 * Trigger: New message in chat
 * Sends notification when user receives a new message
 */
exports.onNewMessage = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const { senderId, text } = message;
    const chatId = context.params.chatId;

    // Get chat document to find recipients
    const chatDoc = await db.collection('chats').doc(chatId).get();
    const chat = chatDoc.data();

    if (!chat || !chat.participants) {
      return null;
    }

    // Get sender information
    const senderDoc = await db.collection('users').doc(senderId).get();
    const sender = senderDoc.data();

    if (!sender) {
      return null;
    }

    // Notify all participants except the sender
    const recipients = chat.participants.filter((id) => id !== senderId);

    const notification = {
      type: 'new_message',
      title: `${sender.displayName || 'Someone'}`,
      body: text.length > 50 ? text.substring(0, 50) + '...' : text,
      data: {
        chatId,
        senderId,
        type: 'new_message',
      },
    };

    // Send notifications to all recipients
    const promises = recipients.flatMap((recipientId) => [
      sendPushNotification(recipientId, notification),
      createInAppNotification(recipientId, notification),
    ]);

    await Promise.all(promises);

    return null;
  });

/**
 * Trigger: New event created
 * Sends notification to relevant users about new events
 */
exports.onEventCreated = functions.firestore
  .document('events/{eventId}')
  .onCreate(async (snap, context) => {
    const event = snap.data();
    const { title, createdBy, communityId } = event;

    // Get creator information
    const creatorDoc = await db.collection('users').doc(createdBy).get();
    const creator = creatorDoc.data();

    if (!creator) {
      return null;
    }

    let recipients = [];

    // If event is for a community, notify all members
    if (communityId) {
      const communityDoc = await db.collection('communities').doc(communityId).get();
      const community = communityDoc.data();

      if (community && community.members) {
        recipients = community.members.filter((id) => id !== createdBy);
      }
    }

    if (recipients.length === 0) {
      return null;
    }

    const notification = {
      type: 'new_event',
      title: 'New Event',
      body: `${creator.displayName || 'Someone'} created "${title}"`,
      data: {
        eventId: context.params.eventId,
        createdBy,
        type: 'new_event',
      },
    };

    // Send notifications to all recipients
    const promises = recipients.flatMap((recipientId) => [
      sendPushNotification(recipientId, notification),
      createInAppNotification(recipientId, notification),
    ]);

    await Promise.all(promises);

    return null;
  });

/**
 * Trigger: Event reminder
 * Sends notification 1 hour before event starts
 */
exports.eventReminder = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async (context) => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // Query events starting in the next hour
    const eventsSnapshot = await db
      .collection('events')
      .where('dateTime', '>=', now)
      .where('dateTime', '<=', oneHourLater)
      .get();

    const promises = [];

    eventsSnapshot.forEach((doc) => {
      const event = doc.data();
      const { title, participants } = event;

      if (!participants || participants.length === 0) {
        return;
      }

      const notification = {
        type: 'event_reminder',
        title: 'Event Starting Soon',
        body: `"${title}" starts in less than 1 hour`,
        data: {
          eventId: doc.id,
          type: 'event_reminder',
        },
      };

      // Send to all participants
      participants.forEach((participantId) => {
        promises.push(sendPushNotification(participantId, notification));
        promises.push(createInAppNotification(participantId, notification));
      });
    });

    await Promise.all(promises);

    return null;
  });

/**
 * Trigger: New community invite
 * Sends notification when user is invited to a community
 */
exports.onCommunityInvite = functions.firestore
  .document('communities/{communityId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Find newly added members
    const beforeMembers = before.members || [];
    const afterMembers = after.members || [];
    const newMembers = afterMembers.filter((id) => !beforeMembers.includes(id));

    if (newMembers.length === 0) {
      return null;
    }

    const { name, createdBy } = after;

    // Get creator information
    const creatorDoc = await db.collection('users').doc(createdBy).get();
    const creator = creatorDoc.data();

    const notification = {
      type: 'community_invite',
      title: 'Community Invitation',
      body: `${creator?.displayName || 'Someone'} added you to "${name}"`,
      data: {
        communityId: context.params.communityId,
        type: 'community_invite',
      },
    };

    // Send notifications to new members
    const promises = newMembers.flatMap((memberId) => [
      sendPushNotification(memberId, notification),
      createInAppNotification(memberId, notification),
    ]);

    await Promise.all(promises);

    return null;
  });

/**
 * Trigger: New match found
 * Can be called manually when a new compatible user is found
 */
exports.notifyNewMatch = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { matchedUserId, score } = data;
  const currentUserId = context.auth.uid;

  // Get matched user information
  const matchedUserDoc = await db.collection('users').doc(matchedUserId).get();
  const matchedUser = matchedUserDoc.data();

  if (!matchedUser) {
    throw new functions.https.HttpsError('not-found', 'Matched user not found');
  }

  const notification = {
    type: 'new_match',
    title: 'New Match Found!',
    body: `You have a ${score}% match with ${matchedUser.displayName || 'someone'}`,
    data: {
      matchedUserId,
      score: score.toString(),
      type: 'new_match',
    },
  };

  await Promise.all([
    sendPushNotification(currentUserId, notification),
    createInAppNotification(currentUserId, notification),
  ]);

  return { success: true };
});

/**
 * Trigger: Cleanup old notifications
 * Runs daily to delete notifications older than 30 days
 */
exports.cleanupOldNotifications = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldNotifications = await db
      .collection('notifications')
      .where('createdAt', '<', thirtyDaysAgo)
      .get();

    const batch = db.batch();
    oldNotifications.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log(`Deleted ${oldNotifications.size} old notifications`);

    return null;
  });
