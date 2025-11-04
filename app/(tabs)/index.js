import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../../constants';

export default function Dashboard() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to PeerTutor</Text>
        <Text style={styles.subtitle}>Your learning journey starts here</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Streak</Text>
        <Text style={styles.placeholder}>Streak component will go here</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Match Suggestions</Text>
        <Text style={styles.placeholder}>Match suggestions will go here</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        <Text style={styles.placeholder}>Events will go here</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Text style={styles.placeholder}>Activity feed will go here</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.primary,
  },
  title: {
    ...typography.h1,
    color: '#fff',
  },
  subtitle: {
    ...typography.body1,
    color: '#fff',
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  section: {
    padding: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  placeholder: {
    ...typography.body2,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
