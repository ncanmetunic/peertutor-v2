import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  Avatar,
  IconButton,
  Button,
  Menu,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../store/authStore';
import {
  subscribeToNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationIcon,
} from '../../services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { COLORS } from '../../constants/theme';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToNotifications(user.uid, (data) => {
      // Filter out deleted notifications
      const activeNotifications = data.filter((n) => !n.deleted);
      setNotifications(activeNotifications);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleNotificationPress = async (notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate based on type
    const { type, data } = notification;

    switch (type) {
      case 'new_message':
        if (data?.chatId) {
          router.push(`/chat/${data.chatId}`);
        }
        break;
      case 'connection_request':
      case 'connection_accepted':
        router.push('/connections');
        break;
      case 'new_event':
      case 'event_reminder':
        if (data?.eventId) {
          router.push(`/event-details/${data.eventId}`);
        }
        break;
      case 'community_invite':
        if (data?.communityId) {
          router.push(`/community-details/${data.communityId}`);
        }
        break;
      case 'new_match':
        if (data?.matchedUserId) {
          router.push(`/profile/${data.matchedUserId}`);
        }
        break;
      default:
        break;
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMenuVisible(false);
    try {
      await markAllAsRead(user.uid);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteAll = async () => {
    setMenuVisible(false);
    try {
      await deleteAllNotifications(user.uid);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    // The subscription will automatically update the data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderNotification = ({ item }) => {
    const icon = getNotificationIcon(item.type);
    const timeAgo = item.createdAt
      ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true })
      : '';

    return (
      <Card
        style={[
          styles.notificationCard,
          !item.read && styles.unreadNotification,
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <Card.Content style={styles.cardContent}>
          <Avatar.Icon
            size={48}
            icon={icon}
            style={[
              styles.icon,
              { backgroundColor: item.read ? COLORS.lightGray : COLORS.primary },
            ]}
          />
          <View style={styles.contentContainer}>
            <Text
              variant="titleMedium"
              style={[styles.title, !item.read && styles.unreadText]}
            >
              {item.title}
            </Text>
            <Text
              variant="bodyMedium"
              style={styles.body}
              numberOfLines={2}
            >
              {item.body}
            </Text>
            <Text variant="bodySmall" style={styles.time}>
              {timeAgo}
            </Text>
          </View>
          <IconButton
            icon="close"
            size={20}
            onPress={() => handleDeleteNotification(item.id)}
            style={styles.deleteButton}
          />
        </Card.Content>
        {!item.read && <View style={styles.unreadIndicator} />}
      </Card>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Avatar.Icon size={80} icon="bell-outline" style={styles.emptyIcon} />
      <Text variant="titleLarge" style={styles.emptyTitle}>
        No Notifications
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        You're all caught up! We'll notify you when something new happens.
      </Text>
    </View>
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Notifications
        </Text>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={handleMarkAllAsRead}
            title="Mark all as read"
            leadingIcon="check-all"
            disabled={unreadCount === 0}
          />
          <Divider />
          <Menu.Item
            onPress={handleDeleteAll}
            title="Clear all"
            leadingIcon="delete"
            disabled={notifications.length === 0}
          />
        </Menu>
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text variant="bodyMedium" style={styles.unreadBannerText}>
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
          <Button
            mode="text"
            onPress={handleMarkAllAsRead}
            compact
            textColor={COLORS.primary}
          >
            Mark all as read
          </Button>
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  unreadBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.lightPrimary,
  },
  unreadBannerText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  notificationCard: {
    marginBottom: 12,
    backgroundColor: COLORS.white,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  icon: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  body: {
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  time: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  deleteButton: {
    margin: 0,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    backgroundColor: COLORS.lightGray,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
  },
});
