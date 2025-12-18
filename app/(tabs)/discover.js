import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { colors, spacing, typography } from '../../constants';
import useAuthStore from '../../stores/authStore';
import useConnectionStore from '../../stores/connectionStore';
import UserCard from '../../components/UserCard';
import { getAllUsers } from '../../services/userService';
import { debounce } from '../../utils/helpers';

export default function Discover() {
  const { user } = useAuthStore();
  const { sendRequest, sentRequests } = useConnectionStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search query with debouncing
    filterUsers();
  }, [searchQuery, users]);

  const filterUsers = useCallback(
    debounce(() => {
      if (searchQuery.trim() === '') {
        setFilteredUsers(users);
      } else {
        const query = searchQuery.toLowerCase();
        const filtered = users.filter(u =>
          u.displayName?.toLowerCase().includes(query) ||
          u.bio?.toLowerCase().includes(query) ||
          u.skills?.some(s => s.toLowerCase().includes(query)) ||
          u.needs?.some(n => n.toLowerCase().includes(query))
        );
        setFilteredUsers(filtered);
      }
    }, 300),
    [searchQuery, users]
  );

  const loadUsers = async (refresh = false) => {
    if (loading || (loadingMore && !refresh)) return;

    if (refresh) {
      setLoading(true);
      setLastDoc(null);
      setHasMore(true);
    }

    try {
      const result = await getAllUsers(20, refresh ? null : lastDoc);

      if (refresh) {
        setUsers(result.users);
      } else {
        setUsers(prev => [...prev, ...result.users]);
      }

      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreUsers = async () => {
    if (!hasMore || loadingMore || loading) return;

    setLoadingMore(true);
    await loadUsers(false);
  };

  const handleConnect = async (targetUser) => {
    try {
      // Check if already connected or request sent
      const alreadySent = sentRequests.some(r =>
        r.users.includes(targetUser.id)
      );

      if (alreadySent) {
        Alert.alert('Already sent', 'You have already sent a connection request to this user');
        return;
      }

      await sendRequest(user.uid, targetUser.id);
      Alert.alert('Success', `Connection request sent to ${targetUser.displayName}!`);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search peers..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            onConnect={handleConnect}
            showConnectButton={item.id !== user?.uid}
          />
        )}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={() => loadUsers(true)}
        onEndReached={loadMoreUsers}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.footerText}>Loading more...</Text>
            </View>
          ) : !hasMore && filteredUsers.length > 0 ? (
            <View style={styles.footerLoader}>
              <Text style={styles.footerText}>No more users to load</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {loading ? 'Loading users...' : 'No users found'}
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
  searchbar: {
    margin: spacing.md,
    elevation: 2,
  },
  list: {
    padding: spacing.md,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  emptyText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
