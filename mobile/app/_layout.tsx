// =============================================
// ROOT LAYOUT - App entry point
// =============================================
// Wraps everything with:
//   1. React Query (for API data caching)
//   2. Auth Provider (for login/logout state)
//   3. Auto-redirect based on auth status
// =============================================
import React, { useContext, useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../store/AuthContext';
import { ActivityIndicator, View, StatusBar } from 'react-native';
import { colors } from '../theme/colors';

const queryClient = new QueryClient();

function InitialLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Not logged in -> go to login
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Logged in -> go to tabs
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="admin"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InitialLayout />
      </AuthProvider>
    </QueryClientProvider>
  );
}
