import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { colors } from '../src/theme/colors';
import { typography, spacing } from '../src/theme/index';

export default function PaymentCallbackScreen() {
  const { reference, trxref } = useLocalSearchParams<{ reference?: string; trxref?: string }>();
  const ref = reference || trxref;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // Native: shouldn't normally land here — just go home
      router.replace('/(tabs)/home');
      return;
    }

    // Web: if opened as a popup, notify the parent and close
    if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(
          JSON.stringify({ type: 'paystack_success', reference: ref }),
          '*',
        );
      } catch (_) {}
      setTimeout(() => window.close(), 1200);
    }
  }, [ref]);

  // For popup case this is briefly visible before closing
  // For redirect case (popup blocked) it stays visible
  const isPopup = Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    window.opener &&
    !window.opener.closed;

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{isPopup ? '🎉' : '✅'}</Text>
      <Text style={styles.title}>
        {isPopup ? 'Payment successful!' : 'Payment received!'}
      </Text>
      <Text style={styles.sub}>
        {isPopup
          ? 'Closing this window…'
          : 'Your plan is being activated. Return to Klak to continue.'}
      </Text>

      {!isPopup && Platform.OS === 'web' && (
        <Text
          style={styles.link}
          onPress={() => router.replace('/(tabs)/home')}
        >
          Return to Klak →
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
    padding: spacing[6], gap: spacing[4],
  },
  icon: { fontSize: 56 },
  title: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.xl,
    color: colors.white,
    textAlign: 'center',
  },
  sub: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    color: colors.textSec,
    textAlign: 'center',
    lineHeight: 24,
  },
  link: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    color: colors.klakGreen,
    marginTop: spacing[4],
  },
});
