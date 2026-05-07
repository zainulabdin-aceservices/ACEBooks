// =============================================
// HISTORY SCREEN - Animated transaction cards
// =============================================
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import api from '../../services/api';

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.log('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderItem = ({ item, index }) => (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 80)} style={styles.card}>
      {/* Top Row: Date and Amount */}
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
        <Text style={styles.amount}>Rs {parseFloat(item.amount).toLocaleString()}</Text>
      </View>

      {/* Description */}
      <Text style={styles.description}>{item.description || 'No description'}</Text>

      {/* Receipt thumbnail if available */}
      {item.receipt_image && (
        <Image
          source={{ uri: item.receipt_image }}
          style={styles.receiptThumb}
          resizeMode="cover"
        />
      )}

      {/* Footer: Type badge and customer */}
      <View style={styles.cardFooter}>
        <View style={[
          styles.badge, 
          item.type === 'hotel' ? styles.badgeHotel : 
          item.type === 'receipt' ? styles.badgeReceipt : 
          styles.badgeManual
        ]}>
          <Text style={[
            styles.badgeText, 
            item.type === 'hotel' ? styles.badgeHotelText : 
            item.type === 'receipt' ? styles.badgeReceiptText : 
            styles.badgeManualText
          ]}>
            {item.type.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.customer}>{item.customer_name || '👤 Self'}</Text>
      </View>

      {/* Hotel items breakdown if it's a hotel type */}
      {item.type === 'hotel' && item.hotel_items && (
        <View style={styles.hotelBreakdown}>
          {(typeof item.hotel_items === 'string' ? JSON.parse(item.hotel_items) : item.hotel_items).map((hi, i) => (
            <Text key={i} style={styles.hotelItem}>
              {hi.name} × {hi.quantity} = Rs {hi.quantity * hi.rate}
            </Text>
          ))}
        </View>
      )}
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No transactions found.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  date: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  amount: {
    fontWeight: 'bold',
    fontSize: 20,
    color: colors.primary,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    fontWeight: '500',
  },
  receiptThumb: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: colors.inputBg,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeManual: {
    backgroundColor: colors.primary + '18',
  },
  badgeHotel: {
    backgroundColor: colors.info + '18',
  },
  badgeReceipt: {
    backgroundColor: colors.success + '18',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgeManualText: {
    color: colors.primary,
  },
  badgeHotelText: {
    color: colors.info,
  },
  badgeReceiptText: {
    color: colors.success,
  },
  customer: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  hotelBreakdown: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  hotelItem: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});
