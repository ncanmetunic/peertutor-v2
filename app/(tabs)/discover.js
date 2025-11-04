import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../constants';

export default function Discover() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Discover Peers</Text>
      <Text style={styles.placeholder}>Browse and search for peers by topic</Text>
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
