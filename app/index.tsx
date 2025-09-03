import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Alert, Linking, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { STRIPE_CONFIG } from '../constants/stripe';

export default function LoginScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const loginWithStripe = async () => {
    try {
      setIsLoading(true);
      const url = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${STRIPE_CONFIG.CLIENT_ID}&scope=${STRIPE_CONFIG.OAUTH_SCOPES}&redirect_uri=${STRIPE_CONFIG.REDIRECT_URI}`;
      await Linking.openURL(url);
      console.log("Loading");

    } catch (error) {
      Alert.alert('Error', 'Failed to open Stripe login');
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for OAuth redirect
  React.useEffect(() => {
    console.log("Setting up OAuth listener...");
    
    const handleUrl = async ({ url }: { url: string }) => {
      console.log("Received URL:", url);
      
      // Extract code from URL
      let code;
      if (url.includes("code=")) {
        code = url.split("code=")[1]?.split("&")[0];
      }
      
      console.log("Extracted code:", code);

      if (code) {
        // Redirect to inventory with the code
        router.push({ 
          pathname: "/inventory", 
          params: { code } 
        });
      }
    };

    const subscription = Linking.addEventListener("url", handleUrl);
    
    // Also check for initial URL in case app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("Initial URL found:", url);
        handleUrl({ url });
      }
    });
    
    return () => subscription.remove();
  }, []);

  // Check if we're coming from a failed OAuth attempt
  React.useEffect(() => {
    const checkForFailedOAuth = () => {
      // If we're on the login page and there's a code in the URL, 
      // it means we came from a failed OAuth attempt
      const url = window.location.href;
      if (url.includes('code=')) {
        console.log("Detected failed OAuth attempt, clearing URL");
        // Clear the URL by redirecting to clean login page
        window.history.replaceState({}, document.title, '/');
      }
    };

    checkForFailedOAuth();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons name="card-outline" size={80} color="#007AFF" />
          <Text style={styles.title}>TapKiosk</Text>
          <Text style={styles.subtitle}>Mobile Payment Kiosk</Text>
        </View>

        <View style={styles.loginSection}>
          <Text style={styles.description}>
            Connect your Stripe account to start accepting payments
          </Text>
          
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={loginWithStripe}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="card-outline" size={24} color="white" />
                <Text style={styles.loginButtonText}>Login with Stripe</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Secure payment processing powered by Stripe
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 8,
  },
  loginSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  description: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
