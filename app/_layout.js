import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '../constants';
import useAuthStore from '../stores/authStore';

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    // Initialize auth listener
    const unsubscribe = initialize();
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={{
        ...theme,
        colors: {
          ...theme.colors,
          primary: theme.colors.primary,
          secondary: theme.colors.secondary,
          background: theme.colors.background,
          surface: theme.colors.surface,
        }
      }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chat" />
          <Stack.Screen name="community" />
          <Stack.Screen name="event" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="admin" />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
