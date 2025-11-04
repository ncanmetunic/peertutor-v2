import { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { Button, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../../constants';
import useAuthStore from '../../stores/authStore';
import useConnectionStore from '../../stores/connectionStore';
import UserCard from '../../components/UserCard';

export default function Requests() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    pendingRequests,
    sentRequests,
    fetchPendingRequests,
    acceptRequest,
    declineRequest,
  } = useConnectionStore();

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    try {
      await fetchPendingRequests(user.uid);
    } catch (error) {
      Alert.alert('Error', 'Failed to load requests');
    }
  };

  const handleAccept = async (request) => {
    try {
      await acceptRequest(request.id);
      Alert.alert('Success', `You are now connected with ${request.user.displayName}!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  const handleDecline = async (request) => {
    Alert.alert(
      'Decline Request',
      `Are you sure you want to decline the request from ${request.user.displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await declineRequest(request.id);
              Alert.alert('Success', 'Request declined');
            } catch (error) {
              Alert.alert('Error', 'Failed to decline request');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Connection Requests</Text>
        <Button mode="text" onPress={() => router.back()}>
          Close
        </Button>
      </View>

      <FlatList
        data={pendingRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.requestCard}>
            <UserCard
              user={item.user}
              showConnectButton={false}
            />
            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                onPress={() => handleAccept(item)}
                style={styles.acceptButton}
              >
                Accept
              </Button>
              <Button
                mode="outlined"
                onPress={() => handleDecline(item)}
                style={styles.declineButton}
              >
                Decline
              </Button>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No pending requests</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />

      {/* Sent Requests Section */}
      {sentRequests.length > 0 && (
        <View style={styles.sentSection}>
          <Text style={styles.sentTitle}>Sent Requests ({sentRequests.length})</Text>
          <Text style={styles.sentText}>
            Waiting for response...
          </Text>
        </View>
      )}
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
  requestCard: {
    marginBottom: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: colors.success,
  },
  declineButton: {
    flex: 1,
  },
  divider: {
    marginVertical: spacing.md,
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  sentSection: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  sentTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sentText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
});
