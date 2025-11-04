import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { TextInput, Button, Chip, FAB, Dialog, Portal } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants';
import {
  MAX_CHANNEL_NAME_LENGTH,
  MIN_CHANNEL_NAME_LENGTH,
  MAX_MESSAGE_LENGTH,
  MESSAGE_BATCH_SIZE,
} from '../../constants/app';
import { validateTextLength, sanitizeText } from '../../utils/validation';
import useAuthStore from '../../stores/authStore';
import {
  getCommunity,
  getCommunityChannels,
  createChannel,
  getChannelMessages,
  sendChannelMessage,
  joinCommunity,
  leaveCommunity,
} from '../../services/communityService';
import { getUserById } from '../../services/userService';

export default function CommunityDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const flatListRef = useRef(null);

  const [community, setCommunity] = useState(null);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showChannelDialog, setShowChannelDialog] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [userCache, setUserCache] = useState({});

  useEffect(() => {
    loadCommunity();
    loadChannels();
  }, [id]);

  useEffect(() => {
    if (selectedChannel) {
      loadMessages();
    }
  }, [selectedChannel]);

  const loadCommunity = async () => {
    try {
      const data = await getCommunity(id);
      setCommunity(data);
    } catch (error) {
      console.error('Error loading community:', error);
      Alert.alert('Error', 'Failed to load community');
    }
  };

  const loadChannels = async () => {
    setLoading(true);
    try {
      const data = await getCommunityChannels(id);
      setChannels(data);

      // Auto-select first channel (usually "general")
      if (data.length > 0 && !selectedChannel) {
        setSelectedChannel(data[0]);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
      Alert.alert('Error', 'Failed to load channels');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedChannel) return;

    try {
      const data = await getChannelMessages(id, selectedChannel.id, MESSAGE_BATCH_SIZE);
      setMessages(data);

      // Load user data for messages
      const userIds = [...new Set(data.map(m => m.userId))];
      const newUserCache = { ...userCache };

      for (const userId of userIds) {
        if (!newUserCache[userId]) {
          try {
            const userData = await getUserById(userId);
            newUserCache[userId] = userData;
          } catch (error) {
            console.error('Error loading user:', error);
          }
        }
      }

      setUserCache(newUserCache);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChannel) return;

    setSending(true);
    try {
      await sendChannelMessage(id, selectedChannel.id, user.uid, sanitizeText(messageText));
      setMessageText('');
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleCreateChannel = async () => {
    const validation = validateTextLength(
      newChannelName,
      MIN_CHANNEL_NAME_LENGTH,
      MAX_CHANNEL_NAME_LENGTH,
      'Channel name'
    );

    if (!validation.valid) {
      Alert.alert('Validation Error', validation.error);
      return;
    }

    try {
      await createChannel(id, sanitizeText(newChannelName), sanitizeText(newChannelDesc));
      setShowChannelDialog(false);
      setNewChannelName('');
      setNewChannelDesc('');
      await loadChannels();
      Alert.alert('Success', 'Channel created successfully!');
    } catch (error) {
      console.error('Error creating channel:', error);
      Alert.alert('Error', 'Failed to create channel');
    }
  };

  const handleJoinLeave = async () => {
    const isMember = community?.members?.includes(user.uid);

    if (isMember) {
      Alert.alert('Leave Community', 'Are you sure you want to leave this community?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveCommunity(id, user.uid);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to leave community');
            }
          },
        },
      ]);
    } else {
      try {
        await joinCommunity(id, user.uid);
        await loadCommunity();
        Alert.alert('Success', 'You joined the community!');
      } catch (error) {
        Alert.alert('Error', 'Failed to join community');
      }
    }
  };

  const renderMessage = ({ item }) => {
    const sender = userCache[item.userId];
    const isOwn = item.userId === user.uid;
    const timestamp = item.createdAt?.toDate();

    return (
      <View style={[styles.messageContainer, isOwn && styles.ownMessage]}>
        {!isOwn && (
          <Text style={styles.senderName}>
            {sender?.displayName || 'Unknown User'}
          </Text>
        )}
        <View style={[styles.messageBubble, isOwn && styles.ownMessageBubble]}>
          <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
            {item.text}
          </Text>
        </View>
        {timestamp && (
          <Text style={styles.messageTime}>
            {format(timestamp, 'h:mm a')}
          </Text>
        )}
      </View>
    );
  };

  if (!community) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const isMember = community.members?.includes(user.uid);
  const isCreator = community.createdBy === user.uid;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Community Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.communityIcon}>{community.icon}</Text>
          <View style={styles.headerInfo}>
            <Text style={styles.communityName}>{community.name}</Text>
            <Text style={styles.memberCount}>
              {community.memberCount} {community.memberCount === 1 ? 'member' : 'members'}
            </Text>
          </View>
          {!isMember && (
            <Button
              mode="contained"
              onPress={handleJoinLeave}
              style={styles.joinButton}
              compact
            >
              Join
            </Button>
          )}
        </View>
        {community.description && (
          <Text style={styles.description}>{community.description}</Text>
        )}

        {/* Channels */}
        <FlatList
          horizontal
          data={channels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Chip
              selected={selectedChannel?.id === item.id}
              onPress={() => setSelectedChannel(item)}
              style={styles.channelChip}
            >
              # {item.name}
            </Chip>
          )}
          contentContainerStyle={styles.channelList}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Messages Area */}
      {isMember && selectedChannel ? (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>Be the first to send a message!</Text>
              </View>
            }
          />

          {/* Message Input */}
          <View style={styles.inputContainer}>
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder={`Message #${selectedChannel.name}`}
              mode="outlined"
              style={styles.messageInput}
              maxLength={MAX_MESSAGE_LENGTH}
              multiline
              disabled={sending}
            />
            <Button
              mode="contained"
              onPress={handleSendMessage}
              disabled={!messageText.trim() || sending}
              loading={sending}
              style={styles.sendButton}
            >
              Send
            </Button>
          </View>
        </>
      ) : (
        <View style={styles.joinPrompt}>
          <Text style={styles.joinPromptText}>
            Join this community to view and send messages
          </Text>
          <Button mode="contained" onPress={handleJoinLeave} style={styles.joinPromptButton}>
            Join Community
          </Button>
        </View>
      )}

      {/* Create Channel FAB (only for members) */}
      {isMember && isCreator && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => setShowChannelDialog(true)}
          label="Channel"
        />
      )}

      {/* Create Channel Dialog */}
      <Portal>
        <Dialog visible={showChannelDialog} onDismiss={() => setShowChannelDialog(false)}>
          <Dialog.Title>Create Channel</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Channel Name"
              value={newChannelName}
              onChangeText={setNewChannelName}
              mode="outlined"
              maxLength={MAX_CHANNEL_NAME_LENGTH}
              placeholder="e.g., homework-help"
              style={styles.dialogInput}
            />
            <TextInput
              label="Description (Optional)"
              value={newChannelDesc}
              onChangeText={setNewChannelDesc}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowChannelDialog(false)}>Cancel</Button>
            <Button onPress={handleCreateChannel}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  communityIcon: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  communityName: {
    ...typography.h3,
    color: colors.text,
  },
  memberCount: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  joinButton: {
    backgroundColor: colors.primary,
  },
  description: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  channelList: {
    paddingTop: spacing.sm,
  },
  channelChip: {
    marginRight: spacing.sm,
  },
  messagesList: {
    padding: spacing.md,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  senderName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginLeft: spacing.sm,
  },
  messageBubble: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    maxWidth: '75%',
  },
  ownMessageBubble: {
    backgroundColor: colors.primary,
  },
  messageText: {
    ...typography.body1,
    color: colors.text,
  },
  ownMessageText: {
    color: '#fff',
  },
  messageTime: {
    ...typography.caption,
    color: colors.textLight,
    marginTop: spacing.xs,
    marginHorizontal: spacing.sm,
  },
  emptyMessages: {
    alignItems: 'center',
    padding: spacing.xxl,
    marginTop: spacing.xxl,
  },
  emptyText: {
    ...typography.h4,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body2,
    color: colors.textLight,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  messageInput: {
    flex: 1,
    backgroundColor: colors.background,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.primary,
  },
  joinPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  joinPromptText: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  joinPromptButton: {
    backgroundColor: colors.primary,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.primary,
  },
  dialogInput: {
    marginBottom: spacing.md,
  },
});
