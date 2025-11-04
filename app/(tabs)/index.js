import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Button, Badge, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../../constants';
import useAuthStore from '../../stores/authStore';
import useUserStore from '../../stores/userStore';
import useConnectionStore from '../../stores/connectionStore';
import UserCard from '../../components/UserCard';
import { findMatches } from '../../utils/matchingAlgorithm';

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentUserProfile, fetchCurrentUserProfile, users, fetchAllUsers } = useUserStore();
  const { sendRequest, pendingRequests, fetchPendingRequests } = useConnectionStore();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCurrentUserProfile(user.uid),
        fetchAllUsers(),
        fetchPendingRequests(user.uid),
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Calculate matches when profile and users are loaded
    if (currentUserProfile && users.length > 0) {
      const topMatches = findMatches(currentUserProfile, users, 5);
      setMatches(topMatches);
    }
  }, [currentUserProfile, users]);

  const handleConnect = async (targetUser) => {
    try {
      await sendRequest(user.uid, targetUser.id);
      Alert.alert('Success', `Connection request sent to ${targetUser.displayName}!`);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleViewRequests = () => {
    router.push('/requests');
  };

  if (!currentUserProfile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  // Check if profile is incomplete
  const isProfileIncomplete = !currentUserProfile.skills || currentUserProfile.skills.length === 0 ||
    !currentUserProfile.needs || currentUserProfile.needs.length === 0;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Welcome back!</Text>
            <Text style={styles.subtitle}>{currentUserProfile.displayName}</Text>
          </View>
          <TouchableOpacity onPress={handleViewRequests}>
            <View>
              <IconButton icon="bell" iconColor="#fff" size={28} />
              {pendingRequests.length > 0 && (
                <Badge style={styles.badge}>{pendingRequests.length}</Badge>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile incomplete warning */}
      {isProfileIncomplete && (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Complete your profile</Text>
          <Text style={styles.warningText}>
            Add your skills and learning needs to get personalized match suggestions
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/profile/edit')}
            style={styles.warningButton}
          >
            Complete Profile
          </Button>
        </View>
      )}

      {/* Streak Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Streak 🔥</Text>
        <View style={styles.streakCard}>
          <Text style={styles.streakNumber}>{currentUserProfile.streak?.count || 0}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>
      </View>

      {/* Match Suggestions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Match Suggestions</Text>
        {matches.length > 0 ? (
          <>
            {matches.map((match) => (
              <UserCard
                key={match.id}
                user={match}
                onConnect={handleConnect}
                compatibilityScore={match.compatibilityScore}
              />
            ))}
            <Button
              mode="outlined"
              onPress={() => router.push('/(tabs)/discover')}
              style={styles.viewMoreButton}
            >
              Discover More Peers
            </Button>
          </>
        ) : (
          <Text style={styles.emptyText}>
            {isProfileIncomplete
              ? 'Complete your profile to see match suggestions'
              : 'No matches found. Try updating your skills and needs.'}
          </Text>
        )}
      </View>

      {/* Connection Requests */}
      {pendingRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Requests</Text>
          <Text style={styles.requestText}>
            You have {pendingRequests.length} pending connection request(s)
          </Text>
          <Button
            mode="contained"
            onPress={handleViewRequests}
            style={styles.viewRequestsButton}
          >
            View Requests
          </Button>
        </View>
      )}
    </ScrollView>
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
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    color: '#fff',
  },
  subtitle: {
    ...typography.body1,
    color: '#fff',
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.error,
  },
  warningCard: {
    backgroundColor: colors.warning,
    padding: spacing.md,
    margin: spacing.md,
    borderRadius: 8,
  },
  warningTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  warningText: {
    ...typography.body2,
    color: colors.text,
    marginBottom: spacing.md,
  },
  warningButton: {
    backgroundColor: colors.primary,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  streakCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.streakFire,
  },
  streakLabel: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  viewMoreButton: {
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.body2,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  requestText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  viewRequestsButton: {
    marginTop: spacing.sm,
  },
});
