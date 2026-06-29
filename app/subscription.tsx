import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Linking, Alert, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { subscriptionsApi, getApiError } from '../src/lib/api/index';
import { cacheManager } from '../src/lib/cache';
import { useAuthStore } from '../src/store/auth';
import { safeBack } from '../src/utils/index';
import { colors } from '../src/theme/colors';
import { typography, spacing, radius, shadow } from '../src/theme/index';
import { Button, Skeleton } from '../src/components/layout/index';
import type { SubscriptionPlan } from '../src/types/models';

const PLAN_FEATURES = {
  FREE: [
    '1 bank account',
    'Basic spending overview',
    '30 days transaction history',
    '2 budget categories',
    'Basic spending alerts',
  ],
  PRO: [
    'Up to 4 bank accounts',
    'Full spending breakdown',
    '3 months transaction history',
    'Unlimited budget categories',
    'Smart alerts in English & Pidgin',
    'Weekly spending summary',
    'AI-powered insights',
  ],
  PREMIUM: [
    'Unlimited bank accounts',
    'Full transaction history',
    'AI-powered spending insights',
    'Bill payment reminders',
    'PDF & Excel statement exports',
    'Priority customer support',
    'Early access to new features',
  ],
} as const;

type PlanKey = 'FREE' | 'PRO' | 'PREMIUM';

const PLAN_META: Record<PlanKey, {
  name: string;
  price: string;
  sub: string;
  gradientColors: readonly [string, string];
  accentColor: string;
}> = {
  FREE:    { name: 'See Am',  price: '₦0',     sub: 'Forever free',                     gradientColors: ['#0C1A0E', '#111F13'], accentColor: colors.textMuted },
  PRO:     { name: 'Know Am', price: '₦2,000', sub: '₦19,200/yr · save ₦4,800',         gradientColors: ['#0A2B1A', '#061A10'], accentColor: colors.klakGreen },
  PREMIUM: { name: 'Gbam',   price: '₦4,000', sub: '₦38,400/yr · save ₦9,600',         gradientColors: ['#2A1E0A', '#1A1206'], accentColor: colors.klakGold  },
};

// Fallback IDs used when the plans API hasn't loaded yet
const PLAN_SLUGS: PlanKey[] = ['FREE', 'PRO', 'PREMIUM'];

