import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { formatCurrency } from '../constants/stripe';

const { width, height } = Dimensions.get('window');

export default function PaymentScreen() {
  const { clientSecret, paymentIntentId, connectedAccountId, totalAmount, currency } = useLocalSearchParams();
  const router = useRouter();
  
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Simulate payment processing for demo purposes
    // In a real implementation, this would integrate with Stripe Terminal SDK
    setTimeout(() => {
      setPaymentStatus('processing');
      setTimeout(() => {
        setPaymentStatus('success');
      }, 2000);
    }, 1000);
  }, []);

  const handlePayment = async () => {
    try {
      setPaymentStatus('processing');

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      setPaymentStatus('success');
      
      // Show success message and navigate back
      setTimeout(() => {
        Alert.alert(
          'Payment Successful!',
          `Payment of ${formatCurrency(parseInt(totalAmount as string), currency as string)} has been processed.`,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }, 1000);

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed');
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'processing':
        return '#007AFF';
      case 'success':
        return '#34C759';
      case 'error':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = () => {
    switch (paymentStatus) {
      case 'idle':
        return 'Initializing Payment...';
      case 'processing':
        return 'Processing Payment...';
      case 'success':
        return 'Payment Successful!';
      case 'error':
        return 'Error Occurred';
      default:
        return 'Unknown Status';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        </View>
      </View>

      <View style={styles.content}>
        {/* Payment Amount Display */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(parseInt(totalAmount as string), currency as string)}
          </Text>
        </View>

        {/* Status Display */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
          {paymentStatus === 'processing' && (
            <ActivityIndicator size="small" color="#007AFF" style={styles.statusSpinner} />
          )}
        </View>

        {/* Payment Instructions */}
        {paymentStatus === 'idle' && (
          <View style={styles.instructionsContainer}>
            <Ionicons name="card-outline" size={64} color="#007AFF" />
            <Text style={styles.instructionsTitle}>Ready for Payment</Text>
            <Text style={styles.instructionsText}>
              This is a demo payment screen. In a real implementation, 
              this would integrate with Stripe Terminal for NFC payments.
            </Text>
            
            <TouchableOpacity
              style={styles.payButton}
              onPress={handlePayment}
            >
              <Ionicons name="card-outline" size={32} color="white" />
              <Text style={styles.payButtonText}>Simulate Payment</Text>
              <Text style={styles.payButtonSubtext}>
                Demo payment processing
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error Display */}
        {paymentStatus === 'error' && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#FF3B30" />
            <Text style={styles.errorTitle}>Payment Error</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => setPaymentStatus('idle')}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Success Display */}
        {paymentStatus === 'success' && (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#34C759" />
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successMessage}>
              Your payment has been processed successfully.
            </Text>
            <Text style={styles.successSubtext}>
              This was a demo payment. In production, this would be a real NFC transaction.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  amountLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  statusText: {
    fontSize: 18,
    color: '#333',
    marginRight: 8,
  },
  statusSpinner: {
    marginLeft: 8,
  },
  instructionsContainer: {
    alignItems: 'center',
    padding: 32,
  },
  instructionsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  payButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: width * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  payButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  payButtonSubtext: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    padding: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34C759',
    marginTop: 16,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
