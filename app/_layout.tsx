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
import { colors } from '../src/theme/colors';
import { typography, spacing, radius } from '../src/theme/index';

// ── Query Client ──────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      staleTime: 60_000,
    },
    mutations: { retry: 0 },
  },
});

const SESSION_RESTORE_TIMEOUT_MS = 8_000;

export default function RootLayout() {
  const login      = useAuthStore(s => s.login);
  const setLoading = useAuthStore(s => s.setLoading);
  const isLoading  = useAuthStore(s => s.isLoading);

  // Only load the three weights that actually exist in the package
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  // If fonts fail to load, don't hang the app — render without custom fonts
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
        const tokens = refreshData.data;
        await setRefreshToken(tokens.refreshToken);

        const { data: userData } = await usersApi.me();

        if (!cancelled) {
          login(tokens, userData.data);
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

  // ── Splash pulse ───────────────────────────────────────────────────────────
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
    // Use system font fallback — custom fonts may not be loaded yet at splash time
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