export default function SubscriptionScreen() {
  const user        = useAuthStore(s => s.user);
  const qc          = useQueryClient();
  const currentPlan: PlanKey = (user?.plan as PlanKey) ?? 'FREE';
  const [awaitingPayment, setAwaitingPayment] = useState(false);

  // Plans returned directly as array (no wrapper)
  const { isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => subscriptionsApi.plans().then(r => (r.data as any) as SubscriptionPlan[]),
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  const handlePaystackSuccess = useCallback(async (reference?: string) => {
    setAwaitingPayment(false);
    if (reference) {
      try {
        const res = await subscriptionsApi.verify(reference);
        const newPlan = (res.data as any)?.currentPlan;
        if (newPlan) {
          useAuthStore.getState().updateUser({ plan: newPlan });
          // Bust the AsyncStorage user cache so session restore picks up the new plan
          await cacheManager.clear('user');
        }
      } catch (_) {
        // Verify failed — queries will still refresh below
      }
    }
    qc.invalidateQueries({ queryKey: ['subscription'] });
    qc.invalidateQueries({ queryKey: ['user'] });
    Alert.alert('🎉 Plan activated!', 'Welcome to your new Klak plan. Enjoy the full experience.');
  }, [qc]);

  // Web: listen for postMessage from the payment-callback popup
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (event: MessageEvent) => {
      try {
        const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (msg?.type === 'paystack_success') handlePaystackSuccess(msg.reference);
      } catch (_) {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [handlePaystackSuccess]);

  const openPaystack = useCallback((url: string) => {
    if (Platform.OS === 'web') {
      const popup = window.open(url, 'paystack-checkout', 'width=600,height=700,scrollbars=yes,resizable=yes');
      if (!popup || popup.closed) {
        // Popup blocked — fall back to redirect
        window.location.href = url;
        return;
      }
      setAwaitingPayment(true);
      // Also poll in case popup blocker silently killed it
      const interval = setInterval(() => {
        if (popup.closed) { clearInterval(interval); setAwaitingPayment(false); }
      }, 1000);
    } else {
      Linking.openURL(url);
      setAwaitingPayment(true);
    }
  }, []);

  const { mutate: initiate, isPending } = useMutation({
    mutationFn: (plan: 'PRO' | 'PREMIUM') =>
      subscriptionsApi.initiate({ plan, interval: 'MONTHLY' }).then(r => r.data as any),
    onSuccess: (data: any) => openPaystack(data.authorizationUrl),
    onError: (err) => Alert.alert('Payment Error', getApiError(err)),
  });

  const { mutate: cancel, isPending: cancelling } = useMutation({
    mutationFn: subscriptionsApi.cancel,
    onSuccess: () => Alert.alert('Cancelled', 'Access retained until end of billing period.'),
    onError: (err) => Alert.alert('Cancel Failed', getApiError(err)),
  });

  const handleCancel = () => Alert.alert(
    'Cancel Subscription',
    'You will lose premium features at the end of your current period.',
    [
      { text: 'Keep plan', style: 'cancel' },
      { text: 'Cancel', style: 'destructive', onPress: () => cancel() },
    ],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack('/settings')}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plans</Text>
        <View style={{ width: 60 }} />
      </View>

      {awaitingPayment && (
        <View style={styles.paymentBanner}>
          <Text style={styles.paymentBannerText}>
            {Platform.OS === 'web' ? '⏳ Waiting for payment…' : '⏳ Complete payment in your browser'}
          </Text>
          {Platform.OS !== 'web' && (
            <TouchableOpacity onPress={handlePaystackSuccess} style={styles.paymentBannerBtn}>
              <Text style={styles.paymentBannerBtnText}>I've paid ✓</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroEyebrow}>KLAK PREMIUM</Text>
          <Text style={styles.heroTitle}>Invest in your financial clarity.</Text>
          <Text style={styles.heroSub}>Three plans. No hidden fees. Cancel anytime.</Text>
        </View>

        {/* Current plan callout */}
        <View style={[styles.currentPlanBanner, { borderColor: PLAN_META[currentPlan].accentColor + '50' }]}>
          <Text style={styles.currentPlanLabel}>YOUR CURRENT PLAN</Text>
          <Text style={[styles.currentPlanName, { color: PLAN_META[currentPlan].accentColor }]}>
            {PLAN_META[currentPlan].name}
          </Text>
          <Text style={styles.currentPlanSub}>
            {currentPlan === 'FREE' ? 'Upgrade to unlock more features' : 'Thank you for being a Klak member'}
          </Text>
        </View>

        {/* Plan cards — always rendered regardless of API state */}
        <View style={styles.plansList}>
          {PLAN_SLUGS.map((slug) => {
            const meta      = PLAN_META[slug];
            const features  = PLAN_FEATURES[slug];
            const isCurrent = slug === currentPlan;
            const isPopular = slug === 'PRO';
            const isPremium = slug === 'PREMIUM';

            return (
              <View key={slug} style={styles.planWrap}>
                {isPopular && (
                  <View style={[styles.popularBanner, { backgroundColor: colors.klakGreen }]}>
                    <Text style={styles.popularBannerText}>✦ MOST POPULAR</Text>
                  </View>
                )}
                {isPremium && (
                  <View style={[styles.popularBanner, { backgroundColor: colors.klakGold }]}>
                    <Text style={[styles.popularBannerText, { color: colors.background }]}>★ BEST VALUE</Text>
                  </View>
                )}

                <LinearGradient
                  colors={meta.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.planCard,
                    isCurrent && { borderColor: meta.accentColor + '60', borderWidth: 1.5 },
                  ]}
                >
                  <View style={[styles.planOrb, { backgroundColor: meta.accentColor }]} />

                  {/* Plan header */}
                  <View style={styles.planTop}>
                    <View style={styles.planTopLeft}>
                      <Text style={[styles.planName, { color: meta.accentColor }]}>{meta.name}</Text>
                      <View style={styles.planPriceRow}>
                        <Text style={styles.planPrice}>{meta.price}</Text>
                        {slug !== 'FREE' && <Text style={styles.planPricePer}>/mo</Text>}
                      </View>
                      <Text style={styles.planSub}>{meta.sub}</Text>
                    </View>
                    {isCurrent && (
                      <View style={[styles.currentBadge, {
                        backgroundColor: meta.accentColor + '20',
                        borderColor: meta.accentColor + '40',
                      }]}>
                        <Text style={[styles.currentBadgeText, { color: meta.accentColor }]}>
                          ✓ Active
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={[styles.planDivider, { backgroundColor: meta.accentColor + '20' }]} />

                  {/* Features */}
                  <View style={styles.featureList}>
                    {features.map(f => (
                      <View key={f} style={styles.featureRow}>
                        <Text style={[styles.featureCheck, { color: meta.accentColor }]}>✓</Text>
                        <Text style={styles.featureText}>{f}</Text>
                      </View>
                    ))}
                  </View>

                  {/* CTA */}
                  {!isCurrent && slug !== 'FREE' && (
                    plansLoading ? (
                      <Skeleton width="100%" height={50} style={{ borderRadius: radius.full, marginTop: spacing[5] }} />
                    ) : (
                      <Button
                        label={isPending ? 'Redirecting…' : `Upgrade to ${meta.name}`}
                        onPress={() => initiate(slug as 'PRO' | 'PREMIUM')}
                        loading={isPending}
                        variant={isPremium ? 'gold' : 'primary'}
                        style={{ marginTop: spacing[5] }}
                      />
                    )
                  )}
                  {isCurrent && slug !== 'FREE' && (
                    <Button
                      label={cancelling ? 'Cancelling…' : 'Cancel subscription'}
                      onPress={handleCancel}
                      loading={cancelling}
                      variant="outline"
                      style={{ marginTop: spacing[5] }}
                    />
                  )}
                  {slug === 'FREE' && !isCurrent && (
                    <View style={styles.freeNote}>
                      <Text style={styles.freeNoteText}>
                        Downgrade to free by cancelling your current subscription.
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </View>
            );
          })}
        </View>

        <Text style={styles.footerNote}>
          Payments processed securely via Paystack. Cancel anytime from this page.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing[5], paddingVertical: spacing[4],
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backText: { fontFamily: typography.family.semibold, fontSize: typography.size.base, color: colors.klakGreen, width: 60 },
  headerTitle: { fontFamily: typography.family.extrabold, fontSize: typography.size.lg, color: colors.white },
  scroll: { padding: spacing[5], paddingBottom: spacing[12], gap: spacing[5] },

  heroSection: { gap: spacing[2] },
  heroEyebrow: { fontFamily: typography.family.semibold, fontSize: typography.size.xs, color: colors.klakGreen, letterSpacing: typography.tracking.widest },
  heroTitle: { fontFamily: typography.family.extrabold, fontSize: typography.size.xl, color: colors.white, letterSpacing: typography.tracking.tight },
  heroSub: { fontFamily: typography.family.regular, fontSize: typography.size.sm, color: colors.textSec },

  // Current plan banner
  currentPlanBanner: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    padding: spacing[4],
    gap: spacing[1],
  },
  currentPlanLabel: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    color: colors.textMuted,
    letterSpacing: typography.tracking.widest,
  },
  currentPlanName: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.xl,
    letterSpacing: typography.tracking.tight,
  },
  currentPlanSub: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    color: colors.textSec,
  },

  plansList: { gap: spacing[5] },
  planWrap: { position: 'relative' },
  popularBanner: {
    position: 'absolute', top: -12, left: spacing[5], zIndex: 1,
    borderRadius: radius.full, paddingHorizontal: spacing[4], paddingVertical: 4,
  },
  popularBannerText: { fontFamily: typography.family.bold, fontSize: 10, color: colors.background, letterSpacing: typography.tracking.widest },
  planCard: { borderRadius: radius['2xl'], padding: spacing[6], borderWidth: 1, borderColor: colors.glassBorder, overflow: 'hidden', ...shadow.card },
  planOrb: { position: 'absolute', width: 160, height: 160, borderRadius: 80, top: -80, right: -60, opacity: 0.05 },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[5] },
  planTopLeft: { gap: 4 },
  planName: { fontFamily: typography.family.extrabold, fontSize: typography.size.lg, letterSpacing: typography.tracking.wide },
  planPriceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  planPrice: { fontFamily: typography.family.extrabold, fontSize: typography.size['2xl'], color: colors.white, letterSpacing: typography.tracking.tight },
  planPricePer: { fontFamily: typography.family.regular, fontSize: typography.size.sm, color: colors.textSec, marginBottom: 3 },
  planSub: { fontFamily: typography.family.regular, fontSize: typography.size.xs, color: colors.textSec, marginTop: 2 },
  currentBadge: { borderRadius: radius.full, paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderWidth: 1 },
  currentBadgeText: { fontFamily: typography.family.bold, fontSize: typography.size.xs, letterSpacing: typography.tracking.wide },
  planDivider: { height: 1, marginBottom: spacing[5] },
  featureList: { gap: spacing[3] },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  featureCheck: { fontFamily: typography.family.extrabold, fontSize: typography.size.base, width: 18, lineHeight: 22 },
  featureText: { flex: 1, fontFamily: typography.family.regular, fontSize: typography.size.sm, color: colors.textSec, lineHeight: 22 },
  freeNote: { marginTop: spacing[4], backgroundColor: colors.glass, borderRadius: radius.md, padding: spacing[3] },
  freeNoteText: { fontFamily: typography.family.regular, fontSize: typography.size.xs, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  footerNote: { fontFamily: typography.family.regular, fontSize: typography.size.xs, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },

  paymentBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1B4FA820', borderBottomWidth: 1, borderBottomColor: '#1B4FA840',
    paddingHorizontal: spacing[5], paddingVertical: spacing[3],
  },
  paymentBannerText: { fontFamily: typography.family.semibold, fontSize: typography.size.sm, color: colors.textSec, flex: 1 },
  paymentBannerBtn: { backgroundColor: colors.klakGreen, borderRadius: radius.full, paddingHorizontal: spacing[4], paddingVertical: spacing[2], marginLeft: spacing[3] },
  paymentBannerBtnText: { fontFamily: typography.family.bold, fontSize: typography.size.sm, color: '#000' },
});
