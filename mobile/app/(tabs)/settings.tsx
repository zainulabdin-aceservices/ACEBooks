// =============================================
// SETTINGS SCREEN - Profile + Admin navigation
// =============================================
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../store/AuthContext';
import { colors } from '../../theme/colors';
import { FontAwesome } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Helper to render a menu row
  const MenuItem = ({ icon, label, onPress, color }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.6}>
      <View style={[styles.menuIcon, { backgroundColor: (color || colors.primary) + '15' }]}>
        <FontAwesome name={icon} size={18} color={color || colors.primary} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <FontAwesome name="chevron-right" size={14} color={colors.textLight} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Profile Card */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient colors={colors.gradientOrange} style={styles.profileCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || '?'}</Text>
          </View>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileUsername}>@{user?.username}</Text>
          <View style={styles.profileBadge}>
            <Text style={styles.profileBadgeText}>{user?.role}</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Admin Actions */}
      {user?.role?.toLowerCase() === 'admin' && (
        <Animated.View style={styles.section} entering={FadeInDown.duration(400).delay(150)}>
          <Text style={styles.sectionTitle}>Admin Panel</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="users" label="Manage Users" onPress={() => router.push('/admin/manage-users')} />
            <MenuItem icon="address-book" label="Manage Customers" onPress={() => router.push('/admin/manage-customers')} color={colors.info} />
            <MenuItem icon="cutlery" label="Edit Hotel Menu" onPress={() => router.push('/admin/manage-hotel')} color={colors.warning} />
          </View>
        </Animated.View>
      )}

      {/* General Settings */}
      <Animated.View style={styles.section} entering={FadeInDown.duration(400).delay(300)}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuCard}>
          <MenuItem icon="lock" label="Change Password" onPress={() => Alert.alert('Coming Soon')} color={colors.textSecondary} />
        </View>
      </Animated.View>

      {/* Logout */}
      <Animated.View entering={FadeInDown.duration(400).delay(450)}>
        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
          <FontAwesome name="sign-out" size={18} color="#FFF" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  profileCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  profileUsername: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  profileBadge: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
  },
  profileBadgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  logoutButton: {
    backgroundColor: colors.error,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
