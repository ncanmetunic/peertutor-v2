import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Avatar, Chip, Button } from 'react-native-paper';
import { colors, spacing, typography, borderRadius, shadows } from '../constants';
import { getSubjectById } from '../constants/subjects';

export default function UserCard({
  user,
  onPress,
  onConnect,
  showConnectButton = true,
  compatibilityScore = null,
}) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Avatar.Image
          size={60}
          source={
            user.photoURL
              ? { uri: user.photoURL }
              : undefined
          }
        />
        <View style={styles.info}>
          <Text style={styles.name}>{user.displayName}</Text>
          {compatibilityScore && (
            <Text style={styles.compatibility}>
              {compatibilityScore}% compatible
            </Text>
          )}
          {user.streak && user.streak.count > 0 && (
            <Text style={styles.streak}>🔥 {user.streak.count} day streak</Text>
          )}
        </View>
      </View>

      {user.bio && (
        <Text style={styles.bio} numberOfLines={2}>
          {user.bio}
        </Text>
      )}

      {/* Skills */}
      {user.skills && user.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Can teach:</Text>
          <View style={styles.chipContainer}>
            {user.skills.slice(0, 3).map((skillId) => {
              const subject = getSubjectById(skillId);
              return subject ? (
                <Chip key={skillId} style={styles.chip} textStyle={styles.chipText}>
                  {subject.label}
                </Chip>
              ) : null;
            })}
            {user.skills.length > 3 && (
              <Text style={styles.moreText}>+{user.skills.length - 3} more</Text>
            )}
          </View>
        </View>
      )}

      {/* Needs */}
      {user.needs && user.needs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Wants to learn:</Text>
          <View style={styles.chipContainer}>
            {user.needs.slice(0, 3).map((needId) => {
              const subject = getSubjectById(needId);
              return subject ? (
                <Chip key={needId} style={styles.chip} textStyle={styles.chipText}>
                  {subject.label}
                </Chip>
              ) : null;
            })}
            {user.needs.length > 3 && (
              <Text style={styles.moreText}>+{user.needs.length - 3} more</Text>
            )}
          </View>
        </View>
      )}

      {showConnectButton && onConnect && (
        <Button
          mode="contained"
          onPress={() => onConnect(user)}
          style={styles.connectButton}
        >
          Connect
        </Button>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  info: {
    marginLeft: spacing.md,
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    ...typography.h4,
    color: colors.text,
  },
  compatibility: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  streak: {
    ...typography.caption,
    color: colors.streakFire,
    marginTop: spacing.xs,
  },
  bio: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  section: {
    marginTop: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  chip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    height: 28,
  },
  chipText: {
    fontSize: 11,
  },
  moreText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  connectButton: {
    marginTop: spacing.md,
  },
});
