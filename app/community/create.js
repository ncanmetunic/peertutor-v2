import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants';
import {
  COMMUNITY_ICONS,
  MAX_COMMUNITY_NAME_LENGTH,
  MAX_COMMUNITY_DESCRIPTION_LENGTH,
} from '../../constants/app';
import {
  validateCommunityName,
  validateDescription,
  sanitizeText,
} from '../../utils/validation';
import { subjects } from '../../constants/subjects';
import useAuthStore from '../../stores/authStore';
import { createCommunity } from '../../services/communityService';

export default function CreateCommunity() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(COMMUNITY_ICONS[0]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleCreate = async () => {
    // Validate inputs
    const nameValidation = validateCommunityName(name);
    const descValidation = validateDescription(description, MAX_COMMUNITY_DESCRIPTION_LENGTH);

    const newErrors = {};

    if (!nameValidation.valid) {
      newErrors.name = nameValidation.error;
    }

    if (!descValidation.valid) {
      newErrors.description = descValidation.error;
    }

    if (!selectedTopic) {
      newErrors.topic = 'Please select a topic';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const communityData = {
        name: sanitizeText(name),
        description: sanitizeText(description),
        topic: selectedTopic,
        icon: selectedIcon,
      };

      const communityId = await createCommunity(user.uid, communityData);

      Alert.alert('Success', 'Community created successfully!', [
        {
          text: 'OK',
          onPress: () => router.replace(`/community/${communityId}`),
        },
      ]);
    } catch (error) {
      console.error('Error creating community:', error);
      Alert.alert('Error', 'Failed to create community. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.header}>Create Community</Text>
        <Text style={styles.subheader}>
          Create a space for students to collaborate and learn together
        </Text>

        {/* Icon Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Community Icon</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.iconScroll}
          >
            {COMMUNITY_ICONS.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconOption,
                  selectedIcon === icon && styles.iconSelected,
                ]}
                onPress={() => setSelectedIcon(icon)}
              >
                <Text style={styles.iconText}>{icon}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Community Name */}
        <View style={styles.section}>
          <TextInput
            label="Community Name *"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) {
                setErrors({ ...errors, name: null });
              }
            }}
            mode="outlined"
            maxLength={MAX_COMMUNITY_NAME_LENGTH}
            error={!!errors.name}
            style={styles.input}
            placeholder="e.g., Calculus Study Group"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          <Text style={styles.helperText}>
            {name.length}/{MAX_COMMUNITY_NAME_LENGTH}
          </Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <TextInput
            label="Description (Optional)"
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (errors.description) {
                setErrors({ ...errors, description: null });
              }
            }}
            mode="outlined"
            multiline
            numberOfLines={4}
            maxLength={MAX_COMMUNITY_DESCRIPTION_LENGTH}
            error={!!errors.description}
            style={styles.input}
            placeholder="What is this community about?"
          />
          {errors.description && (
            <Text style={styles.errorText}>{errors.description}</Text>
          )}
          <Text style={styles.helperText}>
            {description.length}/{MAX_COMMUNITY_DESCRIPTION_LENGTH}
          </Text>
        </View>

        {/* Topic Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Topic *</Text>
          <ScrollView
            horizontal={false}
            style={styles.topicScroll}
            contentContainerStyle={styles.topicGrid}
          >
            {subjects.slice(0, 20).map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={[
                  styles.topicChip,
                  selectedTopic === subject.id && styles.topicChipSelected,
                ]}
                onPress={() => {
                  setSelectedTopic(subject.id);
                  if (errors.topic) {
                    setErrors({ ...errors, topic: null });
                  }
                }}
              >
                <Text
                  style={[
                    styles.topicText,
                    selectedTopic === subject.id && styles.topicTextSelected,
                  ]}
                >
                  {subject.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {errors.topic && <Text style={styles.errorText}>{errors.topic}</Text>}
        </View>

        {/* Create Button */}
        <Button
          mode="contained"
          onPress={handleCreate}
          loading={loading}
          disabled={loading}
          style={styles.createButton}
          contentStyle={styles.createButtonContent}
        >
          Create Community
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
    </KeyboardAvoidingView>
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
  label: {
    ...typography.subtitle1,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.card,
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  iconScroll: {
    maxHeight: 70,
  },
  iconOption: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.card,
  },
  iconSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight || '#E8E3F3',
  },
  iconText: {
    fontSize: 30,
  },
  topicScroll: {
    maxHeight: 300,
  },
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  topicChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    margin: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  topicChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  topicText: {
    ...typography.body2,
    color: colors.text,
  },
  topicTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  createButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
  },
  createButtonContent: {
    paddingVertical: spacing.sm,
  },
  cancelButton: {
    marginTop: spacing.sm,
  },
});
