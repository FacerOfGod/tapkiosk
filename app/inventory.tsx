import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { API_ENDPOINTS, formatCurrency, getApiUrl } from '../constants/stripe';

interface Product {
  id: string;
  name: string;
  description?: string;
  images?: string[];
}

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  product: Product;
}

interface CartItem {
  price: Price;
  quantity: number;
}



export default function InventoryScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const [prices, setPrices] = useState<Price[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [connectedAccountId, setConnectedAccountId] = useState<string>('');
  const [oauthProcessed, setOauthProcessed] = useState(false);

  // Handle OAuth redirect and code exchange
  useEffect(() => {
    const handleOAuthRedirect = async () => {
      console.log("Checking for OAuth redirect...");
      
      // Check if we have a code parameter from OAuth redirect
      const code = params.code as string;
      if (code && !oauthProcessed) {
        console.log("OAuth code found:", code);
        try {
          setLoading(true);
          
          console.log("Exchanging code for token...");
          const resp = await fetch(getApiUrl(API_ENDPOINTS.OAUTH_EXCHANGE), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          });

          console.log("Response status:", resp.status);
          
          if (!resp.ok) {
            const errorText = await resp.text();
            console.error("Exchange error:", errorText);
            throw new Error(`Failed to exchange authorization code: ${resp.status}`);
          }

          const data = await resp.json();
          console.log("Exchange response:", data);
          
          if (!data.connectedAccountId) {
            throw new Error('No connected account ID received');
          }

          console.log("Setting connected account ID:", data.connectedAccountId);
          setConnectedAccountId(data.connectedAccountId);
          setOauthProcessed(true);
          
        } catch (error) {
          console.error('OAuth error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          Alert.alert('Login Error', `Failed to complete login: ${errorMessage}`, [
            {
              text: 'Try Again',
              onPress: () => {
                setOauthProcessed(false);
                // Clear the code parameter by navigating to clean inventory URL
                router.replace('/inventory');
              }
            },
            {
              text: 'Go to Login',
              onPress: () => {
                setOauthProcessed(false);
                router.replace('/');
              }
            }
          ]);
          return;
        } finally {
          setLoading(false);
        }
      } else {
        // Check if we already have a connectedAccountId parameter
        const existingAccountId = params.connectedAccountId as string;
        if (existingAccountId) {
          console.log("Using existing connected account ID:", existingAccountId);
          setConnectedAccountId(existingAccountId);
        } else {
          console.log("No OAuth code or account ID found, showing login prompt");
          // No OAuth code or account ID, show a message and redirect to login
          Alert.alert('Login Required', 'Please log in with your Stripe account to continue.', [
            {
              text: 'Go to Login',
              onPress: () => router.replace('/')
            }
          ]);
        }
      }
    };

    handleOAuthRedirect();
  }, [params.code, params.connectedAccountId, oauthProcessed]);

  useEffect(() => {
    if (connectedAccountId) {
      fetchInventory();
      checkServerHealth();
    }
  }, [connectedAccountId]);

  const checkServerHealth = async () => {
    try {
      const healthUrl = getApiUrl(API_ENDPOINTS.HEALTH);
      console.log("Checking server health at:", healthUrl);
      
      const response = await fetch(healthUrl);
      if (response.ok) {
        console.log("Server is healthy");
        await fetchInventory();
      } else {
        throw new Error(`Server health check failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Server health check error:", error);
      Alert.alert(
        'Server Error', 
        'Cannot connect to server. Please make sure the server is running on port 3000.'
      );
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchInventory = async (isRefresh = true) => {
    try {
      console.log("ConnectedAccountID:", connectedAccountId);

      if (!connectedAccountId) {
        throw new Error('No connected account ID in Inventory');
      }

      const url = getApiUrl(API_ENDPOINTS.PRODUCTS) + `?connectedAccountId=${connectedAccountId}`;
      console.log("Fetching from URL:", url);

      const response = await fetch(url);
      console.log("Response status:", response.status);
      console.log("Response response:", response);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response data:", data);
      
      if (!data.prices) {
        throw new Error('No prices data received');
      }
      
      setPrices(data.prices);
    } catch (error) {
      console.error('Inventory fetch error:', error);
      Alert.alert('Error', 'Failed to load inventory. Please check your connection and try again.');
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInventory(true);
    await checkServerHealth();
  };

  const addToCart = (price: Price) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.price.id === price.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.price.id === price.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { price, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (priceId: string) => {
    setCart(prevCart => prevCart.filter(item => item.price.id !== priceId));
  };

  const updateQuantity = (priceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(priceId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.price.id === priceId ? { ...item, quantity } : item
      )
    );
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price.unit_amount * item.quantity), 0);
  };



  const handlePayment = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before proceeding to payment.');
      return;
    }

    setProcessingPayment(true);
    try {
      const totalAmount = getTotalAmount();
      
      // Create PaymentIntent
      const response = await fetch(getApiUrl(API_ENDPOINTS.TERMINAL_CREATE_INTENT), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectedAccountId,
          amount: totalAmount,
          currency: cart[0].price.currency,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create payment intent: ${response.status}`);
      }

      const { client_secret, id } = await response.json();
      
      if (!client_secret || !id) {
        throw new Error('Invalid payment intent response');
      }
      
      // Navigate to payment screen
      router.push({
        pathname: '/payment',
        params: {
          clientSecret: client_secret,
          paymentIntentId: id,
          connectedAccountId: connectedAccountId as string,
          totalAmount: totalAmount.toString(),
          currency: cart[0].price.currency,
        }
      });
    } catch (error) {
      Alert.alert('Payment Error', 'Failed to initialize payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const renderProduct = ({ item }: { item: Price }) => (
    <View style={styles.productCard}>
      <View style={styles.productImageContainer}>
        {item.product.images && item.product.images.length > 0 ? (
          <Image source={{ uri: item.product.images[0] }} style={styles.productImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={40} color="#ccc" />
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.product.name}</Text>
        {item.product.description && (
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.product.description}
          </Text>
        )}
        <Text style={styles.productPrice}>{formatCurrency(item.unit_amount, item.currency)}</Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => addToCart(item)}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{item.price.product.name}</Text>
        <Text style={styles.cartItemPrice}>
          {formatCurrency(item.price.unit_amount, item.price.currency)}
        </Text>
      </View>
      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.price.id, item.quantity - 1)}
        >
          <Ionicons name="remove" size={20} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.price.id, item.quantity + 1)}
        >
          <Ionicons name="add" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  if (!connectedAccountId) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle" size={64} color="#FF3B30" />
        <Text style={styles.loadingText}>No merchant account connected</Text>
        <Text style={styles.errorSubtext}>Please log in with your Stripe account</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TapKiosk</Text>
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{cart.length}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.inventorySection}>
          <Text style={styles.sectionTitle}>Products</Text>
          <FlatList
            data={prices}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.productGrid}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        </View>

        {cart.length > 0 && (
          <View style={styles.cartSection}>
            <Text style={styles.sectionTitle}>Cart</Text>
            <FlatList
              data={cart}
              renderItem={renderCartItem}
              keyExtractor={(item) => item.price.id}
              showsVerticalScrollIndicator={false}
            />
            <View style={styles.cartTotal}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(getTotalAmount(), cart[0].price.currency)}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.payButton, processingPayment && styles.payButtonDisabled]}
              onPress={handlePayment}
              disabled={processingPayment}
            >
              {processingPayment ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="card-outline" size={24} color="white" />
                  <Text style={styles.payButtonText}>Tap to Pay</Text>
                </>
              )}
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  cartBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  inventorySection: {
    flex: 2,
    padding: 16,
  },
  cartSection: {
    flex: 1,
    backgroundColor: 'white',
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  productGrid: {
    paddingBottom: 16,
  },
  productCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  productDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },
  cartTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  payButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
