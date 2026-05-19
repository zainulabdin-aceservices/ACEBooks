// =============================================
// MANAGE HOTEL MENU - Admin edits dish list
// =============================================
// Admin can add new dishes, update prices,
// and remove dishes from the hotel menu.
// =============================================
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, Alert, Modal, ScrollView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FontAwesome } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ManageHotelScreen() {
  const [dishes, setDishes] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [showModal, setShowModal] = useState(false);

  // Form fields for new dish
  const [dishName, setDishName] = useState('');
  const [dishRate, setDishRate] = useState('');
  const [editingDishIndex, setEditingDishIndex] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/config/hotel');
      setDishes(res.data.dishes || []);
      setSchedule(res.data.schedule || {});
    } catch (e) {
      console.log('Error fetching hotel config', e);
    }
  };

  // Save the entire config back to the server
  const saveConfig = async (updatedDishes, updatedSchedule) => {
    try {
      await api.put('/config/hotel', { dishes: updatedDishes, schedule: updatedSchedule });
      setDishes(updatedDishes);
      setSchedule(updatedSchedule);
    } catch {
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDishIndex(null);
    setDishName('');
    setDishRate('');
  };

  // Add or edit a dish
  const handleSaveDish = () => {
    if (!dishName || !dishRate) {
      Alert.alert('Error', 'Both dish name and rate are required.');
      return;
    }

    const newRate = parseFloat(dishRate);

    if (editingDishIndex !== null) {
      // Edit existing dish
      const oldDishName = dishes[editingDishIndex].name;
      const updatedDishes = [...dishes];
      updatedDishes[editingDishIndex] = { name: dishName, rate: newRate };

      // Update schedule if name changed
      let updatedSchedule = { ...schedule };
      if (oldDishName !== dishName) {
        Object.keys(updatedSchedule).forEach(day => {
          updatedSchedule[day] = updatedSchedule[day].map(name => 
            name === oldDishName ? dishName : name
          );
        });
      }

      saveConfig(updatedDishes, updatedSchedule);
      Alert.alert('✅ Updated', `"${dishName}" updated successfully!`);
    } else {
      // Add new dish
      const newDish = { name: dishName, rate: newRate };
      const updatedDishes = [...dishes, newDish];
      
      // Auto-add to selected day if adding from a specific day view
      let updatedSchedule = { ...schedule };
      if (!updatedSchedule[selectedDay]) updatedSchedule[selectedDay] = [];
      updatedSchedule[selectedDay].push(dishName);

      saveConfig(updatedDishes, updatedSchedule);
      Alert.alert('✅ Added', `"${dishName}" added to the menu!`);
    }

    closeModal();
  };

  // Remove a dish entirely
  const handleRemove = (index) => {
    const dishToRemove = dishes[index].name;
    Alert.alert(
      'Remove Dish',
      `Are you sure you want to remove "${dishToRemove}" from all days?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedDishes = dishes.filter((_, i) => i !== index);
            // Also remove from all days in schedule
            const updatedSchedule = { ...schedule };
            Object.keys(updatedSchedule).forEach(day => {
              updatedSchedule[day] = updatedSchedule[day].filter(name => name !== dishToRemove);
            });
            saveConfig(updatedDishes, updatedSchedule);
          },
        },
      ]
    );
  };

  // Toggle dish for selected day
  const toggleDishForDay = (name) => {
    const updatedSchedule = { ...schedule };
    if (!updatedSchedule[selectedDay]) updatedSchedule[selectedDay] = [];
    
    if (updatedSchedule[selectedDay].includes(name)) {
      updatedSchedule[selectedDay] = updatedSchedule[selectedDay].filter(n => n !== name);
    } else {
      updatedSchedule[selectedDay].push(name);
    }
    
    saveConfig(dishes, updatedSchedule);
  };

  const renderDish = ({ item, index }) => {
    const isScheduled = schedule[selectedDay]?.includes(item.name);
    
    return (
      <Animated.View entering={FadeInDown.duration(300).delay(index * 80)} style={[styles.dishCard, !isScheduled && { opacity: 0.6 }]}>
        <TouchableOpacity style={styles.dishInfo} onPress={() => toggleDishForDay(item.name)}>
          <View style={styles.dishIcon}>
            <Text style={{ fontSize: 20 }}>{isScheduled ? '✅' : '🍽️'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.dishName}>{item.name}</Text>
            <Text style={styles.dishRate}>Rs {item.rate} / plate</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editBtn} onPress={() => {
            setEditingDishIndex(index);
            setDishName(item.name);
            setDishRate(item.rate.toString());
            setShowModal(true);
          }}>
            <FontAwesome name="pencil" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(index)}>
            <FontAwesome name="trash-o" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerInfo}>
        <Text style={styles.headerText}>
          Assign dishes to days. Users will only see dishes scheduled for the current day.
        </Text>
      </View>

      {/* Day Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
        {DAYS.map(day => (
          <TouchableOpacity 
            key={day} 
            style={[styles.dayTab, selectedDay === day && styles.dayTabActive]}
            onPress={() => setSelectedDay(day)}
          >
            <Text style={[styles.dayTabText, selectedDay === day && styles.dayTabTextActive]}>{day}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={dishes}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderDish}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyText}>No dishes configured yet.</Text>
          </View>
        }
      />

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab} onPress={() => { setEditingDishIndex(null); setShowModal(true); }} activeOpacity={0.8}>
        <FontAwesome name="plus" size={22} color="#FFF" />
      </TouchableOpacity>

      {/* Add Dish Modal */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={closeModal} 
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingDishIndex !== null ? 'Edit Dish' : 'Add New Dish'}</Text>

            <Text style={styles.label}>Dish Name</Text>
            <TextInput style={styles.input} value={dishName} onChangeText={setDishName} placeholder="e.g. Biryani" placeholderTextColor={colors.textLight} />

            <Text style={styles.label}>Price per Plate (Rs)</Text>
            <TextInput style={styles.input} value={dishRate} onChangeText={setDishRate} placeholder="e.g. 250" keyboardType="numeric" placeholderTextColor={colors.textLight} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={handleSaveDish}>
                <Text style={styles.createBtnText}>{editingDishIndex !== null ? 'Save Changes' : 'Add Dish'}</Text>
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
  headerInfo: {
    backgroundColor: colors.warning + '12', borderRadius: 12, padding: 14, marginBottom: 16,
    borderLeftWidth: 4, borderLeftColor: colors.warning,
  },
  headerText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  dishCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  daySelector: {
    marginBottom: 16,
    maxHeight: 50,
  },
  dayTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: colors.inputBg,
    height: 40,
    justifyContent: 'center',
  },
  dayTabActive: {
    backgroundColor: colors.primary,
  },
  dayTabText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dayTabTextActive: {
    color: '#FFF',
  },
  dishIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: colors.warning + '15',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  dishInfo: { flex: 1 },
  dishName: { fontSize: 16, fontWeight: '600', color: colors.text },
  dishRate: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  editBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary + '10',
    justifyContent: 'center', alignItems: 'center',
  },
  removeBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.error + '10',
    justifyContent: 'center', alignItems: 'center',
  },
  fab: {
    position: 'absolute', right: 20, bottom: 24,
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
