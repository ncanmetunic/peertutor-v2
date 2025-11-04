import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { FAB, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants';
import useAuthStore from '../../stores/authStore';
import {
  getUpcomingEvents,
  getUserEvents,
  joinEvent,
  leaveEvent,
} from '../../services/eventService';

export default function Events() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [events, setEvents] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [user]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const [allEvents, myEvents] = await Promise.all([
        getUpcomingEvents(),
        getUserEvents(user.uid),
      ]);
      setEvents(allEvents);
      setUserEvents(myEvents);
    } catch (error) {
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (eventId) => {
    try {
      await joinEvent(eventId, user.uid);
      await loadEvents();
      Alert.alert('Success', 'You joined the event!');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to join event');
    }
  };

  const handleLeave = async (eventId) => {
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
              await leaveEvent(eventId, user.uid);
              await loadEvents();
            } catch (error) {
              Alert.alert('Error', 'Failed to leave event');
            }
          },
        },
      ]
    );
  };

  const isJoined = (eventId) => {
    return userEvents.some(e => e.id === eventId);
  };

  const renderEvent = ({ item }) => {
    const joined = isJoined(item.id);
    const startTime = item.startTime?.toDate();
    const isFull = item.maxParticipants && item.participants.length >= item.maxParticipants;

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => router.push(`/event/${item.id}`)}
      >
        <View style={styles.eventHeader}>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventCreator}>by {item.creatorName}</Text>
          </View>
          {joined && <Chip compact textStyle={styles.joinedChipText}>Joined</Chip>}
        </View>

        {item.description && (
          <Text style={styles.eventDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.eventMeta}>
          <Text style={styles.eventTime}>
            📅 {startTime && format(startTime, 'MMM d, yyyy • h:mm a')}
          </Text>
          <Text style={styles.eventParticipants}>
            👥 {item.participants.length}
            {item.maxParticipants && ` / ${item.maxParticipants}`}
          </Text>
        </View>

        {item.topic && (
          <Chip style={styles.topicChip} compact>
            {item.topic}
          </Chip>
        )}

        <View style={styles.eventActions}>
          {joined ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => router.push(`/event/${item.id}`)}
              >
                <Text style={styles.viewButtonText}>View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.leaveButton]}
                onPress={() => handleLeave(item.id)}
              >
                <Text style={styles.leaveButtonText}>Leave</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.joinButton,
                isFull && styles.disabledButton,
              ]}
              onPress={() => handleJoin(item.id)}
              disabled={isFull}
            >
              <Text style={styles.joinButtonText}>
                {isFull ? 'Full' : 'Join Event'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadEvents}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No upcoming events</Text>
            <Text style={styles.emptySubtext}>Create one to get started!</Text>
          </View>
        }
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => router.push('/event/create')}
        label="Create Event"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
  },
  eventCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    ...typography.h4,
    color: colors.text,
  },
  eventCreator: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  joinedChipText: {
    fontSize: 11,
  },
  eventDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  eventMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  eventTime: {
    ...typography.caption,
    color: colors.text,
  },
  eventParticipants: {
    ...typography.caption,
    color: colors.text,
  },
  topicChip: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  eventActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: colors.primary,
  },
  joinButtonText: {
    ...typography.button,
    color: '#fff',
    fontSize: 14,
  },
  viewButton: {
    backgroundColor: colors.primary,
  },
  viewButtonText: {
    ...typography.button,
    color: '#fff',
    fontSize: 14,
  },
  leaveButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  leaveButtonText: {
    ...typography.button,
    color: colors.text,
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: colors.border,
  },
  empty: {
    padding: spacing.xxl,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body2,
    color: colors.textLight,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.primary,
  },
});
