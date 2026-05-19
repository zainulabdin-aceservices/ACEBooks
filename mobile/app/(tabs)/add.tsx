// =============================================
// ADD EXPENSE SCREEN - Manual, Hotel, & Camera
// =============================================
// This screen has 3 modes:
//   1. Manual Entry  - type amount & description
//   2. Hotel Entry   - pick dishes from menu
//   3. Receipt Scan  - camera/gallery + OCR
// =============================================
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ScrollView, Image, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../store/AuthContext';
import ReceiptScanner from '../../components/ReceiptScanner';

export default function AddScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // ---- State ----
  const [mode, setMode] = useState('manual'); // 'manual' | 'hotel' | 'receipt'
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Hotel mode state
  const [dishes, setDishes] = useState([]);       // { name, rate, quantity }
  const [hotelTotal, setHotelTotal] = useState(0);

  // Receipt mode state
  const [receiptImage, setReceiptImage] = useState(null); // base64 string
  const [receiptUri, setReceiptUri] = useState(null);      // for preview

  // ---- Fetch customers and hotel config on load ----
  useFocusEffect(
    useCallback(() => {
      if (user?.role?.toLowerCase() === 'admin') {
        fetchCustomers();
      }
      fetchHotelConfig();
    }, [user])
  );

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
      if (res.data.length > 0) setSelectedCustomer(res.data[0].id);
    } catch (e) {
      console.log('Error fetching customers', e);
    }
  };

  const fetchHotelConfig = async () => {
    try {
      const res = await api.get('/config/hotel');
      const config = res.data;
      
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[new Date().getDay()];
      
      const allDishes = config.dishes || [];
      const scheduledNames = config.schedule?.[today] || [];
      
      // Filter dishes that are scheduled for today
      const todayDishes = allDishes.filter(d => scheduledNames.includes(d.name));
      
      // Add quantity = 0 to each dish for tracking
      const dishesWithQty = todayDishes.map(d => ({ ...d, quantity: 0 }));
      setDishes(dishesWithQty);
    } catch (e) {
      console.log('Error fetching hotel config', e);
    }
  };

  // ---- Hotel helpers ----
  const updateDishQty = (index, delta) => {
    const updated = [...dishes];
    // Use 0.5 increments as requested
    const step = 0.5;
    const currentQty = parseFloat(updated[index].quantity) || 0;
    const newQty = Math.max(0, currentQty + (delta > 0 ? step : -step));
    updated[index].quantity = parseFloat(newQty.toFixed(1)); // Handle float precision
    setDishes(updated);

    // Recalculate total
    const total = updated.reduce((sum, d) => sum + (parseFloat(d.quantity) || 0) * d.rate, 0);
    setHotelTotal(total);
  };

  // ---- Callbacks for ReceiptScanner ----
  const handleReceiptScan = (scannedAmount, scannedDescription) => {
    if (scannedAmount) setAmount(scannedAmount);
    if (scannedDescription) setDescription(scannedDescription);
  };

  const handleImageCaptured = (base64, uri) => {
    setReceiptImage(base64);
    setReceiptUri(uri);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---- Submit ----
  const handleSubmit = async () => {
    console.log('Submitting expense...', { mode, amount, selectedCustomer, role: user?.role });

    let finalAmount = 0;
    let finalDescription = description;
    let hotelItems = null;

    if (mode === 'hotel') {
      finalAmount = hotelTotal;
      finalDescription = 'Hotel Order';
      hotelItems = dishes.filter(d => (parseFloat(d.quantity) || 0) > 0).map(d => ({
        name: d.name,
        quantity: parseFloat(d.quantity) || 0,
        rate: d.rate,
      }));
      if (hotelItems.length === 0) {
        Alert.alert('Error', 'Please add at least one dish');
        return;
      }
    } else {
      // Clean amount string from OCR artifacts (spaces, commas, symbols)
      const cleanAmount = amount.replace(/[^\d.]/g, '');
      finalAmount = parseFloat(cleanAmount);
      
      if (!finalAmount || finalAmount <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerId: user?.role?.toLowerCase() === 'admin' ? selectedCustomer : null, // Users are "Self"
        amount: finalAmount,
        description: finalDescription,
        date: new Date().toISOString().split('T')[0],
        type: mode, // 'manual', 'hotel', or 'receipt'
        hotelItems: hotelItems,
        receiptImage: receiptImage || null,
      };
      
      console.log('Sending payload:', { ...payload, receiptImage: payload.receiptImage ? 'exists' : 'null' });
      
      await api.post('/transactions', payload);
      
      Alert.alert('✅ Success', 'Expense added successfully!');
      
      // Reset form
      setAmount('');
      setDescription('');
      setReceiptImage(null);
      setReceiptUri(null);
      setDishes(dishes.map(d => ({ ...d, quantity: 0 })));
      setHotelTotal(0);
      
      // Go to history tab
      router.push('/history');
    } catch (error) {
      console.error('Submission error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.error || 'Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =============================================
  // RENDER
  // =============================================
  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: colors.background }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 70}
    >
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
      {/* Mode Selector Tabs */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContainer}>
        {['manual', 'hotel', 'receipt'].map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.tab, mode === m && styles.activeTab]}
            onPress={() => setMode(m)}
          >
            <Text style={[styles.tabText, mode === m && styles.activeTabText]}>
              {m === 'manual' ? '✏️ Manual' : m === 'hotel' ? '🍽️ Hotel' : '📷 Receipt'}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* ---- Customer Selector (ADMIN ONLY) ---- */}
      {user?.role?.toLowerCase() === 'admin' && (
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Text style={styles.sectionTitle}>Select Customer</Text>
          {customers.length === 0 ? (
            <View style={styles.emptyCustomerCard}>
              <Text style={styles.emptyCustomerText}>⚠️ No customers found</Text>
              <Text style={styles.emptyCustomerSubtext}>Go to Settings &gt; Manage Customers to add one first.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {customers.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, selectedCustomer === c.id && styles.chipActive]}
                  onPress={() => setSelectedCustomer(c.id)}
                >
                  <Text style={[styles.chipText, selectedCustomer === c.id && styles.chipTextActive]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      )}

      {/* ---- MANUAL MODE ---- */}
      {mode === 'manual' && (
        <Animated.View style={styles.card} entering={FadeInDown.duration(400).delay(200)}>
          <Text style={styles.cardTitle}>✏️ Manual Entry</Text>
          
          <ReceiptScanner 
            onScan={handleReceiptScan}
            onImageCaptured={handleImageCaptured}
            initialUri={receiptUri}
          />

          <View style={styles.divider} />

          <Text style={styles.label}>Amount (Rs)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            placeholderTextColor={colors.textLight}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="What was this for?"
            value={description}
            onChangeText={setDescription}
            multiline
            placeholderTextColor={colors.textLight}
          />
        </Animated.View>
      )}

      {/* ---- HOTEL MODE ---- */}
      {mode === 'hotel' && (
        <Animated.View style={styles.card} entering={FadeInDown.duration(400).delay(200)}>
          <Text style={styles.cardTitle}>🍽️ Hotel Menu</Text>
          {dishes.length === 0 ? (
            <Text style={styles.emptyText}>No dishes configured. Ask Admin to add dishes.</Text>
          ) : (
            dishes.map((dish, index) => (
              <View key={index} style={styles.dishRow}>
                <View style={styles.dishInfo}>
                  <Text style={styles.dishName}>{dish.name}</Text>
                  <Text style={styles.dishRate}>Rs {dish.rate} each</Text>
                </View>
                <View style={styles.qtyControls}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateDishQty(index, -1)}>
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.qtyInput}
                    keyboardType="numeric"
                    value={dish.quantity?.toString() || ''}
                    onChangeText={(val) => {
                      const updated = [...dishes];
                      updated[index].quantity = val;
                      setDishes(updated);
                      const total = updated.reduce((sum, d) => sum + (parseFloat(d.quantity) || 0) * d.rate, 0);
                      setHotelTotal(total);
                    }}
                  />
                  <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnPlus]} onPress={() => updateDishQty(index, 1)}>
                    <Text style={[styles.qtyBtnText, styles.qtyBtnPlusText]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {/* Hotel Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>Rs {hotelTotal.toLocaleString()}</Text>
          </View>
        </Animated.View>
      )}

      {/* ---- RECEIPT MODE ---- */}
      {mode === 'receipt' && (
        <Animated.View style={styles.card} entering={FadeInDown.duration(400).delay(200)}>
          <Text style={styles.cardTitle}>📷 Scan Receipt</Text>

          <ReceiptScanner 
            onScan={handleReceiptScan}
            onImageCaptured={handleImageCaptured}
            initialUri={receiptUri}
          />

          <View style={styles.divider} />

          {/* Editable fields after OCR */}
          <Text style={styles.label}>Store Name / Description</Text>
          <TextInput
            style={styles.input}
            placeholder="Auto-filled from receipt"
            value={description}
            onChangeText={setDescription}
            placeholderTextColor={colors.textLight}
          />

          <Text style={styles.label}>Total Amount (Rs)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            placeholderTextColor={colors.textLight}
          />
        </Animated.View>
      )}

      {/* ---- Submit Button ---- */}
      <Animated.View entering={FadeInUp.duration(400).delay(300)}>
        <TouchableOpacity 
          style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]} 
          onPress={handleSubmit} 
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Expense</Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: '#FFF',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  chipScroll: {
    marginBottom: 16,
  },
  chip: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    color: colors.text,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    padding: 20,
  },

  // Hotel styles
  dishRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  dishInfo: {},
  dishName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  dishRate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnPlus: {
    backgroundColor: colors.primary,
  },
  qtyBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  qtyBtnPlusText: {
    color: '#FFF',
  },
  qtyInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    minWidth: 44,
    textAlign: 'center',
    padding: 0,
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    height: 36,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: colors.primary + '30',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },

  // Camera / Receipt styles
  cameraButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  cameraBtn: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  cameraBtnIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  cameraBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 16,
    opacity: 0.5,
  },
  receiptPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: colors.inputBg,
  },
  ocrLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  ocrText: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Submit
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  emptyCustomerCard: {
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyCustomerText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  emptyCustomerSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
