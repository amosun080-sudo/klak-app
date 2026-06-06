import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { accountsApi, getApiError } from '../../src/lib/api/index';
import { colors } from '../../src/theme/colors';
import { typography, spacing, radius } from '../../src/theme/index';
import { Button } from '../../src/components/layout/index';

const MONO_PUBLIC_KEY = process.env.EXPO_PUBLIC_MONO_PUBLIC_KEY ?? '';

// Inline Mono Connect HTML widget
const getMonoHTML = (publicKey: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://connect.withmono.com/connect.js"></script>
  <style>
    body { margin: 0; background: #FAFAF7; font-family: sans-serif; }
    #btn {
      margin: 48px auto; display: block;
      background: #1B4FA8; color: white;
      border: none; border-radius: 12px;
      padding: 18px 40px; font-size: 16px;
      font-weight: 700; cursor: pointer;
      width: calc(100% - 40px);
    }
  </style>
</head>
<body>
  <button id="btn" onclick="openMono()">Connect your bank</button>
  <script>
    function openMono() {
      const connect = new Connect({
        key: "${publicKey}",
        onSuccess: function(data) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success', code: data.code }));
        },
        onClose: function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'close' }));
        },
        onEvent: function(eventName, data) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'event', event: eventName }));
        }
      });
      connect.open();
    }
    // Auto-open on load
    window.onload = function() { setTimeout(openMono, 500); }
  </script>
</body>
</html>
`;

export default function LinkAccountScreen() {
  const qc = useQueryClient();
  const [step, setStep] = useState<'intro' | 'widget' | 'success'>('intro');
  const [linkedName, setLinkedName] = useState('');

  // ── Link account mutation ─────────────────────────────────────────────────
  const { mutate: linkAccount, isPending } = useMutation({
    mutationFn: (code: string) => accountsApi.link(code).then(r => r.data.data),
    onSuccess: (account) => {
      qc.invalidateQueries({ queryKey: ['balance'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      setLinkedName(`${account.institutionName} ${account.accountType}`);
      setStep('success');
    },
    onError: (err) => {
      Alert.alert('Link Failed', getApiError(err), [{ text: 'OK' }]);
      setStep('intro');
    },
  });

  const handleWebViewMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'success' && msg.code) {
        linkAccount(msg.code);
      } else if (msg.type === 'close') {
        setStep('intro');
      }
    } catch (_) {}
  };

  // ── Intro screen ──────────────────────────────────────────────────────────
  if (step === 'intro') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Link account</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.introContent}>
          <Text style={styles.bigEmoji}>🏦</Text>
          <Text style={styles.introTitle}>Connect your bank</Text>
          <Text style={styles.introSub}>
            Link your GTBank, Access, Zenith, Opay, Kuda, or any Nigerian bank account securely via Mono.
          </Text>

          <View style={styles.bankGrid}>
            {['GTBank', 'Access', 'Zenith', 'Opay', 'Kuda', 'UBA', 'First Bank', 'Palmpay'].map(b => (
              <View key={b} style={styles.bankChip}>
                <Text style={styles.bankChipText}>{b}</Text>
              </View>
            ))}
          </View>

          <View style={styles.secureRow}>
            <Text style={styles.secureDot}>🔒</Text>
            <Text style={styles.secureText}>
              Your bank credentials are handled entirely by Mono — Klak never sees them.
            </Text>
          </View>

          <Button
            label="Connect bank account"
            onPress={() => setStep('widget')}
            style={{ marginTop: spacing[8] }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContent}>
          <Text style={styles.bigEmoji}>🎉</Text>
          <Text style={styles.introTitle}>Account linked!</Text>
          <Text style={styles.introSub}>
            {linkedName} has been connected successfully. Klak will start syncing your transactions now.
          </Text>
          <Button
            label="Go to dashboard"
            onPress={() => router.replace('/(tabs)/home')}
            style={{ marginTop: spacing[8] }}
          />
          <Button
            label="Link another account"
            onPress={() => setStep('intro')}
            variant="outline"
            style={{ marginTop: spacing[3] }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── Mono widget ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep('intro')}>
          <Text style={styles.cancelText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connect bank</Text>
        {isPending ? <ActivityIndicator color={colors.klakBlue} /> : <View style={{ width: 60 }} />}
      </View>

      {isPending ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.klakBlue} />
          <Text style={styles.loadingText}>Linking your account…</Text>
        </View>
      ) : (
        <WebView
          source={{ html: getMonoHTML(MONO_PUBLIC_KEY) }}
          onMessage={handleWebViewMessage}
          javaScriptEnabled
          domStorageEnabled
          style={{ flex: 1 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing[5], paddingVertical: spacing[4],
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  cancelText: { fontFamily: typography.family.semibold, fontSize: typography.size.base, color: colors.klakGreen, width: 60 },
  headerTitle: { fontFamily: typography.family.extrabold, fontSize: typography.size.lg, color: colors.white },
  introContent: { flex: 1, padding: spacing[6], alignItems: 'center', justifyContent: 'center' },
  successContent: { flex: 1, padding: spacing[6], alignItems: 'center', justifyContent: 'center' },
  bigEmoji: { fontSize: 56, marginBottom: spacing[4] },
  introTitle: { fontFamily: typography.family.extrabold, fontSize: typography.size.xl, color: colors.white, textAlign: 'center', marginBottom: spacing[3] },
  introSub:  { fontFamily: typography.family.regular, fontSize: typography.size.base, color: colors.textSec, textAlign: 'center', lineHeight: 24, marginBottom: spacing[5] },
  bankGrid:  { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing[2], marginBottom: spacing[5] },
  bankChip:  { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.06)' },
  bankChipText: { fontFamily: typography.family.semibold, fontSize: typography.size.xs, color: colors.white },
  secureRow: { flexDirection: 'row', gap: spacing[2], alignItems: 'flex-start', backgroundColor: 'rgba(28,180,130,0.1)', borderRadius: radius.md, padding: spacing[4], borderLeftWidth: 3, borderLeftColor: colors.klakGreen },
  secureDot: { fontSize: 16 },
  secureText: { flex: 1, fontFamily: typography.family.regular, fontSize: typography.size.sm, color: colors.textSec, lineHeight: 20 },
  loadingOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[4] },
  loadingText: { fontFamily: typography.family.semibold, fontSize: typography.size.base, color: colors.textSec },
});
