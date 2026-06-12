import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { accountsApi, getApiError } from '../../src/lib/api/index';
import type { Account } from '../../src/types/models';
import { colors } from '../../src/theme/colors';
import { typography, spacing, radius } from '../../src/theme/index';
import { Button } from '../../src/components/layout/index';

const MONO_PUBLIC_KEY = process.env.EXPO_PUBLIC_MONO_PUBLIC_KEY ?? '';

// Plaid Link HTML widget
const getPlaidHTML = (linkToken: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
  <style>
    body { margin: 0; background: #FAFAF7; font-family: sans-serif; }
    #btn {
      margin: 48px auto; display: block;
      background: #00D68F; color: white;
      border: none; border-radius: 12px;
      padding: 18px 40px; font-size: 16px;
      font-weight: 700; cursor: pointer;
      width: calc(100% - 40px);
    }
  </style>
</head>
<body>
  <button id="btn" onclick="openPlaid()">Connect your bank</button>
  <script>
    function openPlaid() {
      const handler = Plaid.create({
        token: "${linkToken}",
        onSuccess: function(public_token, metadata) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'success', 
            publicToken: public_token,
            metadata: metadata 
          }));
        },
        onExit: function(err, metadata) {
          if (err != null) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'error', 
              error: err 
            }));
          } else {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'close' }));
          }
        },
        onEvent: function(eventName, metadata) {
          // Optional: log events
        }
      });
      handler.open();
    }
    // Auto-open on load
    window.onload = function() { setTimeout(openPlaid, 500); }
  </script>
