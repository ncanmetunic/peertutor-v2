import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput, FAB, Searchbar, Dialog, Portal, Button, Chip } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../../constants';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '../../constants/app';
import useAuthStore from '../../stores/authStore';
import {
  getFiles,
  uploadFile,
  deleteFile,
  searchFiles,
} from '../../services/fileService';
import { getCommunity } from '../../services/communityService';
import FilePicker from '../../components/FilePicker';
import FileCard from '../../components/FileCard';

export default function CommunityLibrary() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const [community, setCommunity] = useState(null);
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    loadCommunity();
    loadFiles();
  }, [id]);

  const loadCommunity = async () => {
    try {
      const data = await getCommunity(id);
      setCommunity(data);
    } catch (error) {
      console.error('Error loading community:', error);
      Alert.alert('Error', 'Failed to load community');
    }
  };

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await getFiles(id);
      setFiles(data);
    } catch (error) {
      console.error('Error loading files:', error);
      Alert.alert('Error', 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadFiles();
      return;
    }

    try {
      const results = await searchFiles(id, searchQuery);
      setFiles(results);
    } catch (error) {
      console.error('Error searching files:', error);
      Alert.alert('Error', 'Failed to search files');
    }
  };

  const handleFileSelected = (fileData) => {
    setSelectedFile(fileData);
  };

  const handleUpload = async (fileData) => {
    try {
      const metadata = {
        fileName: fileData.name,
        fileType: fileData.type,
        fileSize: fileData.size,
        uploadedBy: user.uid,
        communityId: id,
        description: description.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
      };

      await uploadFile(id, fileData.uri, metadata);

      setShowUploadDialog(false);
      setDescription('');
      setTags('');
      setSelectedFile(null);

      Alert.alert('Success', 'File uploaded successfully!');
      await loadFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleDelete = async (fileId) => {
    try {
      await deleteFile(fileId);
      await loadFiles();
      Alert.alert('Success', 'File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      Alert.alert('Error', 'Failed to delete file');
    }
  };

  const isMember = community?.members?.includes(user.uid);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {community?.icon} {community?.name} Library
        </Text>
        <Text style={styles.headerSubtitle}>
          {files.length} {files.length === 1 ? 'file' : 'files'}
        </Text>
      </View>

      {/* Search Bar */}
      <Searchbar
        placeholder="Search files..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        onSubmitEditing={handleSearch}
        onClearIconPress={loadFiles}
        style={styles.searchbar}
      />

      {/* Files List */}
      <FlatList
        data={files}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FileCard file={item} onDelete={handleDelete} />
        )}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadFiles}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No files yet</Text>
            <Text style={styles.emptySubtext}>
              {isMember
                ? 'Upload files to share with the community'
                : 'Join the community to upload files'}
            </Text>
          </View>
        }
      />

      {/* Upload FAB (only for members) */}
      {isMember && (
        <FAB
          icon="upload"
          style={styles.fab}
          onPress={() => setShowUploadDialog(true)}
          label="Upload"
        />
      )}

      {/* Upload Dialog */}
      <Portal>
        <Dialog
          visible={showUploadDialog}
          onDismiss={() => {
            setShowUploadDialog(false);
            setDescription('');
            setTags('');
            setSelectedFile(null);
          }}
          style={styles.dialog}
        >
          <Dialog.Title>Upload File</Dialog.Title>
          <Dialog.ScrollArea>
            <View style={styles.dialogContent}>
              <FilePicker
                onFileSelected={handleFileSelected}
                uploadFunction={selectedFile ? handleUpload : null}
                onUploadComplete={() => {
                  setShowUploadDialog(false);
                  setDescription('');
                  setTags('');
                  setSelectedFile(null);
                }}
                allowedTypes={ALLOWED_FILE_TYPES}
                maxFileSize={MAX_FILE_SIZE}
                buttonLabel="Select File"
                buttonMode="outlined"
              />

              {selectedFile && (
                <>
                  <TextInput
                    label="Description (Optional)"
                    value={description}
                    onChangeText={setDescription}
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                    style={styles.input}
                    placeholder="What is this file about?"
                  />

                  <TextInput
                    label="Tags (Optional)"
                    value={tags}
                    onChangeText={setTags}
                    mode="outlined"
                    style={styles.input}
                    placeholder="e.g., homework, notes, study guide (comma-separated)"
                  />
                </>
              )}
            </View>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setShowUploadDialog(false);
                setDescription('');
                setTags('');
                setSelectedFile(null);
              }}
            >
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  searchbar: {
    margin: spacing.md,
    elevation: 2,
  },
  list: {
    padding: spacing.md,
  },
  empty: {
    alignItems: 'center',
    padding: spacing.xxl,
    marginTop: spacing.xxl,
  },
  emptyText: {
    ...typography.h4,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body2,
    color: colors.textLight,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.primary,
  },
  dialog: {
    maxHeight: '80%',
  },
  dialogContent: {
    paddingHorizontal: spacing.md,
  },
  input: {
    marginTop: spacing.md,
    backgroundColor: colors.background,
  },
});
