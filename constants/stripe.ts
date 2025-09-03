// Stripe Configuration Constants
export const STRIPE_CONFIG = {
  // Update this with your Stripe Connect application client ID
  CLIENT_ID: 'ca_SvC1gmka3EzSuTjp0YjiCNRsU7rMtSzi',
  
  // OAuth redirect URI - must match your Stripe Connect app configuration
  REDIRECT_URI: 'http://localhost:8081/inventory',
  
  // API base URL - change this for production
  API_BASE_URL: 'http://localhost:3000',
  
  // OAuth scopes - adjust based on your needs
  OAUTH_SCOPES: 'read_write',
  
  // Terminal configuration
  TERMINAL: {
    // Update this with your Terminal location ID from Stripe Dashboard
    LOCATION_ID: 'tml_1234567890',
    
    // Discovery method for readers
    DISCOVERY_METHOD: 'LocalMobile',
    
    // Enable simulated mode for testing (set to false for production)
    SIMULATED: false,
  },
};

// Payment configuration
export const PAYMENT_CONFIG = {
  // Supported currencies
  SUPPORTED_CURRENCIES: ['usd', 'eur', 'gbp', 'cad', 'aud'],
  
  // Default currency
  DEFAULT_CURRENCY: 'usd',
  
  // Minimum payment amount (in cents)
  MIN_AMOUNT: 50,
  
  // Maximum payment amount (in cents) - $10,000
  MAX_AMOUNT: 1000000,
};

// API endpoints
export const API_ENDPOINTS = {
  OAUTH_EXCHANGE: '/oauth/exchange',
  TERMINAL_CONNECTION_TOKEN: '/terminal/connection_token',
  TERMINAL_CREATE_INTENT: '/terminal/create_intent',
  PRODUCTS: '/products',
  HEALTH: '/health',
  TEST_STRIPE: '/test-stripe',
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${STRIPE_CONFIG.API_BASE_URL}${endpoint}`;
};

// Helper function to format currency
export const formatCurrency = (amount: number, currency: string = 'usd'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

// Helper function to validate amount
export const validateAmount = (amount: number): boolean => {
  return amount >= PAYMENT_CONFIG.MIN_AMOUNT && amount <= PAYMENT_CONFIG.MAX_AMOUNT;
};
