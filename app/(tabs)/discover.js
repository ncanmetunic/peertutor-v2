import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { Searchbar, FAB } from 'react-native-paper';
import { colors, spacing, typography } from '../../constants';
import useAuthStore from '../../stores/authStore';
import useUserStore from '../../stores/userStore';
import useConnectionStore from '../../stores/connectionStore';
import UserCard from '../../components/UserCard';

export default function Discover() {
  const { user } = useAuthStore();
  const { currentUserProfile, users, fetchAllUsers } = useUserStore();
  const { sendRequest, sentRequests, checkConnection } = useConnectionStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(u =>
        u.displayName?.toLowerCase().includes(query) ||
        u.bio?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      await fetchAllUsers();
    } catch (error) {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
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
        onRefresh={loadUsers}
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
});
