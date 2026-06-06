import 'tsx/cjs'; // Add this to import TypeScript files
import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Klak',
  slug: 'klak-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  platforms: ['ios', 'android', 'web'],
  splash: {
    resizeMode: 'contain',
    backgroundColor: '#071B11',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'ng.getklak.app',
    infoPlist: {
      NSFaceIDUsageDescription: 'Used for biometric login',
    },
  },
  android: {
    package: 'ng.getklak.app',
    permissions: [
      'android.permission.INTERNET',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.VIBRATE',
    ],
  },
  web: {
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-notifications',
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
      projectId: 'YOUR_EAS_PROJECT_ID',
    },
  },
};

export default config;
