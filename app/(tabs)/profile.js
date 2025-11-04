import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../constants';

export default function Profile() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Profile</Text>
      <Text style={styles.placeholder}>Manage your profile, skills, and needs</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
  placeholder: {
    ...typography.body1,
    color: colors.textSecondary,
  },
});
