import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  Text,
  Switch,
  List,
  Divider,
  Button,
  ActivityIndicator,
} from 'react-native-paper';
import { useAuth } from '../../store/authStore';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { registerForPushNotifications } from '../../services/notificationService';
import { COLORS } from '../../constants/theme';

export default function NotificationSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    pushNotifications: true,
    connectionRequests: true,
    connectionAccepted: true,
    newMessages: true,
    eventReminders: true,
    eventUpdates: true,
    communityInvites: true,
    communityMessages: true,
    newMatches: true,
  });

  useEffect(() => {
    loadSettings();
  }, [user?.uid]);

  const loadSettings = async () => {
    if (!user?.uid) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      if (userData?.notificationSettings) {
        setSettings({
          ...settings,
          ...userData.notificationSettings,
        });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        notificationSettings: newSettings,
        updatedAt: new Date(),
      });
      setSettings(newSettings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      Alert.alert('Error', 'Failed to update settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    updateSettings(newSettings);
  };

  const handleEnablePushNotifications = async () => {
    try {
      const token = await registerForPushNotifications(user.uid);
      if (token) {
        const newSettings = { ...settings, pushNotifications: true };
        updateSettings(newSettings);
        Alert.alert('Success', 'Push notifications enabled successfully!');
      } else {
        Alert.alert(
          'Error',
          'Failed to enable push notifications. Please check your device settings.'
        );
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      Alert.alert('Error', 'Failed to enable push notifications.');
    }
  };

  const handleDisablePushNotifications = () => {
    Alert.alert(
      'Disable Push Notifications',
      'Are you sure you want to disable push notifications? You will not receive any notifications on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: () => {
            const newSettings = { ...settings, pushNotifications: false };
            updateSettings(newSettings);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Push Notifications
        </Text>
        <Text variant="bodyMedium" style={styles.sectionDescription}>
          Receive push notifications on your device
        </Text>

        <List.Item
          title="Enable Push Notifications"
          description={
            settings.pushNotifications
              ? 'Notifications are enabled'
              : 'Tap to enable push notifications'
          }
          left={(props) => (
            <List.Icon {...props} icon="bell" color={COLORS.primary} />
          )}
          right={() => (
            <Switch
              value={settings.pushNotifications}
              onValueChange={() => {
                if (settings.pushNotifications) {
                  handleDisablePushNotifications();
                } else {
                  handleEnablePushNotifications();
                }
              }}
              disabled={saving}
            />
          )}
          style={styles.listItem}
        />
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Connections
        </Text>
        <Text variant="bodyMedium" style={styles.sectionDescription}>
          Get notified about connection requests and updates
        </Text>

        <List.Item
          title="Connection Requests"
          description="When someone sends you a connection request"
          left={(props) => (
            <List.Icon {...props} icon="account-multiple-plus" />
          )}
          right={() => (
            <Switch
              value={settings.connectionRequests}
              onValueChange={() => handleToggle('connectionRequests')}
              disabled={!settings.pushNotifications || saving}
            />
          )}
          style={styles.listItem}
        />

        <List.Item
          title="Connection Accepted"
          description="When someone accepts your connection request"
          left={(props) => <List.Icon {...props} icon="account-check" />}
          right={() => (
            <Switch
              value={settings.connectionAccepted}
              onValueChange={() => handleToggle('connectionAccepted')}
              disabled={!settings.pushNotifications || saving}
            />
          )}
          style={styles.listItem}
        />

        <List.Item
          title="New Matches"
          description="When we find a highly compatible study partner"
          left={(props) => <List.Icon {...props} icon="star" />}
          right={() => (
            <Switch
              value={settings.newMatches}
              onValueChange={() => handleToggle('newMatches')}
              disabled={!settings.pushNotifications || saving}
            />
          )}
          style={styles.listItem}
        />
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Messages
        </Text>
        <Text variant="bodyMedium" style={styles.sectionDescription}>
          Stay updated with new messages
        </Text>

        <List.Item
          title="New Messages"
          description="When you receive a new message"
          left={(props) => <List.Icon {...props} icon="message" />}
          right={() => (
            <Switch
              value={settings.newMessages}
              onValueChange={() => handleToggle('newMessages')}
              disabled={!settings.pushNotifications || saving}
            />
          )}
          style={styles.listItem}
        />

        <List.Item
          title="Community Messages"
          description="When someone posts in your communities"
          left={(props) => <List.Icon {...props} icon="forum" />}
          right={() => (
            <Switch
              value={settings.communityMessages}
              onValueChange={() => handleToggle('communityMessages')}
              disabled={!settings.pushNotifications || saving}
            />
          )}
          style={styles.listItem}
        />
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Events
        </Text>
        <Text variant="bodyMedium" style={styles.sectionDescription}>
          Never miss an event
        </Text>

        <List.Item
          title="Event Reminders"
          description="Reminders before events you're attending"
          left={(props) => <List.Icon {...props} icon="bell-ring" />}
          right={() => (
            <Switch
              value={settings.eventReminders}
              onValueChange={() => handleToggle('eventReminders')}
              disabled={!settings.pushNotifications || saving}
            />
          )}
          style={styles.listItem}
        />

        <List.Item
          title="Event Updates"
          description="When event details change"
          left={(props) => <List.Icon {...props} icon="calendar-edit" />}
          right={() => (
            <Switch
              value={settings.eventUpdates}
              onValueChange={() => handleToggle('eventUpdates')}
              disabled={!settings.pushNotifications || saving}
            />
          )}
          style={styles.listItem}
        />
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Communities
        </Text>
        <Text variant="bodyMedium" style={styles.sectionDescription}>
          Community updates and invites
        </Text>

        <List.Item
          title="Community Invites"
          description="When you're invited to a community"
          left={(props) => <List.Icon {...props} icon="account-group" />}
          right={() => (
            <Switch
              value={settings.communityInvites}
              onValueChange={() => handleToggle('communityInvites')}
              disabled={!settings.pushNotifications || saving}
            />
          )}
          style={styles.listItem}
        />
      </View>

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          Note: Individual notification types can only be enabled when push
          notifications are enabled.
        </Text>
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionDescription: {
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  listItem: {
    paddingHorizontal: 0,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
  },
  footer: {
    padding: 16,
    marginTop: 16,
  },
  footerText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
