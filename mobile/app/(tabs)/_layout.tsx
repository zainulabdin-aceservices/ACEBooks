// =============================================
// TABS LAYOUT - Bottom tab navigation
// =============================================
// This defines the 4 main tabs:
//   Home | Add Expense | History | Settings
// =============================================
import React from 'react';
import { Tabs } from 'expo-router';
import { colors } from '../../theme/colors';
import { FontAwesome } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.card,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
          color: colors.text,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : null}>
              <FontAwesome name="home" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add Expense',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.addButton, focused && styles.addButtonActive]}>
              <FontAwesome name="plus" size={20} color={focused ? '#FFF' : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : null}>
              <FontAwesome name="list-alt" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : null}>
              <FontAwesome name="cog" size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIconWrap: {
    backgroundColor: colors.primary + '12',
    borderRadius: 10,
    padding: 4,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  addButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
});
