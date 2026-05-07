// =============================================
// MANAGE CUSTOMERS - Admin can create & view
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

export default function ManageCustomersScreen() {
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (e) {
      console.log('Error fetching customers', e);
    }
  };

  const handleCreate = async () => {
    if (!name) {
      Alert.alert('Error', 'Customer name is required.');
      return;
    }

    try {
      await api.post('/customers', { name, phone, address });
      Alert.alert('✅ Success', `Customer "${name}" created!`);
      setShowModal(false);
      resetForm();
      fetchCustomers();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to create customer');
    }
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setAddress('');
  };

  const renderCustomer = ({ item, index }) => (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 80)} style={styles.card}>
      <View style={styles.cardIcon}>
        <FontAwesome name="building-o" size={20} color={colors.info} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>
        {item.phone ? <Text style={styles.cardMeta}>📞 {item.phone}</Text> : null}
        {item.address ? <Text style={styles.cardMeta}>📍 {item.address}</Text> : null}
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Manage Customers',
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowModal(true)} style={{ marginRight: 10 }}>
              <FontAwesome name="plus-circle" size={22} color={colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <FlatList
        data={customers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCustomer}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏢</Text>
            <Text style={styles.emptyText}>No customers yet.</Text>
          </View>
        }
      />

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)} activeOpacity={0.8}>
        <FontAwesome name="plus" size={22} color="#FFF" />
      </TouchableOpacity>

      {/* Create Customer Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Customer</Text>

            <Text style={styles.label}>Customer Name *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. ABC Traders" placeholderTextColor={colors.textLight} />

            <Text style={styles.label}>Phone (optional)</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="0300-1234567" keyboardType="phone-pad" placeholderTextColor={colors.textLight} />

            <Text style={styles.label}>Address (optional)</Text>
            <TextInput style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]} value={address} onChangeText={setAddress} placeholder="City, Street..." multiline placeholderTextColor={colors.textLight} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowModal(false); resetForm(); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
                <Text style={styles.createBtnText}>Add Customer</Text>
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
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: colors.info + '15',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: colors.text },
  cardMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  fab: {
    position: 'absolute', right: 20, bottom: 40,
    width: 56, height: 56, borderRadius: 16, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
  },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textSecondary, fontSize: 16 },
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
