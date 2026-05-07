// =============================================
// ADMIN LAYOUT - Stack navigator for admin screens
// =============================================
import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../theme/colors';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    />
  );
}
