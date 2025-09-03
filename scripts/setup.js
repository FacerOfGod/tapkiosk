#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 TapKiosk Setup Script');
console.log('========================\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.error('❌ Node.js 18 or higher is required. Current version:', nodeVersion);
  process.exit(1);
}

console.log('✅ Node.js version:', nodeVersion);

// Install main app dependencies
console.log('\n📦 Installing main app dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Main app dependencies installed');
} catch (error) {
  console.error('❌ Failed to install main app dependencies');
  process.exit(1);
}

// Install server dependencies
console.log('\n📦 Installing server dependencies...');
try {
  execSync('npm install', { cwd: './server', stdio: 'inherit' });
  console.log('✅ Server dependencies installed');
} catch (error) {
  console.error('❌ Failed to install server dependencies');
  process.exit(1);
}

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '../server/.env');
const envExamplePath = path.join(__dirname, '../server/env.example');

if (!fs.existsSync(envPath)) {
  console.log('\n📝 Creating .env file...');
  try {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created from template');
    console.log('⚠️  Please update server/.env with your Stripe configuration');
  } catch (error) {
    console.error('❌ Failed to create .env file');
  }
} else {
  console.log('✅ .env file already exists');
}

// Check if Expo CLI is installed
console.log('\n🔍 Checking Expo CLI...');
try {
  execSync('expo --version', { stdio: 'pipe' });
  console.log('✅ Expo CLI is installed');
} catch (error) {
  console.log('⚠️  Expo CLI not found. Installing globally...');
  try {
    execSync('npm install -g @expo/cli', { stdio: 'inherit' });
    console.log('✅ Expo CLI installed globally');
  } catch (installError) {
    console.error('❌ Failed to install Expo CLI. Please install manually: npm install -g @expo/cli');
  }
}

console.log('\n🎉 Setup complete!');
console.log('\nNext steps:');
console.log('1. Update server/.env with your Stripe secret key');
console.log('2. Configure your Stripe Connect application');
console.log('3. Start the server: cd server && npm start');
console.log('4. Start the app: npm start');
console.log('\n📚 See README.md for detailed setup instructions');
