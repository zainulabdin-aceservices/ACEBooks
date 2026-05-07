// =============================================
// AUTH LAYOUT - Wraps the login screen
// =============================================
import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
