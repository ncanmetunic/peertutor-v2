import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  Avatar,
  IconButton,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../store/authStore';
import {
  isAdmin,
  getUserStatistics,
  getPlatformAnalytics,
  getRecentActivity,
} from '../../services/adminService';
import { COLORS } from '../../constants/theme';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    checkAdminAccess();
  }, [user?.uid]);

  useEffect(() => {
    if (hasAdminAccess) {
      loadDashboardData();
    }
  }, [hasAdminAccess]);

  const checkAdminAccess = async () => {
    if (!user?.uid) {
      router.replace('/');
      return;
    }

    try {
      const adminStatus = await isAdmin(user.uid);
      setHasAdminAccess(adminStatus);

      if (!adminStatus) {
        Alert.alert(
          'Access Denied',
          'You do not have permission to access the admin dashboard.',
          [{ text: 'OK', onPress: () => router.replace('/') }]
        );
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const [analyticsData, activityData] = await Promise.all([
        getPlatformAnalytics(),
        getRecentActivity({ limit: 10 }),
      ]);

      setAnalytics(analyticsData);
      setRecentActivity(activityData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!hasAdminAccess) {
    return (
      <View style={styles.errorContainer}>
        <Avatar.Icon size={80} icon="shield-alert" style={styles.errorIcon} />
        <Text variant="headlineSmall" style={styles.errorTitle}>
          Access Denied
        </Text>
        <Text variant="bodyMedium" style={styles.errorText}>
          You don't have permission to access this area.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Icon
          size={48}
          icon="shield-crown"
          style={styles.headerIcon}
        />
        <View style={styles.headerContent}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Admin Dashboard
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Manage your PeerTutor platform
          </Text>
        </View>
      </View>

      {/* User Statistics */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          User Statistics
        </Text>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Avatar.Icon
                size={40}
                icon="account-group"
                style={[styles.statIcon, { backgroundColor: COLORS.primary }]}
              />
              <Text variant="displaySmall" style={styles.statNumber}>
                {analytics?.users?.totalUsers || 0}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Total Users
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Avatar.Icon
                size={40}
                icon="account-check"
                style={[styles.statIcon, { backgroundColor: COLORS.success }]}
              />
              <Text variant="displaySmall" style={styles.statNumber}>
                {analytics?.users?.activeUsers || 0}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Active Users
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Avatar.Icon
                size={40}
                icon="shield-account"
                style={[styles.statIcon, { backgroundColor: COLORS.warning }]}
              />
              <Text variant="displaySmall" style={styles.statNumber}>
                {analytics?.users?.adminUsers || 0}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Admins
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Avatar.Icon
                size={40}
                icon="account-cancel"
                style={[styles.statIcon, { backgroundColor: COLORS.error }]}
              />
              <Text variant="displaySmall" style={styles.statNumber}>
                {analytics?.users?.bannedUsers || 0}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Banned Users
              </Text>
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* Content Statistics */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Content Overview
        </Text>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Avatar.Icon
                size={40}
                icon="account-group-outline"
                style={[styles.statIcon, { backgroundColor: '#6366F1' }]}
              />
              <Text variant="displaySmall" style={styles.statNumber}>
                {analytics?.content?.totalCommunities || 0}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Communities
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Avatar.Icon
                size={40}
                icon="calendar"
                style={[styles.statIcon, { backgroundColor: '#EC4899' }]}
              />
              <Text variant="displaySmall" style={styles.statNumber}>
                {analytics?.content?.totalEvents || 0}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Events
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Avatar.Icon
                size={40}
                icon="file-document"
                style={[styles.statIcon, { backgroundColor: '#8B5CF6' }]}
              />
              <Text variant="displaySmall" style={styles.statNumber}>
                {analytics?.content?.totalFiles || 0}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Files
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Avatar.Icon
                size={40}
                icon="alert-circle"
                style={[styles.statIcon, { backgroundColor: COLORS.error }]}
              />
              <Text variant="displaySmall" style={styles.statNumber}>
                {analytics?.content?.pendingReports || 0}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Pending Reports
              </Text>
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Quick Actions
        </Text>

        <View style={styles.actionsGrid}>
          <Card style={styles.actionCard} onPress={() => router.push('/admin/users')}>
            <Card.Content style={styles.actionContent}>
              <Avatar.Icon size={48} icon="account-multiple" />
              <Text variant="titleMedium" style={styles.actionTitle}>
                Manage Users
              </Text>
              <Text variant="bodySmall" style={styles.actionDescription}>
                View, edit, and manage user accounts
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.actionCard} onPress={() => router.push('/admin/reports')}>
            <Card.Content style={styles.actionContent}>
              <Avatar.Icon size={48} icon="flag" />
              <Text variant="titleMedium" style={styles.actionTitle}>
                Reports
              </Text>
              <Text variant="bodySmall" style={styles.actionDescription}>
                Review and handle user reports
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.actionCard} onPress={() => router.push('/admin/content')}>
            <Card.Content style={styles.actionContent}>
              <Avatar.Icon size={48} icon="folder-multiple" />
              <Text variant="titleMedium" style={styles.actionTitle}>
                Content Moderation
              </Text>
              <Text variant="bodySmall" style={styles.actionDescription}>
                Moderate communities and events
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.actionCard} onPress={() => router.push('/admin/analytics')}>
            <Card.Content style={styles.actionContent}>
              <Avatar.Icon size={48} icon="chart-line" />
              <Text variant="titleMedium" style={styles.actionTitle}>
                Analytics
              </Text>
              <Text variant="bodySmall" style={styles.actionDescription}>
                View detailed platform analytics
              </Text>
            </Card.Content>
          </Card>
        </View>
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    backgroundColor: COLORS.error,
    marginBottom: 16,
  },
  errorTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  errorText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.primary,
  },
  headerIcon: {
    backgroundColor: COLORS.white,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: COLORS.white,
    opacity: 0.9,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: COLORS.white,
    elevation: 2,
  },
  statIcon: {
    marginBottom: 12,
  },
  statNumber: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: COLORS.textSecondary,
  },
  actionsGrid: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: COLORS.white,
    elevation: 2,
  },
  actionContent: {
    alignItems: 'center',
    padding: 16,
  },
  actionTitle: {
    marginTop: 12,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  actionDescription: {
    textAlign: 'center',
    color: COLORS.textSecondary,
  },
});
