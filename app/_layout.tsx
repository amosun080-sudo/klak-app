import React, { useEffect, useRef } from 'react';
import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { useAuthStore } from '../src/store/auth';
import { authApi, usersApi } from '../src/lib/api/index';
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

export default function RootLayout() {
  const login      = useAuthStore(s => s.login);
  const setLoading = useAuthStore(s => s.setLoading);
  const isLoading  = useAuthStore(s => s.isLoading);

  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  const fontsReady = fontsLoaded || !!fontError;

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
});
