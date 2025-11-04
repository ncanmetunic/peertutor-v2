import { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Avatar, Button, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../../constants';
import useAuthStore from '../../stores/authStore';
import useConnectionStore from '../../stores/connectionStore';
import useChatStore from '../../stores/chatStore';

export default function Connections() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { connections, fetchConnections } = useConnectionStore();
  const { createOrGetChat } = useChatStore();

  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);

  const loadConnections = async () => {
    try {
      await fetchConnections(user.uid);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const handleChat = async (connection) => {
    try {
      const chat = await createOrGetChat(user.uid, connection.user.id);
      router.push(`/chat/${chat.id}`);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const renderConnection = ({ item }) => (
    <View style={styles.connectionItem}>
      <TouchableOpacity
        style={styles.connectionContent}
        onPress={() => handleChat(item)}
      >
        <Avatar.Image
          size={56}
          source={
            item.user?.photoURL
              ? { uri: item.user.photoURL }
              : undefined
          }
        />
        <View style={styles.connectionInfo}>
          <Text style={styles.connectionName}>{item.user?.displayName}</Text>
          {item.user?.bio && (
            <Text style={styles.connectionBio} numberOfLines={1}>
              {item.user.bio}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      <Button mode="contained" onPress={() => handleChat(item)} compact>
        Chat
      </Button>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Connections</Text>
        <Button mode="text" onPress={() => router.back()}>
          Close
        </Button>
      </View>

      <FlatList
        data={connections}
        keyExtractor={(item) => item.id}
        renderItem={renderConnection}
        ItemSeparatorComponent={() => <Divider />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No connections yet</Text>
            <Button
              mode="contained"
              onPress={() => router.push('/(tabs)/discover')}
              style={styles.discoverButton}
            >
              Discover Peers
            </Button>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    ...typography.h3,
    color: '#fff',
  },
  list: {
    padding: spacing.md,
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  connectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  connectionInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  connectionName: {
    ...typography.h4,
    color: colors.text,
  },
  connectionBio: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
    marginBottom: spacing.lg,
  },
  discoverButton: {
    marginTop: spacing.md,
  },
});
