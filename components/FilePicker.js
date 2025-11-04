import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button, ProgressBar } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { colors, spacing, typography } from '../constants';
import {
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
} from '../constants/app';
import { validateFileSize, validateFileType } from '../utils/validation';
import { formatFileSize, getFileExtension } from '../utils/fileHelpers';

export default function FilePicker({
  onFileSelected,
  onUploadComplete,
  onUploadError,
  allowedTypes = ALLOWED_FILE_TYPES,
  maxFileSize = MAX_FILE_SIZE,
  uploadFunction,
  buttonLabel = 'Choose File',
  buttonMode = 'contained',
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];

      // Validate file size
      const sizeValidation = validateFileSize(file.size, maxFileSize);
      if (!sizeValidation.valid) {
        Alert.alert('File Too Large', sizeValidation.error);
        return;
      }

      // Validate file type
      const extension = getFileExtension(file.name);
      const typeValidation = validateFileType(file.name, allowedTypes);
      if (!typeValidation.valid) {
        Alert.alert('Invalid File Type', typeValidation.error);
        return;
      }

      const fileData = {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
        size: file.size,
      };

      setSelectedFile(fileData);

      if (onFileSelected) {
        onFileSelected(fileData);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadFunction) {
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress (since Firebase doesn't provide real progress for uploads)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 0.9) {
            clearInterval(progressInterval);
            return 0.9;
          }
          return prev + 0.1;
        });
      }, 200);

      await uploadFunction(selectedFile);

      clearInterval(progressInterval);
      setUploadProgress(1);

      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);

        if (onUploadComplete) {
          onUploadComplete();
        }
      }, 500);
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Upload Failed', 'Failed to upload file. Please try again.');

      if (onUploadError) {
        onUploadError(error);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <View style={styles.container}>
      {!selectedFile ? (
        <Button
          mode={buttonMode}
          onPress={handlePickDocument}
          icon="file-upload"
          style={styles.button}
        >
          {buttonLabel}
        </Button>
      ) : (
        <View style={styles.selectedFileContainer}>
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {selectedFile.name}
            </Text>
            <Text style={styles.fileSize}>
              {formatFileSize(selectedFile.size)}
            </Text>
          </View>

          {uploading && (
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={uploadProgress}
                color={colors.primary}
                style={styles.progressBar}
              />
              <Text style={styles.progressText}>
                {Math.round(uploadProgress * 100)}%
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={handleCancel}
              disabled={uploading}
              style={styles.actionButton}
            >
              Cancel
            </Button>
            {uploadFunction && (
              <Button
                mode="contained"
                onPress={handleUpload}
                loading={uploading}
                disabled={uploading}
                style={styles.actionButton}
              >
                Upload
              </Button>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
  },
  selectedFileContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fileInfo: {
    marginBottom: spacing.md,
  },
  fileName: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  fileSize: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: spacing.xs,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