</body>
</html>
`;

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
  const [step, setStep] = useState<'intro' | 'provider' | 'mono' | 'plaid' | 'success'>('intro');
  const [linkedName, setLinkedName] = useState('');

  // ── Plaid Link Token query ───────────────────────────────────────────────
  const { data: plaidData, refetch: refetchPlaidToken } = useQuery({
    queryKey: ['plaid-link-token'],
    queryFn: () => accountsApi.createLinkToken().then(r => r.data),
    enabled: false, // Only fetch when needed
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ── Link account mutations ───────────────────────────────────────────────
  const { mutate: linkMonoAccount, isPending: isLinkingMono } = useMutation({
    mutationFn: (code: string) => accountsApi.link(code).then(r => r.data as Account),
    onSuccess: (account) => {
      qc.invalidateQueries({ queryKey: ['balance'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      setLinkedName(`${account.institutionName} ${account.accountType}`);
      setStep('success');
    },
    onError: (err) => {
      Alert.alert('Link Failed', getApiError(err), [{ text: 'OK' }]);
      setStep('provider');
    },
  });

  const { mutate: linkPlaidAccount, isPending: isLinkingPlaid } = useMutation({
    mutationFn: (publicToken: string) => accountsApi.link(publicToken).then(r => r.data as Account),
    onSuccess: (account) => {
      qc.invalidateQueries({ queryKey: ['balance'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      setLinkedName(`${account.institutionName} ${account.accountType}`);
      setStep('success');
    },
    onError: (err) => {
      Alert.alert('Link Failed', getApiError(err), [{ text: 'OK' }]);
      setStep('provider');
    },
  });

  const isPending = isLinkingMono || isLinkingPlaid;

  // ── Handle WebView messages ──────────────────────────────────────────────
  const handleMonoMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'success' && msg.code) {
        linkMonoAccount(msg.code);
      } else if (msg.type === 'close') {
        setStep('provider');
      }
    } catch (_) {}
  };

  const handlePlaidMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'success' && msg.publicToken) {
        linkPlaidAccount(msg.publicToken);
      } else if (msg.type === 'close') {
        setStep('provider');
      } else if (msg.type === 'error') {
        Alert.alert('Plaid Error', msg.error?.error_message || 'Something went wrong', [{ text: 'OK' }]);
        setStep('provider');
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
            Link your bank account securely. Support for Nigerian banks (via Mono) and international banks (via Plaid).
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
            label="Choose bank provider"
            onPress={() => setStep('provider')}
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
            onPress={() => setStep('provider')}
            variant="outline"
            style={{ marginTop: spacing[3] }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── Provider selection screen ─────────────────────────────────────────────
  if (step === 'provider') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('intro')}>
            <Text style={styles.cancelText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose provider</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.providerContent}>
          <Text style={styles.providerTitle}>Select your bank type</Text>
          <Text style={styles.providerSub}>
            Choose the appropriate provider based on where your bank is located.
          </Text>

          <View style={styles.providerOptions}>
            <TouchableOpacity 
              style={styles.providerCard} 
              onPress={() => {
                setProvider('mono');
                setStep('mono');
              }}
            >
              <View style={styles.providerIcon}>
                <Text style={styles.providerEmoji}>🇳🇬</Text>
              </View>
              <Text style={styles.providerCardTitle}>Nigerian Banks</Text>
              <Text style={styles.providerCardSub}>
                GTBank, Access, Zenith, Opay, Kuda, UBA, First Bank, etc.
              </Text>
              <Text style={styles.providerPowered}>Powered by Mono</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.providerCard} 
              onPress={async () => {
                setProvider('plaid');
                await refetchPlaidToken();
                setStep('plaid');
              }}
            >
              <View style={styles.providerIcon}>
                <Text style={styles.providerEmoji}>🌍</Text>
              </View>
              <Text style={styles.providerCardTitle}>US & International</Text>
              <Text style={styles.providerCardSub}>
                Chase, Bank of America, Wells Fargo, Citi, and 11,000+ others
              </Text>
              <Text style={styles.providerPowered}>Powered by Plaid</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Mono Connect Widget ──────────────────────────────────────────────────
  if (step === 'mono') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('provider')}>
            <Text style={styles.cancelText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Connect Nigerian Bank</Text>
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
            onMessage={handleMonoMessage}
            javaScriptEnabled
            domStorageEnabled
            style={{ flex: 1 }}
          />
        )}
      </SafeAreaView>
    );
  }

  // ── Plaid Link Widget ─────────────────────────────────────────────────────
  if (step === 'plaid') {
    if (!plaidData?.linkToken) {
      return (
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setStep('provider')}>
              <Text style={styles.cancelText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Connect US/Intl Bank</Text>
            <View style={{ width: 60 }} />
          </View>
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.klakGreen} />
            <Text style={styles.loadingText}>Preparing Plaid Link…</Text>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('provider')}>
            <Text style={styles.cancelText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Connect US/Intl Bank</Text>
          {isPending ? <ActivityIndicator color={colors.klakGreen} /> : <View style={{ width: 60 }} />}
        </View>

        {isPending ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.klakGreen} />
            <Text style={styles.loadingText}>Linking your account…</Text>
          </View>
        ) : (
          <WebView
            source={{ html: getPlaidHTML(plaidData.linkToken) }}
            onMessage={handlePlaidMessage}
            javaScriptEnabled
            domStorageEnabled
            style={{ flex: 1 }}
          />
        )}
      </SafeAreaView>
    );
  }

  // ── Fallback (should not reach here) ─────────────────────────────────────
  return null;
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
  // Provider selection styles
  providerContent: { flex: 1, padding: spacing[6] },
  providerTitle: { fontFamily: typography.family.extrabold, fontSize: typography.size.xl, color: colors.white, textAlign: 'center', marginBottom: spacing[3] },
  providerSub: { fontFamily: typography.family.regular, fontSize: typography.size.base, color: colors.textSec, textAlign: 'center', lineHeight: 24, marginBottom: spacing[8] },
  providerOptions: { gap: spacing[4] },
  providerCard: { 
    backgroundColor: colors.surface, 
    borderRadius: radius.lg, 
    padding: spacing[6], 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  providerIcon: { 
    width: 60, 
    height: 60, 
    borderRadius: radius.full, 
    backgroundColor: 'rgba(255,255,255,0.06)', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  providerEmoji: { fontSize: 28 },
  providerCardTitle: { fontFamily: typography.family.extrabold, fontSize: typography.size.lg, color: colors.white, textAlign: 'center', marginBottom: spacing[2] },
  providerCardSub: { fontFamily: typography.family.regular, fontSize: typography.size.sm, color: colors.textSec, textAlign: 'center', lineHeight: 20, marginBottom: spacing[3] },
  providerPowered: { fontFamily: typography.family.semibold, fontSize: typography.size.xs, color: colors.klakGreen, textAlign: 'center' },
});
