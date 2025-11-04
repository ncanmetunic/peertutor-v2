import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../constants';

export default function Communities() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Communities</Text>
      <Text style={styles.placeholder}>Join subject-based communities</Text>
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
