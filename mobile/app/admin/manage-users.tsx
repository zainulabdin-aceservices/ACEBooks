// =============================================
// MANAGE USERS - Admin can create & view users
// =============================================
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, Alert, Modal,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FontAwesome } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { Stack } from 'expo-router';

export default function ManageUsersScreen() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Form fields for new user
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [spendingLimit, setSpendingLimit] = useState('');

  // Fetch all users on load
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (e) {
      console.log('Error fetching users', e);
    }
  };

  // Create a new user
  const handleCreate = async () => {
    if (!name || !username || !password) {
      Alert.alert('Error', 'Name, username, and password are required.');
      return;
    }

    try {
      await api.post('/users', {
        name,
        username,
        password,
        role: 'User',
        spendingLimit: spendingLimit ? parseFloat(spendingLimit) : null,
      });

      Alert.alert('✅ Success', `User "${name}" created!`);
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to create user');
    }
  };

  const resetForm = () => {
    setName('');
    setUsername('');
    setPassword('');
    setSpendingLimit('');
  };

  const renderUser = ({ item, index }) => (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 80)} style={styles.userCard}>
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userUsername}>@{item.username}</Text>
      </View>
      <View style={[styles.roleBadge, item.role?.toLowerCase() === 'admin' ? styles.adminBadge : styles.staffBadge]}>
        <Text style={[styles.roleText, item.role?.toLowerCase() === 'admin' ? styles.adminText : styles.staffText]}>
          {item.role}
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Manage Users',
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowModal(true)} style={{ marginRight: 10 }}>
              <FontAwesome name="user-plus" size={20} color={colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUser}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No users found.</Text>
          </View>
        }
      />

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)} activeOpacity={0.8}>
        <FontAwesome name="plus" size={22} color="#FFF" />
      </TouchableOpacity>

      {/* Create User Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create New User</Text>

            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="John Doe" placeholderTextColor={colors.textLight} />

            <Text style={styles.label}>Username</Text>
            <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="john.doe" autoCapitalize="none" placeholderTextColor={colors.textLight} />

            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••" secureTextEntry placeholderTextColor={colors.textLight} />

            <Text style={styles.label}>Spending Limit (optional)</Text>
            <TextInput style={styles.input} value={spendingLimit} onChangeText={setSpendingLimit} placeholder="e.g. 50000" keyboardType="numeric" placeholderTextColor={colors.textLight} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowModal(false); resetForm(); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
                <Text style={styles.createBtnText}>Create User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  userCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  userAvatar: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary + '18',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  userAvatarText: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600', color: colors.text },
  userUsername: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  adminBadge: { backgroundColor: colors.warning + '18' },
  staffBadge: { backgroundColor: colors.success + '18' },
  roleText: { fontSize: 12, fontWeight: 'bold' },
  adminText: { color: colors.warning },
  staffText: { color: colors.success },
  fab: {
    position: 'absolute', right: 20, bottom: 40,
    width: 56, height: 56, borderRadius: 16, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
  },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textSecondary, fontSize: 16 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: colors.inputBg, borderRadius: 12, padding: 14, marginBottom: 14, fontSize: 16, color: colors.text },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: colors.inputBg },
  cancelBtnText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  createBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: colors.primary },
  createBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
});
