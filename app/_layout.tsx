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
import { Platform } from 'react-native';
import { useAuthStore } from '../src/store/auth';
import { authApi, usersApi, healthApi, getApiError } from '../src/lib/api/index';
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

const SESSION_RESTORE_TIMEOUT_MS = 35_000; // Must exceed API timeout (30s) to avoid premature bail

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const login       = useAuthStore(s => s.login);
  const setLoading  = useAuthStore(s => s.setLoading);
  const isLoading   = useAuthStore(s => s.isLoading);
  const accessToken = useAuthStore(s => s.accessToken);

  const [isOnline, setIsOnline] = useState(true);

  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  const fontsReady = fontsLoaded || !!fontError;

  // ── Health check on app startup ──────────────────────────────────────────
  useEffect(() => {
    // Temporary bypass for debugging - set to true to skip health check
    const SKIP_HEALTH_CHECK = true;
    
    if (SKIP_HEALTH_CHECK) {
      console.log('⚠️ Health check bypassed for debugging');
      setIsOnline(true);
      return;
    }
    
    healthApi.check()
      .then(() => {
        console.log('✓ API is healthy');
        setIsOnline(true);
      })
      .catch((err) => {
        console.log('✗ API unreachable:', err.message);
        console.log('✗ Error details:', err.response?.status, err.response?.data);
        console.log('✗ Full error:', err);
        setIsOnline(false);
      });
  }, []);

  // ── Session restore with hard timeout ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        console.warn('[Session] Restore timed out after', SESSION_RESTORE_TIMEOUT_MS, 'ms — clearing token and showing auth');
        clearRefreshToken().catch(() => {});
        setLoading(false);
      }
    }, SESSION_RESTORE_TIMEOUT_MS);

    const restoreSession = async () => {
      console.log('[Session] Starting restore...');
      try {
        const rt = await getRefreshToken();
        if (!rt) {
          console.log('[Session] No refresh token found — showing auth screen');
          if (!cancelled) setLoading(false);
          clearTimeout(timeoutId);
          return;
        }

        console.log('[Session] Refresh token found — attempting refresh...');
        const { data: refreshData } = await authApi.refresh(rt);
        await setRefreshToken(refreshData.refreshToken);
        useAuthStore.getState().setAccessToken(refreshData.accessToken);
        console.log('[Session] Token refreshed — fetching user profile...');

        const { data: userData } = await usersApi.me();
        console.log('[Session] Restore complete — logged in as', (userData as any)?.email ?? (userData as any)?.phone ?? 'unknown');

        if (!cancelled) {
          login({ accessToken: refreshData.accessToken, refreshToken: refreshData.refreshToken }, userData as any);
        }
      } catch (err: any) {
        console.error('[Session] Restore failed:', err?.message ?? err);
        if (err?.response) {
          console.error('[Session] Response status:', err.response.status, '| data:', err.response.data);
        } else if (err?.code) {
          console.error('[Session] Error code:', err.code);
        }
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
    if (!accessToken || isLoading || Platform.OS === 'web') return;

    let subscription: Notifications.Subscription | null = null;

    const init = async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('FCM: Notification permissions not granted');
          return;
        }
        const { data: pushToken } = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
        });
        console.log('FCM: Got push token:', pushToken);
        await usersApi.updateFcmToken(pushToken).catch(err =>
          console.error('FCM: Failed to update token on backend:', getApiError(err))
        );
        subscription = Notifications.addPushTokenListener(({ data: newToken }) => {
          usersApi.updateFcmToken(newToken).catch(err =>
            console.error('FCM: Failed to update refreshed token:', getApiError(err))
          );
        });
      } catch (err) {
        console.error('FCM: Initialization failed:', err);
      }
    };

    init();
    return () => { subscription?.remove(); };
  }, [accessToken, isLoading]);

  // ── Handle notification responses ─────────────────────────────────────────
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      
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
        Animated.timing(pulseAnim, { toValue: 1,   duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== 'web' }),
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
              console.log('Retrying health check...');
              healthApi.check()
                .then(() => {
                  console.log('✓ Retry successful');
                  setIsOnline(true);
                })
                .catch((err) => {
                  console.log('✗ Retry failed:', err.message);
                  console.log('✗ Error details:', err.response?.status, err.response?.data);
                  setIsOnline(false);
                });
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
