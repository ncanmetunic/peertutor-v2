import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { IconButton, Chip } from 'react-native-paper';
import { format } from 'date-fns';
import { colors, spacing, typography, borderRadius, shadows } from '../constants';
import {
  formatFileSize,
  getFileIcon,
  truncateFileName,
  getFileCategory,
} from '../utils/fileHelpers';
import { getUserById } from '../services/userService';
import useAuthStore from '../stores/authStore';

export default function FileCard({ file, onDelete, showActions = true }) {
  const { user } = useAuthStore();
  const [uploader, setUploader] = useState(null);

  useEffect(() => {
    loadUploader();
  }, [file.uploadedBy]);

  const loadUploader = async () => {
    try {
      const userData = await getUserById(file.uploadedBy);
      setUploader(userData);
    } catch (error) {
      console.error('Error loading uploader:', error);
    }
  };

  const handleDownload = async () => {
    try {
      const supported = await Linking.canOpenURL(file.downloadURL);

      if (supported) {
        await Linking.openURL(file.downloadURL);
      } else {
        Alert.alert('Error', 'Cannot open this file');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      Alert.alert('Error', 'Failed to download file');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete File',
      'Are you sure you want to delete this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete && onDelete(file.id),
        },
      ]
    );
  };

  const uploadedDate = file.uploadedAt?.toDate();
  const isOwner = file.uploadedBy === user.uid;
  const category = getFileCategory(file.fileName);

  const getCategoryColor = (category) => {
    const colors = {
      document: '#FF6B6B',
      spreadsheet: '#4ECDC4',
      presentation: '#FFE66D',
      image: '#95E1D3',
      video: '#F38181',
      audio: '#AA96DA',
      code: '#FCBAD3',
      archive: '#A8DADC',
      other: '#B8B8B8',
    };
    return colors[category] || colors.other;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleDownload}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* File Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: getCategoryColor(category) + '20' },
          ]}
        >
          <IconButton
            icon={getFileIcon(file.fileName)}
            size={32}
            iconColor={getCategoryColor(category)}
          />
        </View>

        {/* File Info */}
        <View style={styles.info}>
          <Text style={styles.fileName}>{truncateFileName(file.fileName, 35)}</Text>

          <View style={styles.metadata}>
            <Text style={styles.metadataText}>
              {formatFileSize(file.fileSize)}
            </Text>
            <Text style={styles.metadataSeparator}>•</Text>
            <Text style={styles.metadataText}>
              {uploader?.displayName || 'Unknown'}
            </Text>
            {uploadedDate && (
              <>
                <Text style={styles.metadataSeparator}>•</Text>
                <Text style={styles.metadataText}>
                  {format(uploadedDate, 'MMM d, yyyy')}
                </Text>
              </>
            )}
          </View>

          {file.description && (
            <Text style={styles.description} numberOfLines={2}>
              {file.description}
            </Text>
          )}

          {file.tags && file.tags.length > 0 && (
            <View style={styles.tags}>
              {file.tags.slice(0, 3).map((tag, index) => (
                <Chip
                  key={index}
                  compact
                  style={styles.tag}
                  textStyle={styles.tagText}
                >
                  {tag}
                </Chip>
              ))}
            </View>
          )}
        </View>

        {/* Actions */}
        {showActions && isOwner && (
          <IconButton
            icon="delete"
            size={20}
            iconColor={colors.error}
            onPress={handleDelete}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconContainer: {
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  fileName: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  metadataText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metadataSeparator: {
    ...typography.caption,
    color: colors.textSecondary,
    marginHorizontal: spacing.xs,
  },
  description: {
    ...typography.caption,
    color: colors.text,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  tags: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  tag: {
    height: 24,
  },
  tagText: {
    fontSize: 10,
  },
});
