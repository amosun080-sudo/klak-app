import 'tsx/cjs';
import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Klak',
  slug: 'klak-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  platforms: ['ios', 'android'],
  splash: {
    resizeMode: 'contain',
    backgroundColor: '#060E07',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'ng.getklak.app',
    buildNumber: '1',
    infoPlist: {
      NSFaceIDUsageDescription: 'Used for biometric login',
      NSCameraUsageDescription: 'Used to scan QR codes for account linking',
    },
  },
  android: {
    package: 'ng.getklak.app',
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#060E07',
    },
    permissions: [
      'android.permission.INTERNET',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.VIBRATE',
    ],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        color: '#00D68F',
      },
    ],
  ],
  scheme: 'klak',
  experiments: {
    typedRoutes: false,
  },
  extra: {
    apiBaseUrl:     process.env.EXPO_PUBLIC_API_BASE_URL,
    monoPublicKey:  process.env.EXPO_PUBLIC_MONO_PUBLIC_KEY,
    googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    eas: {
      // Replace with your actual EAS project ID from: npx eas init
      projectId: process.env.EAS_PROJECT_ID ?? 'YOUR_EAS_PROJECT_ID',
    },
  },
};

export default config;
