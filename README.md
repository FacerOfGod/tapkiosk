# TapKiosk - Mobile NFC Payment Kiosk

A modern mobile kiosk application that allows merchants to accept NFC tap-to-pay payments directly on their mobile devices using Stripe Terminal.

## Features

- 🔐 **Stripe OAuth Login** - Secure merchant authentication
- 📱 **Mobile-First Interface** - Optimized for mobile kiosk usage
- 🛒 **Shopping Cart** - Add/remove items with quantity controls
- 💳 **NFC Tap-to-Pay** - Accept contactless payments via Stripe Terminal
- 📊 **Real-time Inventory** - Fetch products and prices from Stripe
- 🎨 **Modern UI/UX** - Beautiful, intuitive interface

## Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- Stripe account with Terminal enabled
- Stripe Terminal reader (physical device for testing)
- iOS device with NFC capabilities (for real payments)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd TapKiosk
npm install
```

### 2. Server Setup

```bash
cd server
npm install
```

Create a `.env` file in the server directory:

```bash
cp env.example .env
```

Edit `.env` with your Stripe configuration:

```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
PORT=3000
NODE_ENV=development
```

### 3. Stripe Configuration

1. **Create a Stripe Connect Application**:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/apps)
   - Create a new Connect application
   - Note your Client ID

2. **Enable Stripe Terminal**:
   - In your Stripe Dashboard, go to Terminal
   - Request access if not already enabled
   - Create a location for your terminal

3. **Update OAuth Configuration**:
   - In `app/index.tsx`, update `STRIPE_CLIENT_ID` with your Connect app client ID
   - Set redirect URI to `tapkiosk://oauth-callback`

4. **Get Terminal Location ID**:
   - In Stripe Dashboard → Terminal → Locations
   - Copy the location ID and update it in `app/payment.tsx`

### 4. Start the Development Server

```bash
# Terminal 1: Start the backend server
cd server
npm start

# Terminal 2: Start the Expo development server
cd ..
npm start
```

### 5. Test the Application

1. **Simulator Testing**:
   - Use Expo Go app or iOS Simulator
   - Test the OAuth flow and inventory display

2. **Real Device Testing**:
   - Connect a Stripe Terminal reader
   - Test NFC payments with real cards

## Project Structure

```
TapKiosk/
├── app/                    # Expo Router screens
│   ├── index.tsx          # Login screen with Stripe OAuth
│   ├── inventory.tsx      # Product catalog and shopping cart
│   ├── payment.tsx        # NFC payment processing
│   └── _layout.tsx        # App layout configuration
├── server/                # Backend API
│   ├── index.js           # Express server with Stripe integration
│   ├── package.json       # Server dependencies
│   └── env.example        # Environment variables template
├── components/            # Reusable React components
├── constants/             # App constants and configuration
└── package.json           # Main app dependencies
```

## API Endpoints

### Backend Server (`http://localhost:3000`)

- `POST /oauth/exchange` - Exchange OAuth code for connected account
- `POST /terminal/connection_token` - Get Terminal connection token
- `POST /terminal/create_intent` - Create PaymentIntent for payment
- `GET /products` - Fetch merchant's products and prices
- `GET /health` - Health check endpoint

## Stripe Integration

### OAuth Flow
1. Merchant logs in with Stripe Connect
2. App receives connected account ID
3. All subsequent API calls use the connected account

### Terminal Integration
1. Initialize Stripe Terminal SDK
2. Discover and connect to readers
3. Create PaymentIntent with card_present method
4. Collect payment method via NFC
5. Process payment automatically

### Product Management
- Products and prices are fetched from the merchant's Stripe account
- Only active products with valid prices are displayed
- Real-time inventory updates

## Development

### Adding New Features

1. **New Screens**: Add to `app/` directory with Expo Router
2. **API Endpoints**: Add to `server/index.js`
3. **Components**: Add to `components/` directory

### Testing

```bash
# Run linting
npm run lint

# Test on iOS
npm run ios

# Test on Android
npm run android

# Test on web
npm run web
```

## Troubleshooting

### Common Issues

1. **OAuth Redirect Issues**:
   - Ensure redirect URI matches exactly in Stripe Dashboard
   - Check that the scheme is properly configured in `app.json`

2. **Terminal Connection Issues**:
   - Verify Terminal is enabled in Stripe Dashboard
   - Check location ID is correct
   - Ensure reader is powered on and nearby

3. **Payment Processing Issues**:
   - Verify connected account has proper permissions
   - Check that card_present payment method is enabled
   - Ensure test cards are used in development

### Debug Mode

Enable detailed logging by setting `NODE_ENV=development` in your `.env` file.

## Production Deployment

### Backend Deployment
- Deploy server to your preferred hosting platform
- Set production environment variables
- Configure CORS for your domain

### Mobile App Deployment
- Build production app with `expo build`
- Configure app signing for iOS/Android
- Update API endpoints to production URLs

## Security Considerations

- Never expose Stripe secret keys in client-side code
- Use environment variables for sensitive configuration
- Implement proper error handling and validation
- Follow Stripe's security best practices

## Support

For issues related to:
- **Stripe Integration**: Check [Stripe Documentation](https://stripe.com/docs)
- **Expo/React Native**: Check [Expo Documentation](https://docs.expo.dev)
- **Terminal SDK**: Check [Stripe Terminal Documentation](https://stripe.com/docs/terminal)

## License

This project is licensed under the MIT License. @2025
