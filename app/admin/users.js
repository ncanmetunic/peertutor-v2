import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert, TextInput as RNTextInput } from 'react-native';
import {
  Text,
  Card,
  Avatar,
  Button,
  IconButton,
  Menu,
  Divider,
  Chip,
  ActivityIndicator,
  Searchbar,
  Dialog,
  Portal,
  TextInput,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../store/authStore';
import {
  getAllUsers,
  banUser,
  unbanUser,
  grantAdminRole,
  revokeAdminRole,
  isAdmin,
} from '../../services/adminService';
import { formatDistanceToNow } from 'date-fns';
import { COLORS } from '../../constants/theme';

export default function UserManagement() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [menuVisible, setMenuVisible] = useState(null);
  const [banDialogVisible, setBanDialogVisible] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, [user?.uid]);

  useEffect(() => {
    loadUsers();
  }, [currentPage, filterRole, searchQuery]);

  const checkAdminAccess = async () => {
    if (!user?.uid) {
      router.replace('/');
      return;
    }

    const adminStatus = await isAdmin(user.uid);
    if (!adminStatus) {
      Alert.alert('Access Denied', 'You do not have admin privileges.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await getAllUsers({
        page: currentPage,
        pageSize: 20,
        searchQuery,
        filterRole,
      });

      setUsers(result.users);
      setTotalPages(result.totalPages);
      setTotalUsers(result.totalUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for banning this user.');
      return;
    }

    setProcessing(true);
    try {
      await banUser(selectedUser.id, banReason);
      Alert.alert('Success', 'User has been banned successfully.');
      setBanDialogVisible(false);
      setBanReason('');
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error banning user:', error);
      Alert.alert('Error', 'Failed to ban user. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnbanUser = async (userId) => {
    Alert.alert(
      'Unban User',
      'Are you sure you want to unban this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unban',
          onPress: async () => {
            setProcessing(true);
            try {
              await unbanUser(userId);
              Alert.alert('Success', 'User has been unbanned successfully.');
              loadUsers();
            } catch (error) {
              console.error('Error unbanning user:', error);
              Alert.alert('Error', 'Failed to unban user.');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleGrantAdmin = async (userId) => {
    Alert.alert(
      'Grant Admin Role',
      'Are you sure you want to grant admin privileges to this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Grant',
          onPress: async () => {
            setProcessing(true);
            try {
              await grantAdminRole(userId);
              Alert.alert('Success', 'Admin role granted successfully.');
              loadUsers();
            } catch (error) {
              console.error('Error granting admin role:', error);
              Alert.alert('Error', 'Failed to grant admin role.');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleRevokeAdmin = async (userId) => {
    Alert.alert(
      'Revoke Admin Role',
      'Are you sure you want to revoke admin privileges from this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              await revokeAdminRole(userId);
              Alert.alert('Success', 'Admin role revoked successfully.');
              loadUsers();
            } catch (error) {
              console.error('Error revoking admin role:', error);
              Alert.alert('Error', 'Failed to revoke admin role.');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const getUserStatusColor = (status) => {
    switch (status) {
      case 'banned':
        return COLORS.error;
      case 'active':
        return COLORS.success;
      default:
        return COLORS.textSecondary;
    }
  };

  const renderUser = ({ item }) => {
    const isBanned = item.status === 'banned';
    const isUserAdmin = item.role === 'admin';
    const joinedAgo = item.createdAt
      ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true })
      : 'Unknown';

    return (
      <Card style={styles.userCard}>
        <Card.Content>
          <View style={styles.userHeader}>
            <Avatar.Image
              size={48}
              source={
                item.photoURL
                  ? { uri: item.photoURL }
                  : require('../../assets/default-avatar.png')
              }
              style={styles.avatar}
            />
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text variant="titleMedium" style={styles.userName}>
                  {item.displayName || 'Unknown User'}
                </Text>
                {isUserAdmin && (
                  <Chip
                    icon="shield-crown"
                    style={styles.adminChip}
                    textStyle={styles.adminChipText}
                  >
                    Admin
                  </Chip>
                )}
              </View>
              <Text variant="bodySmall" style={styles.userEmail}>
                {item.email}
              </Text>
              <View style={styles.userMeta}>
                <Chip
                  icon="circle"
                  style={[
                    styles.statusChip,
                    { backgroundColor: getUserStatusColor(item.status) },
                  ]}
                  textStyle={styles.statusChipText}
                >
                  {item.status || 'active'}
                </Chip>
                <Text variant="bodySmall" style={styles.joinedText}>
                  Joined {joinedAgo}
                </Text>
              </View>
            </View>
            <Menu
              visible={menuVisible === item.id}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setMenuVisible(item.id)}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  router.push(`/profile/${item.id}`);
                }}
                title="View Profile"
                leadingIcon="account"
              />
              <Divider />
              {!isBanned ? (
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    setSelectedUser(item);
                    setBanDialogVisible(true);
                  }}
                  title="Ban User"
                  leadingIcon="cancel"
                />
              ) : (
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    handleUnbanUser(item.id);
                  }}
                  title="Unban User"
                  leadingIcon="check-circle"
                />
              )}
              <Divider />
              {!isUserAdmin ? (
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    handleGrantAdmin(item.id);
                  }}
                  title="Grant Admin"
                  leadingIcon="shield-account"
                />
              ) : (
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    handleRevokeAdmin(item.id);
                  }}
                  title="Revoke Admin"
                  leadingIcon="shield-remove"
                  disabled={item.id === user?.uid}
                />
              )}
            </Menu>
          </View>

          {isBanned && item.banReason && (
            <View style={styles.banReasonContainer}>
              <Text variant="bodySmall" style={styles.banReasonLabel}>
                Ban Reason:
              </Text>
              <Text variant="bodySmall" style={styles.banReasonText}>
                {item.banReason}
              </Text>
            </View>
          )}

          {item.skills && item.skills.length > 0 && (
            <View style={styles.skillsContainer}>
              <Text variant="bodySmall" style={styles.skillsLabel}>
                Skills:
              </Text>
              <View style={styles.skillsChips}>
                {item.skills.slice(0, 3).map((skill, index) => (
                  <Chip key={index} style={styles.skillChip} compact>
                    {skill}
                  </Chip>
                ))}
                {item.skills.length > 3 && (
                  <Text variant="bodySmall" style={styles.moreSkills}>
                    +{item.skills.length - 3} more
                  </Text>
                )}
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Avatar.Icon size={80} icon="account-search" style={styles.emptyIcon} />
      <Text variant="titleLarge" style={styles.emptyTitle}>
        No Users Found
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        Try adjusting your search or filters.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <IconButton icon="arrow-left" onPress={() => router.back()} />
          <View style={styles.headerContent}>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              User Management
            </Text>
            <Text variant="bodyMedium" style={styles.headerSubtitle}>
              {totalUsers} total users
            </Text>
          </View>
        </View>

        <Searchbar
          placeholder="Search by name or email"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        <View style={styles.filters}>
          <Chip
            selected={filterRole === 'all'}
            onPress={() => setFilterRole('all')}
            style={styles.filterChip}
          >
            All
          </Chip>
          <Chip
            selected={filterRole === 'user'}
            onPress={() => setFilterRole('user')}
            style={styles.filterChip}
          >
            Users
          </Chip>
          <Chip
            selected={filterRole === 'admin'}
            onPress={() => setFilterRole('admin')}
            style={styles.filterChip}
          >
            Admins
          </Chip>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          <FlatList
            data={users}
            renderItem={renderUser}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              users.length === 0 && styles.emptyList,
            ]}
            ListEmptyComponent={renderEmpty}
          />

          {totalPages > 1 && (
            <View style={styles.pagination}>
              <Button
                mode="outlined"
                onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Text variant="bodyMedium" style={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </Text>
              <Button
                mode="outlined"
                onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </View>
          )}
        </>
      )}

      {/* Ban User Dialog */}
      <Portal>
        <Dialog
          visible={banDialogVisible}
          onDismiss={() => {
            setBanDialogVisible(false);
            setBanReason('');
            setSelectedUser(null);
          }}
        >
          <Dialog.Title>Ban User</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogText}>
              You are about to ban{' '}
              <Text style={styles.dialogUserName}>
                {selectedUser?.displayName || selectedUser?.email}
              </Text>
              . Please provide a reason:
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Enter reason for ban"
              value={banReason}
              onChangeText={setBanReason}
              multiline
              numberOfLines={3}
              style={styles.banReasonInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setBanDialogVisible(false);
                setBanReason('');
                setSelectedUser(null);
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onPress={handleBanUser}
              loading={processing}
              disabled={processing || !banReason.trim()}
              textColor={COLORS.error}
            >
              Ban User
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    backgroundColor: COLORS.white,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
  },
  searchBar: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  filterChip: {
    height: 32,
  },
  listContent: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  userCard: {
    marginBottom: 12,
    backgroundColor: COLORS.white,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontWeight: 'bold',
  },
  adminChip: {
    height: 24,
    backgroundColor: COLORS.warning,
  },
  adminChipText: {
    fontSize: 10,
    color: COLORS.white,
  },
  userEmail: {
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusChip: {
    height: 24,
  },
  statusChipText: {
    fontSize: 10,
    color: COLORS.white,
  },
  joinedText: {
    color: COLORS.textSecondary,
  },
  banReasonContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.errorLight,
    borderRadius: 8,
  },
  banReasonLabel: {
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: 4,
  },
  banReasonText: {
    color: COLORS.error,
  },
  skillsContainer: {
    marginTop: 12,
  },
  skillsLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  skillsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  skillChip: {
    height: 24,
    backgroundColor: COLORS.lightGray,
  },
  moreSkills: {
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  pageInfo: {
    fontWeight: '600',
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
  dialogText: {
    marginBottom: 16,
  },
  dialogUserName: {
    fontWeight: 'bold',
  },
  banReasonInput: {
    marginTop: 8,
  },
});
