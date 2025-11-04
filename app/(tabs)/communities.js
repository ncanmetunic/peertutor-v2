import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { FAB, Searchbar, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants';
import useAuthStore from '../../stores/authStore';
import {
  getAllCommunities,
  getUserCommunities,
  joinCommunity,
  leaveCommunity,
} from '../../services/communityService';

export default function Communities() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [communities, setCommunities] = useState([]);
  const [userCommunities, setUserCommunities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCommunities();
  }, [user]);

  const loadCommunities = async () => {
    setLoading(true);
    try {
      const [allCommunities, myCommunities] = await Promise.all([
        getAllCommunities(),
        getUserCommunities(user.uid),
      ]);
      setCommunities(allCommunities);
      setUserCommunities(myCommunities);
    } catch (error) {
      Alert.alert('Error', 'Failed to load communities');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (communityId) => {
    try {
      await joinCommunity(communityId, user.uid);
      await loadCommunities();
      Alert.alert('Success', 'You joined the community!');
    } catch (error) {
      Alert.alert('Error', 'Failed to join community');
    }
  };

  const handleLeave = async (communityId) => {
    Alert.alert(
      'Leave Community',
      'Are you sure you want to leave this community?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveCommunity(communityId, user.uid);
              await loadCommunities();
            } catch (error) {
              Alert.alert('Error', 'Failed to leave community');
            }
          },
        },
      ]
    );
  };

  const isMember = (communityId) => {
    return userCommunities.some(c => c.id === communityId);
  };

  const filteredCommunities = communities.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCommunity = ({ item }) => {
    const joined = isMember(item.id);

    return (
      <TouchableOpacity
        style={styles.communityCard}
        onPress={() => router.push(`/community/${item.id}`)}
      >
        <View style={styles.communityHeader}>
          <Text style={styles.communityIcon}>{item.icon}</Text>
          <View style={styles.communityInfo}>
            <Text style={styles.communityName}>{item.name}</Text>
            <Text style={styles.communityMembers}>
              {item.memberCount} {item.memberCount === 1 ? 'member' : 'members'}
            </Text>
          </View>
          {joined && <Chip compact textStyle={styles.joinedChipText}>Joined</Chip>}
        </View>

        {item.description && (
          <Text style={styles.communityDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {item.topic && (
          <Chip style={styles.topicChip} compact>
            {item.topic}
          </Chip>
        )}

        <View style={styles.communityActions}>
          {joined ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => router.push(`/community/${item.id}`)}
              >
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.leaveButton]}
                onPress={() => handleLeave(item.id)}
              >
                <Text style={styles.leaveButtonText}>Leave</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.joinButton]}
              onPress={() => handleJoin(item.id)}
            >
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search communities..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredCommunities}
        keyExtractor={(item) => item.id}
        renderItem={renderCommunity}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadCommunities}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No communities found</Text>
          </View>
        }
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => router.push('/community/create')}
        label="Create"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchbar: {
    margin: spacing.md,
    elevation: 2,
  },
  list: {
    padding: spacing.md,
  },
  communityCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  communityIcon: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    ...typography.h4,
    color: colors.text,
  },
  communityMembers: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  joinedChipText: {
    fontSize: 11,
  },
  communityDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  topicChip: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  communityActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: colors.primary,
  },
  joinButtonText: {
    ...typography.button,
    color: '#fff',
    fontSize: 14,
  },
  viewButton: {
    backgroundColor: colors.primary,
  },
  viewButtonText: {
    ...typography.button,
    color: '#fff',
    fontSize: 14,
  },
  leaveButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  leaveButtonText: {
    ...typography.button,
    color: colors.text,
    fontSize: 14,
  },
  empty: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.primary,
  },
});
