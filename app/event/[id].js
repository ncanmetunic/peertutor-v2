import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Button, Chip, Avatar, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants';
import useAuthStore from '../../stores/authStore';
import {
  getEvent,
  joinEvent,
  leaveEvent,
  cancelEvent,
  deleteEvent,
} from '../../services/eventService';
import { getUserById } from '../../services/userService';

export default function EventDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const eventData = await getEvent(id);
      setEvent(eventData);

      // Load participant profiles
      if (eventData?.participants) {
        const participantProfiles = await Promise.all(
          eventData.participants.map(async (uid) => {
            try {
              return await getUserById(uid);
            } catch (error) {
              return null;
            }
          })
        );
        setParticipants(participantProfiles.filter(p => p !== null));
      }
    } catch (error) {
      console.error('Error loading event:', error);
      Alert.alert('Error', 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      await joinEvent(id, user.uid);
      await loadEvent();
      Alert.alert('Success', 'You joined the event!');
    } catch (error) {
      console.error('Error joining event:', error);
      Alert.alert('Error', error.message || 'Failed to join event');
    }
  };

  const handleLeave = async () => {
    Alert.alert(
      'Leave Event',
      'Are you sure you want to leave this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveEvent(id, user.uid);
              await loadEvent();
            } catch (error) {
              Alert.alert('Error', 'Failed to leave event');
            }
          },
        },
      ]
    );
  };

  const handleCancel = async () => {
    Alert.alert(
      'Cancel Event',
      'Are you sure you want to cancel this event? All participants will be notified.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelEvent(id);
              await loadEvent();
              Alert.alert('Success', 'Event has been cancelled');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel event');
            }
          },
        },
      ]
    );
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to permanently delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const startTime = event.startTime?.toDate();
  const endTime = event.endTime?.toDate();
  const isCreator = event.createdBy === user.uid;
  const isParticipant = event.participants?.includes(user.uid);
  const isFull = event.maxParticipants && event.participants.length >= event.maxParticipants;
  const isCancelled = event.status === 'cancelled';
  const isPast = startTime && startTime < new Date();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Event Header */}
      <View style={styles.header}>
        {isCancelled && (
          <Chip
            icon="cancel"
            style={styles.cancelledChip}
            textStyle={styles.cancelledChipText}
          >
            CANCELLED
          </Chip>
        )}
        {isPast && !isCancelled && (
          <Chip style={styles.pastChip} textStyle={styles.pastChipText}>
            PAST EVENT
          </Chip>
        )}
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.creator}>Organized by {event.creatorName}</Text>

        {event.topic && (
          <Chip style={styles.topicChip} compact>
            {event.topic}
          </Chip>
        )}
      </View>

      {/* Event Details */}
      <View style={styles.section}>
        <View style={styles.detailRow}>
          <Text style={styles.icon}>📅</Text>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailText}>
              {startTime && format(startTime, 'MMM d, yyyy • h:mm a')}
            </Text>
            {endTime && (
              <Text style={styles.detailTextSecondary}>
                Ends at {format(endTime, 'h:mm a')}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.icon}>{event.isOnline ? '💻' : '📍'}</Text>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>
              {event.isOnline ? 'Online Event' : 'Location'}
            </Text>
            <Text style={styles.detailText}>
              {event.isOnline ? 'Virtual Meeting' : event.location || 'TBD'}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.icon}>👥</Text>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Participants</Text>
            <Text style={styles.detailText}>
              {event.participants.length}
              {event.maxParticipants && ` / ${event.maxParticipants}`}
              {isFull && ' (Full)'}
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      {event.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>
      )}

      <Divider style={styles.divider} />

      {/* Participants List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Participants ({participants.length})
        </Text>
        {participants.map((participant) => (
          <View key={participant.id} style={styles.participantCard}>
            {participant.photoURL ? (
              <Avatar.Image size={40} source={{ uri: participant.photoURL }} />
            ) : (
              <Avatar.Text
                size={40}
                label={participant.displayName?.substring(0, 2).toUpperCase() || 'U'}
              />
            )}
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>{participant.displayName}</Text>
              {participant.id === event.createdBy && (
                <Chip compact style={styles.organizerChip} textStyle={{ fontSize: 10 }}>
                  Organizer
                </Chip>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {!isCancelled && !isPast && (
          <>
            {isParticipant && !isCreator && (
              <Button
                mode="outlined"
                onPress={handleLeave}
                style={styles.actionButton}
                textColor={colors.error}
              >
                Leave Event
              </Button>
            )}

            {!isParticipant && !isFull && (
              <Button
                mode="contained"
                onPress={handleJoin}
                style={[styles.actionButton, styles.joinButton]}
              >
                Join Event
              </Button>
            )}

            {!isParticipant && isFull && (
              <Button mode="contained" disabled style={styles.actionButton}>
                Event Full
              </Button>
            )}
          </>
        )}

        {isCreator && !isPast && (
          <>
            {!isCancelled && (
              <Button
                mode="outlined"
                onPress={handleCancel}
                style={styles.actionButton}
                textColor={colors.error}
              >
                Cancel Event
              </Button>
            )}
            <Button
              mode="outlined"
              onPress={handleDelete}
              style={styles.actionButton}
              textColor={colors.error}
            >
              Delete Event
            </Button>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    ...shadows.sm,
  },
  cancelledChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.error,
    marginBottom: spacing.sm,
  },
  cancelledChipText: {
    color: '#fff',
    fontWeight: '600',
  },
  pastChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  pastChipText: {
    color: '#fff',
    fontWeight: '600',
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  creator: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  topicChip: {
    alignSelf: 'flex-start',
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 24,
    marginRight: spacing.md,
    marginTop: spacing.xs,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  detailText: {
    ...typography.body1,
    color: colors.text,
  },
  detailTextSecondary: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  description: {
    ...typography.body1,
    color: colors.text,
    lineHeight: 24,
  },
  divider: {
    marginVertical: spacing.md,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  participantInfo: {
    flex: 1,
    marginLeft: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  participantName: {
    ...typography.body1,
    color: colors.text,
  },
  organizerChip: {
    height: 20,
  },
  actions: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
  joinButton: {
    backgroundColor: colors.primary,
  },
});
