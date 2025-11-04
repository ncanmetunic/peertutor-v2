import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { TextInput, IconButton, Avatar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { colors, spacing, typography } from '../../constants';
import useAuthStore from '../../stores/authStore';
import useChatStore from '../../stores/chatStore';
import { format } from 'date-fns';

export default function ChatScreen() {
  const router = useRouter();
  const { id: chatId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const {
    currentChat,
    messages,
    subscribeToMessages,
    sendMessage,
    markAsRead,
    clearCurrentChat,
  } = useChatStore();

  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (chatId) {
      const unsubscribe = subscribeToMessages(chatId);
      markAsRead(chatId, user.uid);

      return () => {
        unsubscribe();
        clearCurrentChat();
      };
    }
  }, [chatId]);

  const handleSend = async () => {
    if (!inputText.trim() && !sending) return;

    setSending(true);
    try {
      await sendMessage(chatId, user.uid, inputText.trim());
      setInputText('');
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setSending(true);
        try {
          const imageUri = result.assets[0].uri;
          const fileName = imageUri.split('/').pop() || 'image.jpg';
          await sendMessage(chatId, user.uid, '', imageUri, fileName, 'image');
        } catch (error) {
          Alert.alert('Error', 'Failed to send image');
        } finally {
          setSending(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setSending(true);
        try {
          const file = result.assets[0];
          await sendMessage(chatId, user.uid, '', file.uri, file.name, file.mimeType);
        } catch (error) {
          Alert.alert('Error', 'Failed to send file');
        } finally {
          setSending(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const renderMessage = ({ item, index }) => {
    const isMyMessage = item.senderId === user.uid;
    const showAvatar = index === 0 || messages[index - 1].senderId !== item.senderId;
    const messageTime = item.createdAt?.toDate();

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}
      >
        {!isMyMessage && showAvatar && (
          <Avatar.Image
            size={32}
            source={
              currentChat?.otherUser?.photoURL
                ? { uri: currentChat.otherUser.photoURL }
                : undefined
            }
            style={styles.avatar}
          />
        )}

        {!isMyMessage && !showAvatar && <View style={styles.avatarSpacer} />}

        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessage : styles.theirMessage,
          ]}
        >
          {item.fileURL && (
            <View style={styles.fileContainer}>
              {item.fileType?.startsWith('image') ? (
                <Image source={{ uri: item.fileURL }} style={styles.messageImage} />
              ) : (
                <View style={styles.filePreview}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    📎 {item.fileName}
                  </Text>
                </View>
              )}
            </View>
          )}

          {item.text && (
            <Text
              style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : styles.theirMessageText,
              ]}
            >
              {item.text}
            </Text>
          )}

          {messageTime && (
            <Text
              style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
              ]}
            >
              {format(messageTime, 'h:mm a')}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" iconColor="#fff" onPress={() => router.back()} />
        <View style={styles.headerInfo}>
          <Avatar.Image
            size={40}
            source={
              currentChat?.otherUser?.photoURL
                ? { uri: currentChat.otherUser.photoURL }
                : undefined
            }
          />
          <Text style={styles.headerTitle}>
            {currentChat?.otherUser?.displayName || 'Chat'}
          </Text>
        </View>
        <View style={{ width: 48 }} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <IconButton icon="attachment" onPress={handlePickFile} />
        <IconButton icon="image" onPress={handlePickImage} />

        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          style={styles.input}
          mode="outlined"
          multiline
          maxLength={1000}
        />

        <IconButton
          icon="send"
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
          iconColor={colors.primary}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.h4,
    color: '#fff',
  },
  messagesList: {
    padding: spacing.md,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  theirMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginRight: spacing.xs,
  },
  avatarSpacer: {
    width: 40,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: spacing.sm,
    borderRadius: 16,
  },
  myMessage: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    ...typography.body1,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: colors.text,
  },
  messageTime: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  theirMessageTime: {
    color: colors.textSecondary,
  },
  fileContainer: {
    marginBottom: spacing.xs,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  filePreview: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: spacing.sm,
    borderRadius: 8,
  },
  fileName: {
    ...typography.body2,
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: colors.background,
  },
});
