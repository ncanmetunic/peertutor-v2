import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Switch, Button, Divider, RadioButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../../constants';
import { VISIBILITY_OPTIONS, DEFAULT_PROFILE_VISIBILITY } from '../../constants/app';
import useAuthStore from '../../stores/authStore';
import useUserStore from '../../stores/userStore';
import { updateUserProfile } from '../../services/userService';

export default function PrivacySettings() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentUserProfile, setCurrentUserProfile } = useUserStore();

  const [settings, setSettings] = useState(
    currentUserProfile?.profileVisibility || DEFAULT_PROFILE_VISIBILITY
  );
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (currentUserProfile?.profileVisibility) {
      setSettings(currentUserProfile.profileVisibility);
    }
  }, [currentUserProfile]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUserProfile(user.uid, {
        profileVisibility: settings,
      });

      // Update local store
      setCurrentUserProfile({
        ...currentUserProfile,
        profileVisibility: settings,
      });

      setHasChanges(false);
      Alert.alert('Success', 'Privacy settings updated successfully');
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      Alert.alert('Error', 'Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const VisibilityOption = ({ title, settingKey, description }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{description}</Text>

      <RadioButton.Group
        onValueChange={(value) => handleSettingChange(settingKey, value)}
        value={settings[settingKey]}
      >
        <View style={styles.radioOption}>
          <RadioButton value={VISIBILITY_OPTIONS.PUBLIC} />
          <View style={styles.radioLabel}>
            <Text style={styles.radioTitle}>Public</Text>
            <Text style={styles.radioDescription}>Everyone can see this</Text>
          </View>
        </View>

        <View style={styles.radioOption}>
          <RadioButton value={VISIBILITY_OPTIONS.CONNECTIONS} />
          <View style={styles.radioLabel}>
            <Text style={styles.radioTitle}>Connections Only</Text>
            <Text style={styles.radioDescription}>Only your connections can see this</Text>
          </View>
        </View>

        <View style={styles.radioOption}>
          <RadioButton value={VISIBILITY_OPTIONS.PRIVATE} />
          <View style={styles.radioLabel}>
            <Text style={styles.radioTitle}>Private</Text>
            <Text style={styles.radioDescription}>Only you can see this</Text>
          </View>
        </View>
      </RadioButton.Group>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.header}>Privacy Settings</Text>
        <Text style={styles.subheader}>
          Control who can see your profile information
        </Text>

        {/* Show in Discover */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={styles.sectionTitle}>Show in Discover</Text>
              <Text style={styles.sectionDescription}>
                Allow others to find you in the discover feed
              </Text>
            </View>
            <Switch
              value={settings.showInDiscover}
              onValueChange={(value) => handleSettingChange('showInDiscover', value)}
            />
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Skills Visibility */}
        <VisibilityOption
          title="Skills Visibility"
          settingKey="showSkills"
          description="Who can see what you can teach"
        />

        <Divider style={styles.divider} />

        {/* Needs Visibility */}
        <VisibilityOption
          title="Learning Needs Visibility"
          settingKey="showNeeds"
          description="Who can see what you want to learn"
        />

        <Divider style={styles.divider} />

        {/* Bio Visibility */}
        <VisibilityOption
          title="Bio Visibility"
          settingKey="showBio"
          description="Who can see your profile bio"
        />

        <Divider style={styles.divider} />

        {/* Streak Visibility */}
        <VisibilityOption
          title="Streak Visibility"
          settingKey="showStreak"
          description="Who can see your learning streak"
        />

        <Divider style={styles.divider} />

        {/* Email Visibility */}
        <VisibilityOption
          title="Email Visibility"
          settingKey="showEmail"
          description="Who can see your email address"
        />

        {/* Save Button */}
        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={!hasChanges || loading}
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}
        >
          Save Changes
        </Button>

        <Button
          mode="text"
          onPress={() => router.back()}
          disabled={loading}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subheader: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flex: 1,
    marginRight: spacing.md,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  radioLabel: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  radioTitle: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  radioDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  divider: {
    marginVertical: spacing.lg,
  },
  saveButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
  },
  saveButtonContent: {
    paddingVertical: spacing.sm,
  },
  cancelButton: {
    marginTop: spacing.sm,
  },
});
