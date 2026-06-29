import 'tsx/cjs';
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
  web: {
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    'expo-web-browser',
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
      projectId: '9a4b8e3d-7b71-46af-9f8e-5659b90342f8',
    },
  },
};

export default config;
