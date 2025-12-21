import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../../constants';
import { MAX_SKILLS_ALLOWED, MAX_NEEDS_ALLOWED } from '../../constants/app';
import useAuthStore from '../../stores/authStore';
import TagPicker from '../../components/TagPicker';
import { validateEmail, validatePassword, validateDisplayName } from '../../utils/validation';

export default function SignUp() {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState(1); // 1: Account Info, 2: Skills, 3: Needs

  // Form data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [skills, setSkills] = useState([]);
  const [needs, setNeeds] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const signUpWithProfile = useAuthStore((state) => state.signUpWithProfile);

  // Step 1 validation
  const validateStep1 = () => {
    const nameValidation = validateDisplayName(name);
    if (!nameValidation.valid) {
      Alert.alert('Validation Error', nameValidation.error);
      return false;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      Alert.alert('Validation Error', emailValidation.error);
      return false;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      Alert.alert('Validation Error', passwordValidation.error);
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  // Step 2 validation
  const validateStep2 = () => {
    if (skills.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one skill');
      return false;
    }
    return true;
  };

  // Navigation handlers
  const handleNextToSkills = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleNextToNeeds = () => {
    if (validateStep2()) {
      setStep(3);
    }
  };

  const handleBackToAccountInfo = () => setStep(1);
  const handleBackToSkills = () => setStep(2);

  // Final account creation
  const handleCreateAccount = async () => {
    if (needs.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one learning need');
      return;
    }

    setLoading(true);
    try {
      await signUpWithProfile(email, password, name, skills, needs);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Signup Failed', error.message);
      setLoading(false);
    }
  };

  // Render Step 1: Account Info
  const renderStep1 = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Join PeerTutor</Text>
        <Text style={styles.subtitle}>Create your account</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Full Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          autoCapitalize="words"
          autoComplete="name"
          style={styles.input}
        />

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={styles.input}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
          style={styles.input}
        />

        <TextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          mode="outlined"
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
          right={
            <TextInput.Icon
              icon={showConfirmPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          }
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleNextToSkills}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Next: Select Skills
        </Button>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  // Render Step 2: Skills
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>What can you teach?</Text>
        <Text style={styles.stepSubtitle}>
          Select topics you're comfortable teaching to others (at least 1, max {MAX_SKILLS_ALLOWED})
        </Text>
      </View>

      <TagPicker
        selectedTags={skills}
        onTagsChange={setSkills}
        title="Your Skills"
        maxSelection={MAX_SKILLS_ALLOWED}
      />

      <View style={styles.buttonRow}>
        <Button
          mode="outlined"
          onPress={handleBackToAccountInfo}
          style={styles.halfButton}
          contentStyle={styles.buttonContent}
        >
          Back
        </Button>
        <Button
          mode="contained"
          onPress={handleNextToNeeds}
          style={styles.halfButton}
          contentStyle={styles.buttonContent}
        >
          Next: Learning Needs
        </Button>
      </View>
    </View>
  );

  // Render Step 3: Needs
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>What do you want to learn?</Text>
        <Text style={styles.stepSubtitle}>
          Select topics you'd like help with (at least 1, max {MAX_NEEDS_ALLOWED})
        </Text>
      </View>

      <TagPicker
        selectedTags={needs}
        onTagsChange={setNeeds}
        title="Your Learning Needs"
        maxSelection={MAX_NEEDS_ALLOWED}
      />

      <View style={styles.buttonRow}>
        <Button
          mode="outlined"
          onPress={handleBackToSkills}
          style={styles.halfButton}
          contentStyle={styles.buttonContent}
        >
          Back
        </Button>
        <Button
          mode="contained"
          onPress={handleCreateAccount}
          loading={loading}
          disabled={loading}
          style={styles.halfButton}
          contentStyle={styles.buttonContent}
        >
          Create Account
        </Button>
      </View>

      <Text style={styles.terms}>
        By signing up, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(step / 3) * 100}%` }
            ]}
          />
        </View>
        <Text style={styles.stepIndicator}>Step {step} of 3</Text>
      </View>

      {/* Step Content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  stepIndicator: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.md,
  },
  buttonContent: {
    paddingVertical: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  footerLink: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: 'bold',
  },
  stepContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  stepHeader: {
    marginBottom: spacing.lg,
  },
  stepTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  halfButton: {
    flex: 1,
  },
  terms: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
