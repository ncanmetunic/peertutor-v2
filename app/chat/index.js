import { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Avatar, Badge } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../../constants';
import useAuthStore from '../../stores/authStore';
import useChatStore from '../../stores/chatStore';
import { formatDistanceToNow } from 'date-fns';

export default function ChatList() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { chats, subscribeToChats, cleanup } = useChatStore();

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToChats(user.uid);
      return () => {
        unsubscribe();
        cleanup();
      };
    }
  }, [user]);

  const handleChatPress = (chat) => {
    router.push(`/chat/${chat.id}`);
  };

  const renderChatItem = ({ item }) => {
    const unreadCount = item.unreadCount?.[user?.uid] || 0;
    const lastMessageTime = item.lastMessageTime?.toDate();

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleChatPress(item)}
      >
        <Avatar.Image
          size={56}
          source={
            item.otherUser?.photoURL
              ? { uri: item.otherUser.photoURL }
              : undefined
          }
        />

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {item.otherUser?.displayName || 'Unknown User'}
            </Text>
            {lastMessageTime && (
              <Text style={styles.chatTime}>
                {formatDistanceToNow(lastMessageTime, { addSuffix: true })}
              </Text>
            )}
          </View>

          <View style={styles.chatFooter}>
            <Text
              style={[
                styles.lastMessage,
                unreadCount > 0 && styles.unreadMessage,
              ]}
              numberOfLines={1}
            >
              {item.lastMessage || 'No messages yet'}
            </Text>
            {unreadCount > 0 && (
              <Badge style={styles.badge}>{unreadCount}</Badge>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>
              Connect with peers to start chatting
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  chatContent: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  chatName: {
    ...typography.h4,
    color: colors.text,
    flex: 1,
  },
  chatTime: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    ...typography.body2,
    color: colors.textSecondary,
    flex: 1,
  },
  unreadMessage: {
    color: colors.text,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    marginTop: spacing.xxl,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body2,
    color: colors.textLight,
  },
});
