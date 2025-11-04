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
import { TextInput, Button, Switch, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../../constants';
import {
  MAX_EVENT_TITLE_LENGTH,
  MAX_EVENT_DESCRIPTION_LENGTH,
  MAX_EVENT_LOCATION_LENGTH,
  DEFAULT_EVENT_PARTICIPANTS,
  MIN_EVENT_PARTICIPANTS,
  MAX_EVENT_PARTICIPANTS,
} from '../../constants/app';
import {
  validateEventTitle,
  validateDescription,
  validateTextLength,
  validateNumberRange,
  validateFutureDate,
  sanitizeText,
} from '../../utils/validation';
import { subjects } from '../../constants/subjects';
import useAuthStore from '../../stores/authStore';
import useUserStore from '../../stores/userStore';
import { createEvent } from '../../services/eventService';

export default function CreateEvent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentUserProfile } = useUserStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('60'); // minutes
  const [maxParticipants, setMaxParticipants] = useState(DEFAULT_EVENT_PARTICIPANTS.toString());
  const [isOnline, setIsOnline] = useState(true);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleCreate = async () => {
    // Validate inputs
    const titleValidation = validateEventTitle(title);
    const descValidation = validateDescription(description, MAX_EVENT_DESCRIPTION_LENGTH);
    const maxParticipantsValidation = validateNumberRange(
      maxParticipants,
      MIN_EVENT_PARTICIPANTS,
      MAX_EVENT_PARTICIPANTS,
      'Max participants'
    );

    const newErrors = {};

    if (!titleValidation.valid) {
      newErrors.title = titleValidation.error;
    }

    if (!descValidation.valid) {
      newErrors.description = descValidation.error;
    }

    if (!selectedTopic) {
      newErrors.topic = 'Please select a topic';
    }

    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!maxParticipantsValidation.valid) {
      newErrors.maxParticipants = maxParticipantsValidation.error;
    }

    if (!isOnline && !location.trim()) {
      newErrors.location = 'Location is required for in-person events';
    }

    // Validate date format and future date
    if (startDate && startTime) {
      try {
        const dateTimeStr = `${startDate} ${startTime}`;
        const eventDateTime = new Date(dateTimeStr);

        if (isNaN(eventDateTime.getTime())) {
          newErrors.startDate = 'Invalid date/time format';
        } else {
          const dateValidation = validateFutureDate(eventDateTime);
          if (!dateValidation.valid) {
            newErrors.startDate = dateValidation.error;
          }
        }
      } catch (error) {
        newErrors.startDate = 'Invalid date/time';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const startDateTime = new Date(`${startDate} ${startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + parseInt(duration) * 60000);

      const eventData = {
        title: sanitizeText(title),
        description: sanitizeText(description),
        topic: selectedTopic,
        creatorName: currentUserProfile.displayName,
        startTime: startDateTime,
        endTime: endDateTime,
        maxParticipants: parseInt(maxParticipants),
        isOnline,
        ...((!isOnline && location.trim()) && { location: sanitizeText(location) }),
      };

      const eventId = await createEvent(user.uid, eventData);

      Alert.alert('Success', 'Event created successfully!', [
        {
          text: 'OK',
          onPress: () => router.replace(`/event/${eventId}`),
        },
      ]);
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
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
        <Text style={styles.header}>Create Event</Text>
        <Text style={styles.subheader}>
          Organize a study session, workshop, or group learning event
        </Text>

        {/* Event Title */}
        <View style={styles.section}>
          <TextInput
            label="Event Title *"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (errors.title) setErrors({ ...errors, title: null });
            }}
            mode="outlined"
            maxLength={MAX_EVENT_TITLE_LENGTH}
            error={!!errors.title}
            style={styles.input}
            placeholder="e.g., Calculus Study Session"
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <TextInput
            label="Description"
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (errors.description) setErrors({ ...errors, description: null });
            }}
            mode="outlined"
            multiline
            numberOfLines={4}
            maxLength={MAX_EVENT_DESCRIPTION_LENGTH}
            error={!!errors.description}
            style={styles.input}
            placeholder="What will you cover in this event?"
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
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
                  if (errors.topic) setErrors({ ...errors, topic: null });
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

        {/* Date and Time */}
        <View style={styles.section}>
          <Text style={styles.label}>Date & Time *</Text>
          <View style={styles.dateTimeRow}>
            <TextInput
              label="Date (YYYY-MM-DD)"
              value={startDate}
              onChangeText={(text) => {
                setStartDate(text);
                if (errors.startDate) setErrors({ ...errors, startDate: null });
              }}
              mode="outlined"
              error={!!errors.startDate}
              style={[styles.input, styles.dateInput]}
              placeholder="2025-11-05"
            />
            <TextInput
              label="Time (HH:MM)"
              value={startTime}
              onChangeText={(text) => {
                setStartTime(text);
                if (errors.startTime) setErrors({ ...errors, startTime: null });
              }}
              mode="outlined"
              error={!!errors.startTime}
              style={[styles.input, styles.timeInput]}
              placeholder="14:00"
            />
          </View>
          {errors.startDate && <Text style={styles.errorText}>{errors.startDate}</Text>}
          {errors.startTime && <Text style={styles.errorText}>{errors.startTime}</Text>}
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <TextInput
            label="Duration (minutes)"
            value={duration}
            onChangeText={setDuration}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        {/* Max Participants */}
        <View style={styles.section}>
          <TextInput
            label="Max Participants *"
            value={maxParticipants}
            onChangeText={(text) => {
              setMaxParticipants(text);
              if (errors.maxParticipants) setErrors({ ...errors, maxParticipants: null });
            }}
            mode="outlined"
            keyboardType="numeric"
            error={!!errors.maxParticipants}
            style={styles.input}
          />
          {errors.maxParticipants && (
            <Text style={styles.errorText}>{errors.maxParticipants}</Text>
          )}
        </View>

        {/* Online/In-Person Toggle */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Online Event</Text>
            <Switch value={isOnline} onValueChange={setIsOnline} />
          </View>
        </View>

        {/* Location (if in-person) */}
        {!isOnline && (
          <View style={styles.section}>
            <TextInput
              label="Location *"
              value={location}
              onChangeText={(text) => {
                setLocation(text);
                if (errors.location) setErrors({ ...errors, location: null });
              }}
              mode="outlined"
              maxLength={MAX_EVENT_LOCATION_LENGTH}
              error={!!errors.location}
              style={styles.input}
              placeholder="e.g., Library Room 301"
            />
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
          </View>
        )}

        {/* Create Button */}
        <Button
          mode="contained"
          onPress={handleCreate}
          loading={loading}
          disabled={loading}
          style={styles.createButton}
          contentStyle={styles.createButtonContent}
        >
          Create Event
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
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  topicScroll: {
    maxHeight: 250,
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
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateInput: {
    flex: 2,
  },
  timeInput: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
