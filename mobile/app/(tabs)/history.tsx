import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, ActivityIndicator, Image, 
  TouchableOpacity, Modal, Dimensions, ScrollView 
} from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import api from '../../services/api';

const { width, height } = Dimensions.get('window');

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

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

  const renderItem = ({ item, index }) => {
    const hasImage = !!item.receipt_image;
    
    return (
      <Animated.View entering={FadeInDown.duration(300).delay(index * 80)} style={styles.card}>
        <View style={styles.cardContent}>
          {/* Left Part: 70% (or 100% if no image) */}
          <View style={[styles.detailsPart, !hasImage && { width: '100%' }]}>
            {/* Row 1: Description */}
            <View style={styles.detailRow}>
              <Text style={styles.descriptionValue} numberOfLines={2}>
                {item.description || 'No description'}
              </Text>
            </View>

            {/* Row 2: Amount */}
            <View style={styles.detailRow}>
              <Text style={styles.amountValue}>Rs {parseFloat(item.amount).toLocaleString()}</Text>
            </View>

            {/* Row 3: User */}
            <View style={styles.detailRow}>
              <Text style={styles.userValue}>
                {item.customer_name ? `👤 ${item.customer_name}` : `🛡️ ${item.user_name}`}
              </Text>
            </View>

            {/* Row 4: Date & Time */}
            <View style={styles.detailRow}>
              <Text style={styles.dateValue}>
                {new Date(item.date).toLocaleDateString()} • {new Date(item.created_at || item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            {/* Hotel items if present */}
            {item.type === 'hotel' && item.hotel_items && (
              <View style={styles.hotelSection}>
                {(typeof item.hotel_items === 'string' ? JSON.parse(item.hotel_items) : item.hotel_items).map((hi, i) => (
                  <Text key={i} style={styles.hotelItemText}>
                    • {hi.name} × {hi.quantity}
                  </Text>
                ))}
              </View>
            )}
          </View>

          {/* Right Part: 30% (Image) */}
          {hasImage && (
            <TouchableOpacity 
              style={styles.imagePart} 
              activeOpacity={0.9}
              onPress={() => setSelectedImage(item.receipt_image)}
            >
              <Image
                source={{ uri: item.receipt_image }}
                style={styles.receiptThumb}
                resizeMode="cover"
              />
              <View style={styles.zoomIconOverlay}>
                <Text style={styles.zoomIcon}>🔍</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No transactions found.</Text>
          </View>
        }
      />

      {/* Full Image Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalCloseArea} 
            activeOpacity={1} 
            onPress={() => setSelectedImage(null)} 
          />
          <Animated.View entering={ZoomIn} style={styles.modalContent}>
            {selectedImage && (
              <Image 
                source={{ uri: selectedImage }} 
                style={styles.fullImage} 
                resizeMode="contain" 
              />
            )}
            <TouchableOpacity 
              style={styles.closeBtn} 
              onPress={() => setSelectedImage(null)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    minHeight: 140,
  },
  detailsPart: {
    width: '70%',
    padding: 16,
    justifyContent: 'space-between',
  },
  imagePart: {
    width: '30%',
    backgroundColor: colors.inputBg,
    position: 'relative',
  },
  receiptThumb: {
    width: '100%',
    height: '100%',
  },
  zoomIconOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomIcon: {
    fontSize: 14,
    color: '#FFF',
  },
  detailRow: {
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  descriptionValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  userValue: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  hotelSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  hotelItemText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 16,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    position: 'absolute',
    width: width,
    height: height,
  },
  modalContent: {
    width: width * 0.95,
    height: height * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  closeBtn: {
    marginTop: 20,
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  closeBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
