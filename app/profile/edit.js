import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { TextInput, Button, Avatar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../../constants';
import useAuthStore from '../../stores/authStore';
import useUserStore from '../../stores/userStore';
import TagPicker from '../../components/TagPicker';

export default function EditProfile() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentUserProfile, updateCurrentUserProfile, uploadProfilePicture } = useUserStore();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [photoURL, setPhotoURL] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Basic info, 2: Skills, 3: Needs

  useEffect(() => {
    if (currentUserProfile) {
      setDisplayName(currentUserProfile.displayName || '');
      setBio(currentUserProfile.bio || '');
      setSkills(currentUserProfile.skills || []);
      setNeeds(currentUserProfile.needs || []);
      setPhotoURL(currentUserProfile.photoURL);
    }
  }, [currentUserProfile]);

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permission to upload a photo');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLoading(true);
        try {
          const imageUri = result.assets[0].uri;
          const downloadURL = await uploadProfilePicture(user.uid, imageUri);
          setPhotoURL(downloadURL);
          Alert.alert('Success', 'Profile picture updated!');
        } catch (error) {
          Alert.alert('Error', 'Failed to upload image: ' + error.message);
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (skills.length === 0) {
      Alert.alert('Error', 'Please select at least one skill');
      return;
    }

    if (needs.length === 0) {
      Alert.alert('Error', 'Please select at least one learning need');
      return;
    }

    setLoading(true);
    try {
      await updateCurrentUserProfile(user.uid, {
        displayName,
        bio,
        skills,
        needs,
      });

      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <ScrollView style={styles.content}>
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={pickImage} disabled={loading}>
          {photoURL ? (
            <Avatar.Image size={120} source={{ uri: photoURL }} />
          ) : (
            <Avatar.Icon size={120} icon="account" />
          )}
        </TouchableOpacity>
        <Button onPress={pickImage} mode="text" disabled={loading}>
          Change Photo
        </Button>
      </View>

      <TextInput
        label="Display Name"
        value={displayName}
        onChangeText={setDisplayName}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Bio"
        value={bio}
        onChangeText={setBio}
        mode="outlined"
        multiline
        numberOfLines={4}
        style={styles.input}
        placeholder="Tell others about yourself..."
      />

      <Button
        mode="contained"
        onPress={() => setStep(2)}
        style={styles.button}
      >
        Next: Select Skills
      </Button>
    </ScrollView>
  );

  const renderStep2 = () => (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>What can you teach?</Text>
      <Text style={styles.stepSubtitle}>
        Select topics you're comfortable teaching to others
      </Text>

      <TagPicker
        selectedTags={skills}
        onTagsChange={setSkills}
        title="Your Skills"
      />

      <View style={styles.buttonRow}>
        <Button mode="outlined" onPress={() => setStep(1)} style={styles.halfButton}>
          Back
        </Button>
        <Button mode="contained" onPress={() => setStep(3)} style={styles.halfButton}>
          Next: Learning Needs
        </Button>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>What do you want to learn?</Text>
      <Text style={styles.stepSubtitle}>
        Select topics you'd like help with
      </Text>

      <TagPicker
        selectedTags={needs}
        onTagsChange={setNeeds}
        title="Your Learning Needs"
      />

      <View style={styles.buttonRow}>
        <Button mode="outlined" onPress={() => setStep(2)} style={styles.halfButton}>
          Back
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          style={styles.halfButton}
        >
          Save Profile
        </Button>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Text style={styles.stepIndicator}>Step {step}/3</Text>
      </View>

      {/* Content based on step */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.primary,
  },
  cancelText: {
    ...typography.body1,
    color: '#fff',
  },
  headerTitle: {
    ...typography.h4,
    color: '#fff',
  },
  stepIndicator: {
    ...typography.body2,
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  input: {
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.md,
  },
  stepTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  halfButton: {
    flex: 1,
  },
});
