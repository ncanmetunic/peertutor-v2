import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Avatar, Button, Chip, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../../constants';
import useAuthStore from '../../stores/authStore';
import useUserStore from '../../stores/userStore';
import { getSubjectById } from '../../constants/subjects';

export default function Profile() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { currentUserProfile, fetchCurrentUserProfile } = useUserStore();

  useEffect(() => {
    if (user) {
      fetchCurrentUserProfile(user.uid);
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  if (!currentUserProfile) {
    return (
      <View style={styles.container}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Avatar.Image
          size={100}
          source={
            currentUserProfile.photoURL
              ? { uri: currentUserProfile.photoURL }
              : require('../../assets/icon.png')
          }
        />
        <Text style={styles.name}>{currentUserProfile.displayName}</Text>
        <Text style={styles.email}>{currentUserProfile.email}</Text>

        <Button
          mode="contained"
          onPress={() => router.push('/profile/edit')}
          style={styles.editButton}
        >
          Edit Profile
        </Button>
      </View>

      {/* Bio */}
      {currentUserProfile.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{currentUserProfile.bio}</Text>
        </View>
      )}

      <Divider />

      {/* Skills */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>I can teach</Text>
        {currentUserProfile.skills && currentUserProfile.skills.length > 0 ? (
          <View style={styles.chipContainer}>
            {currentUserProfile.skills.map((skillId) => {
              const subject = getSubjectById(skillId);
              return subject ? (
                <Chip key={skillId} style={styles.chip}>
                  {subject.label}
                </Chip>
              ) : null;
            })}
          </View>
        ) : (
          <Text style={styles.emptyText}>No skills added yet</Text>
        )}
      </View>

      <Divider />

      {/* Needs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>I want to learn</Text>
        {currentUserProfile.needs && currentUserProfile.needs.length > 0 ? (
          <View style={styles.chipContainer}>
            {currentUserProfile.needs.map((needId) => {
              const subject = getSubjectById(needId);
              return subject ? (
                <Chip key={needId} style={styles.chip}>
                  {subject.label}
                </Chip>
              ) : null;
            })}
          </View>
        ) : (
          <Text style={styles.emptyText}>No learning needs added yet</Text>
        )}
      </View>

      <Divider />

      {/* Streak */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Streak</Text>
        <Text style={styles.streakText}>
          🔥 {currentUserProfile.streak?.count || 0} days
        </Text>
      </View>

      <Divider />

      {/* Sign Out Button */}
      <Button
        mode="outlined"
        onPress={handleSignOut}
        style={styles.signOutButton}
      >
        Sign Out
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  name: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.md,
  },
  email: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  editButton: {
    marginTop: spacing.md,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  bio: {
    ...typography.body1,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  chip: {
    margin: spacing.xs,
  },
  emptyText: {
    ...typography.body2,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  streakText: {
    ...typography.h3,
    color: colors.streakFire,
  },
  signOutButton: {
    margin: spacing.md,
    marginBottom: spacing.xl,
  },
});
