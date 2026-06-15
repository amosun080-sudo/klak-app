# Klak Mobile Development Guide

## 🚀 Running the App

### **Option 1: Start with Tunnel (Recommended for Mobile Testing)**
```bash
npm run start:tunnel
```
**Benefits:**
- Works even if devices are on different networks
- Better connectivity for testing on physical devices
- Bypasses local network issues

### **Option 2: Regular Start (LAN)**
```bash
npm start
```
**Benefits:**
- Faster reload times
- Works well when devices are on same WiFi

### **Option 3: Web Development**
```bash
npm run web
```
**Note:** Web development has CORS limitations with the backend. Best for UI testing only.

## 📱 Testing on Devices

### **Android**
1. Install Expo Go app from Play Store
2. Run `npm run start:tunnel`
3. Scan QR code with Expo Go app

### **iOS**
1. Install Expo Go app from App Store  
2. Run `npm run start:tunnel`
3. Scan QR code with iPhone Camera app

### **Android Emulator**
```bash
npm run android
```

### **iOS Simulator**
```bash
npm run ios
```

## 🔧 Known Issues & Solutions

### **CORS Error on Web**
**Problem:** "Access to XMLHttpRequest... has been blocked by CORS policy"

**Solution:** 
- ✅ Use mobile devices for testing (no CORS restrictions)
- ✅ Use tunnel mode: `npm run start:tunnel`
- ⏳ Backend team needs to add CORS headers for localhost

### **Connection Issues**
**Problem:** "Could not connect to the server"

**Solutions:**
1. Check `.env.local` has correct API URL
2. Use tunnel mode: `npm run start:tunnel`
3. Ensure device has internet connection
4. Try restarting Expo server

### **QR Code Not Working**
**Solutions:**
1. Use tunnel mode: `npm run start:tunnel`
2. Make sure Expo Go app is installed
3. Check devices are connected to internet
4. Try manual connection in Expo Go

## 📋 Development Workflow

### **1. Start Development Server**
```bash
cd klak-mobile-main
npm run start:tunnel
```

### **2. Open on Device**
- Scan QR code with Expo Go (Android) or Camera (iOS)
- Wait for bundle to load

### **3. Test Features**
- ✅ Authentication (Login/Register/OTP)
- ✅ Account linking
- ✅ Budgets and transactions
- ✅ Insights and alerts
- ✅ Settings and profile

### **4. Hot Reload**
- Save files and app reloads automatically
- Press 'r' in terminal to manually reload
- Press 'm' to open dev menu on device

## 🌐 Environment Configuration

Current API: `https://klak-backend.onrender.com`

To change API URL, edit `.env.local`:
```env
EXPO_PUBLIC_API_BASE_URL=https://your-api-url.com
```

Then restart the Expo server.

## 🛠️ Troubleshooting Commands

```bash
# Clear cache and restart
npx expo start --clear

# Reset everything
rm -rf node_modules
npm install
npx expo start --tunnel

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 📊 Current Status

✅ **Working Features:**
- Complete UI implementation
- Navigation system
- Form validation
- Offline caching
- FCM notifications
- All screens implemented

⚠️ **Known Limitations:**
- Web version has CORS restrictions
- Requires backend CORS configuration for web development

## 🎯 Recommended Testing Approach

1. **Primary:** Use physical devices with tunnel mode
2. **Secondary:** Use emulators/simulators
3. **UI Only:** Use web browser for quick UI checks

---

**For API testing, always use mobile devices or emulators!** 📱
