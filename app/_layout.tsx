import React, { useEffect, useRef, useState } from 'react';
import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { useAuthStore } from '../src/store/auth';
import { authApi, usersApi, healthApi } from '../src/lib/api/index';
import { getRefreshToken, setRefreshToken, clearRefreshToken } from '../src/lib/api';
import { shouldRetry, getRetryDelay } from '../src/lib/retryStrategy';
import { ErrorBoundary } from '../src/components/feedback/ErrorBoundary';
import { colors } from '../src/theme/colors';
import { typography, spacing, radius } from '../src/theme/index';

// ── Query Client with smart retry strategy (Issue #5) ─────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry:        (attempt, error) => shouldRetry(error, attempt),
      retryDelay:   (attempt) => getRetryDelay(attempt),
      staleTime:    60_000,
      networkMode:  'always',
    },
    mutations: {
      retry:       0,
      networkMode: 'always',
    },
  },
});

const SESSION_RESTORE_TIMEOUT_MS = 3_000; // Reduced timeout for faster loading

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const login        = useAuthStore(s => s.login);
  const setLoading   = useAuthStore(s => s.setLoading);
  const isLoading    = useAuthStore(s => s.isLoading);
  const initializeFcm = useAuthStore(s => s.initializeFcm);
  const accessToken  = useAuthStore(s => s.accessToken);

  const [isOnline, setIsOnline] = useState(true);

  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  const fontsReady = fontsLoaded || !!fontError;

  // ── Health check on app startup ──────────────────────────────────────────
  useEffect(() => {
    healthApi.check()
      .then(() => {
        console.log('✓ API is healthy');
        setIsOnline(true);
      })
      .catch((err) => {
        console.log('✗ API unreachable:', err.message);
        setIsOnline(false);
      });
  }, []);

  // ── Session restore with hard timeout ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        clearRefreshToken().catch(() => {});
        setLoading(false);
      }
    }, SESSION_RESTORE_TIMEOUT_MS);

    const restoreSession = async () => {
      try {
        const rt = await getRefreshToken();
        if (!rt) {
          if (!cancelled) setLoading(false);
          clearTimeout(timeoutId);
          return;
        }

        const { data: refreshData } = await authApi.refresh(rt);
        // Backend returns { accessToken, refreshToken } directly
        const tokens = { accessToken: refreshData.accessToken, refreshToken: refreshData.refreshToken };
        await setRefreshToken(refreshData.refreshToken);

        // Backend returns User directly
        const { data: userData } = await usersApi.me();

        if (!cancelled) {
          login(tokens, userData as any);
        }
      } catch {
        await clearRefreshToken().catch(() => {});
        if (!cancelled) setLoading(false);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Initialize FCM after authentication ────────────────────────────────────
  useEffect(() => {
    if (accessToken && !isLoading) {
      initializeFcm().catch(err => 
        console.error('FCM initialization failed:', err)
      );
    }
  }, [accessToken, isLoading, initializeFcm]);

  // ── Handle notification responses ─────────────────────────────────────────
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseListener(({ notification, actionIdentifier }) => {
      console.log('Notification tapped:', notification, actionIdentifier);
      
      // Handle notification navigation based on data
      const data = notification.request.content.data;
      if (data?.type === 'budget_alert') {
        // Navigate to budgets screen
        // router.push('/(tabs)/budgets');
      } else if (data?.type === 'transaction') {
        // Navigate to transaction
        // router.push(`/(tabs)/transactions/${data.transactionId}`);
      }
      // Add more notification types as needed
    });

    return () => subscription.remove();
  }, []);

  const pulseAnim = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1,   duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    return () => pulseAnim.stopAnimation();
  }, [pulseAnim]);

  const showSplash = !fontsReady || isLoading;

  // Show offline banner if API is unreachable
  if (!isOnline) {
    return (
      <View style={styles.offlineContainer}>
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineEmoji}>📡</Text>
          <Text style={styles.offlineTitle}>Connection Issue</Text>
          <Text style={styles.offlineSub}>
            Can't reach Klak servers. Check your internet connection.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              healthApi.check()
                .then(() => setIsOnline(true))
                .catch(() => setIsOnline(false));
            }}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    // Issue #4 — Error Boundary wraps entire app
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {showSplash ? (
          <View style={styles.splash}>
            <Animated.View style={[styles.logoMark, { opacity: pulseAnim }]}>
              <Text style={styles.logoText}>K</Text>
            </Animated.View>
            <Text style={styles.splashSub}>Your money. Clear as Klak.</Text>
          </View>
        ) : (
          <Slot />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing[4],
  },
  logoMark: {
    width: 88,
    height: 88,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(0,214,143,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,214,143,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 52,
    color: colors.klakGreen,
    fontWeight: '800',
  },
  splashSub: {
    fontSize: typography.size.base,
    color: colors.textSec,
    letterSpacing: 0.5,
  },
  // Offline screen styles
  offlineContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  offlineBanner: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing[8],
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  offlineEmoji: {
    fontSize: 56,
    marginBottom: spacing[4],
  },
  offlineTitle: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.xl,
    color: colors.white,
    marginBottom: spacing[2],
  },
  offlineSub: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    color: colors.textSec,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing[6],
  },
  retryButton: {
    backgroundColor: colors.klakGreen,
    borderRadius: radius.full,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
  },
  retryText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    color: colors.background,
  },
});
