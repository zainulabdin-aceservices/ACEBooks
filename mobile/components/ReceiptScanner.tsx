import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import api from '../services/api';

interface ReceiptScannerProps {
  onScan: (amount: string, description: string) => void;
  onImageCaptured: (base64: string | null, uri: string | null) => void;
  initialUri?: string | null;
}

export default function ReceiptScanner({ 
  onScan, 
  onImageCaptured, 
  initialUri,
}: ReceiptScannerProps) {
  const [loading, setLoading] = useState(false);
  const [previewUri, setPreviewUri] = React.useState(initialUri || null);

  // Sync internal preview with prop if it changes externally (e.g. switching tabs)
  React.useEffect(() => {
    setPreviewUri(initialUri || null);
  }, [initialUri]);

  const pickImage = async (fromCamera: boolean) => {
    try {
      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission Denied', 'Camera access is required.');
          return;
        }
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.6 })
        : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.6 });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPreviewUri(asset.uri);
        const base64 = `data:image/jpeg;base64,${asset.base64}`;
        onImageCaptured(base64, asset.uri);
        runOCR(asset.base64);
      }
    } catch (e) {
      console.log('Image picker error', e);
    }
  };

  const runOCR = async (base64Data: string) => {
    setLoading(true);
    try {
      const res = await api.post('/transactions/parse-receipt', { image: base64Data });
      const { storeName, totalAmount } = res.data;
      
      onScan(totalAmount?.toString() || '', storeName || '');
      
      if (storeName || totalAmount) {
        Alert.alert('Receipt Parsed', `Store: ${storeName || 'Unknown'}\nTotal: Rs ${totalAmount || 'Not found'}`);
      }
    } catch (e) {
      console.log('OCR error:', e);
      Alert.alert('OCR Info', 'Could not auto-parse receipt. Please enter details manually.');
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setPreviewUri(null);
    onImageCaptured(null, null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraButtons}>
        <TouchableOpacity style={styles.cameraBtn} onPress={() => pickImage(true)}>
          <Text style={styles.cameraBtnIcon}>📸</Text>
          <Text style={styles.cameraBtnText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cameraBtn} onPress={() => pickImage(false)}>
          <Text style={styles.cameraBtnIcon}>🖼️</Text>
          <Text style={styles.cameraBtnText}>Gallery</Text>
        </TouchableOpacity>
      </View>

      {previewUri && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: previewUri }} style={styles.receiptPreview} resizeMode="contain" />
          <TouchableOpacity style={styles.clearBtn} onPress={clearImage}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={styles.ocrLoading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.ocrText}>Analyzing receipt...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  cameraButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  cameraBtn: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  cameraBtnIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  cameraBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  previewContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  receiptPreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: colors.inputBg,
  },
  clearBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ocrLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 8,
    backgroundColor: colors.primary + '10',
    borderRadius: 10,
    marginBottom: 12,
  },
  ocrText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
