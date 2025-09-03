import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fetch from "node-fetch";
import Stripe from "stripe";

// Load environment variables
dotenv.config();

const app = express();

// Enhanced CORS configuration for React Native development
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:3000', 'exp://localhost:8081'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 1) OAuth exchange
app.post("/oauth/exchange", async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const resp = await fetch("https://connect.stripe.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_secret: process.env.STRIPE_SECRET_KEY,
        code,
        grant_type: "authorization_code"
      })
    });

    const json = await resp.json();
    
    if (json.error) {
      return res.status(400).json({ error: json.error_description || json.error });
    }
    console.log('connectedAccountId', json)
  
    res.json({ connectedAccountId: json.stripe_user_id });
  } catch (error) {
    console.error('OAuth exchange error:', error);
    res.status(500).json({ error: 'Failed to exchange authorization code' });
  }
});

// 2) Terminal connection token
app.post("/terminal/connection_token", async (req, res) => {
  try {
    const { connectedAccountId } = req.body;
    
    if (!connectedAccountId) {
      return res.status(400).json({ error: 'Connected account ID is required' });
    }

    const token = await stripe.terminal.connectionTokens.create(
      {},
      { stripeAccount: connectedAccountId }
    );
    
    res.json({ secret: token.secret });
  } catch (error) {
    console.error('Connection token error:', error);
    res.status(500).json({ error: 'Failed to create connection token' });
  }
});

// 3) Create PaymentIntent
app.post("/terminal/create_intent", async (req, res) => {
  try {
    const { connectedAccountId, amount, currency } = req.body;
    
    if (!connectedAccountId || !amount || !currency) {
      return res.status(400).json({ 
        error: 'Connected account ID, amount, and currency are required' 
      });
    }

    const pi = await stripe.paymentIntents.create(
      { 
        amount, 
        currency, 
        payment_method_types: ["card_present"], 
        capture_method: "automatic" 
      },
      { stripeAccount: connectedAccountId }
    );
    
    res.json({ client_secret: pi.client_secret, id: pi.id });
  } catch (error) {
    console.error('PaymentIntent creation error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// 4) Fetch products & prices
app.get("/products", async (req, res) => {
  try {
    console.log("=== Products endpoint called ===");

    const { connectedAccountId } = req.query;
    console.log("Connected Account ID:", connectedAccountId);

    if (!connectedAccountId) {
      return res.status(400).json({ error: 'Connected account ID is required' });
    }

    console.log("Fetching products and prices from Stripe...");

    // Fetch products and prices separately for better debugging
    const products = await stripe.products.list({}, { stripeAccount: connectedAccountId });
    console.log("Products found:", products.data.length);
    console.log("Products:", JSON.stringify(products.data, null, 2));

    const prices = await stripe.prices.list({ 
      expand: ["data.product"],
      active: true 
    }, { stripeAccount: connectedAccountId });
    console.log("Prices found:", prices.data.length);
    console.log("Prices:", JSON.stringify(prices.data, null, 2));

    // Filter prices to only include those with active products
    const activePrices = prices.data.filter(price => {
      const hasProduct = price.product && typeof price.product === 'object';
      const isActive = hasProduct && price.product.active;
      console.log(`Price ${price.id}: hasProduct=${hasProduct}, isActive=${isActive}`);
      return hasProduct && isActive;
    });

    console.log("Active prices after filtering:", activePrices.length);

    res.json({ 
      products: products.data, 
      prices: activePrices 
    });
  } catch (error) {
    console.error('Products fetch error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Failed to fetch products', details: error.message });
  }
});

// 5) Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 6) Test Stripe connection
app.get("/test-stripe", async (req, res) => {
  try {
    console.log("Testing Stripe connection...");
    console.log("Stripe secret key exists:", !!process.env.STRIPE_SECRET_KEY);
    console.log("Stripe secret key starts with:", process.env.STRIPE_SECRET_KEY?.substring(0, 7));
    
    // Test basic Stripe API call
    const account = await stripe.accounts.retrieve();
    console.log("Stripe account:", account.id);
    
    res.json({ 
      status: "ok", 
      stripeConnected: true, 
      accountId: account.id,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Stripe test error:', error);
    res.status(500).json({ 
      status: "error", 
      stripeConnected: false, 
      error: error.message,
      timestamp: new Date().toISOString() 
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 TapKiosk server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
