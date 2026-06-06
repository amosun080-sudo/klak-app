import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { insightsApi, getApiError } from '../../src/lib/api/index';
import { useAuthStore } from '../../src/store/auth';
import { colors } from '../../src/theme/colors';
import { typography, spacing, radius, shadow } from '../../src/theme/index';
import { ScreenHeader, EmptyState, PlanGate, Skeleton, Button } from '../../src/components/layout/index';
import { planMeetsRequirement } from '../../src/utils/index';
import { useInsights } from '../../src/lib/useDemoQuery';
import { BOTTOM_TAB_PADDING } from './_layout';
import type { Insight } from '../../src/types/models';

// ── Insight card ──────────────────────────────────────────────────────────────
function InsightCard({ insight }: { insight: Insight }) {
  const cfg = {
    warning: {
      border: colors.klakGold,
      glow:   colors.klakGoldGlow,
      title:  colors.klakGold,
      bg:     colors.insightWarningBg,
    },
    info: {
      border: colors.klakGreen,
      glow:   colors.klakGreenGlow,
      title:  colors.klakGreen,
      bg:     colors.insightInfoBg,
    },
    success: {
      border: colors.klakGreen,
      glow:   colors.klakGreenGlow,
      title:  colors.insightSuccessTitle,
      bg:     colors.insightSuccessBg,
    },
  }[insight.severity];

  return (
    <View style={[styles.insightCard, { backgroundColor: cfg.bg, borderColor: cfg.border + '40' }]}>
      <View style={[styles.insightAccent, { backgroundColor: cfg.border }]} />
      <View style={styles.insightHeader}>
        <View style={[styles.insightEmojiWrap, { backgroundColor: cfg.glow }]}>
          <Text style={styles.insightEmoji}>{insight.emoji}</Text>
        </View>
        <Text style={[styles.insightTitle, { color: cfg.title }]}>{insight.title}</Text>
      </View>
      <Text style={styles.insightBody}>{insight.body}</Text>
      <View style={styles.insightFooter}>
        <Text style={styles.insightMeta}>
          {new Date(insight.generatedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
        </Text>
        <View style={[styles.insightSeverityBadge, { backgroundColor: cfg.border + '20', borderColor: cfg.border + '40' }]}>
          <Text style={[styles.insightSeverityText, { color: cfg.border }]}>
            {insight.severity.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function InsightsScreen() {
  const user       = useAuthStore(s => s.user);
  const isDemoMode = useAuthStore(s => s.isDemoMode);
  const qc         = useQueryClient();
  const hasPro     = planMeetsRequirement(user?.plan ?? 'FREE', 'PRO');

  // In demo mode always show insights, otherwise gate on PRO plan
  const queryEnabled = hasPro || isDemoMode;

  const { data, isLoading, refetch, isRefetching, isError } = useInsights(queryEnabled);

  const { mutate: generate, isPending: generating } = useMutation({
    mutationFn: insightsApi.generate,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['insights'] }),
    onError:    (err) => Alert.alert('Failed', getApiError(err)),
  });

  if (!hasPro && !isDemoMode) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader label="AI powered" title="Insights" />
        <PlanGate plan="PRO" onUpgrade={() => router.push('/subscription')} />
      </SafeAreaView>
    );
  }

  const insights = (data as Insight[] | undefined) ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        label="AI powered"
        title="Insights"
        rightAction={
          <TouchableOpacity
            onPress={() => generate()}
            disabled={generating}
            style={[styles.genBtn, generating && { opacity: 0.5 }]}
            activeOpacity={0.8}
          >
            <Text style={styles.genBtnText}>{generating ? '…' : '✦'}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.klakGreen} />}
      >
        {/* Hero banner */}
        <LinearGradient
          colors={['#0D2B1A', '#060E07']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroBannerOrb} />
          <Text style={styles.heroBannerLabel}>KLAK AI</Text>
          <Text style={styles.heroBannerTitle}>Your money, decoded.</Text>
          <Text style={styles.heroBannerSub}>
            AI analyses your spending patterns and surfaces actionable insights every week.
          </Text>
          {insights.length > 0 && (
            <View style={styles.heroBannerStats}>
              <View style={styles.heroBannerStat}>
                <Text style={styles.heroBannerStatVal}>{insights.length}</Text>
                <Text style={styles.heroBannerStatLbl}>Insights</Text>
              </View>
              <View style={styles.heroBannerSep} />
              <View style={styles.heroBannerStat}>
                <Text style={styles.heroBannerStatVal}>
                  {insights.filter(i => i.severity === 'warning').length}
                </Text>
                <Text style={styles.heroBannerStatLbl}>Warnings</Text>
              </View>
              <View style={styles.heroBannerSep} />
              <View style={styles.heroBannerStat}>
                <Text style={styles.heroBannerStatVal}>
                  {insights.filter(i => i.severity === 'success').length}
                </Text>
                <Text style={styles.heroBannerStatLbl}>Wins</Text>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* Insight list */}
        {isLoading ? (
          <View style={styles.skeletonList}>
            {[0, 1, 2].map(k => (
              <Skeleton key={k} width="100%" height={130} style={{ borderRadius: radius.xl }} />
            ))}
          </View>
        ) : isError ? (
          <EmptyState emoji="⚠️" title="Could not load" subtitle="Pull down to retry." action={{ label: 'Retry', onPress: refetch }} />
        ) : insights.length === 0 ? (
          <EmptyState
            emoji="🧠"
            title="No insights yet"
            subtitle="Tap the ✦ button to generate your first AI spending analysis."
            action={{ label: '✦ Generate now', onPress: () => generate() }}
          />
        ) : (
          <>
            <Text style={styles.listLabel}>THIS WEEK</Text>
            <View style={styles.insightList}>
              {insights.map(insight => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </View>

            <Button
              label={generating ? 'Analysing…' : '✦ Refresh analysis'}
              onPress={() => generate()}
              loading={generating}
              style={styles.refreshBtn}
            />

            <Text style={styles.footer}>Powered by GPT-4o mini · Refreshed weekly</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: BOTTOM_TAB_PADDING, gap: spacing[5] },

  genBtn: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.klakGreenGlow,
    borderWidth: 1, borderColor: colors.klakGreen + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  genBtnText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    color: colors.klakGreen,
  },

  // Hero banner
  heroBanner: {
    marginHorizontal: spacing[5],
    marginTop: spacing[5],
    borderRadius: radius['2xl'],
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    gap: spacing[3],
    ...shadow.green,
  },
  heroBannerOrb: {
    position: 'absolute',
    width: 200, height: 200,
    borderRadius: radius.full,
    backgroundColor: colors.klakGreen,
    top: -100, right: -80,
    opacity: 0.05,
  },
  heroBannerLabel: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    color: colors.klakGreen,
    letterSpacing: typography.tracking.widest,
  },
  heroBannerTitle: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.xl,
    color: colors.white,
    letterSpacing: typography.tracking.tight,
  },
  heroBannerSub: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    color: colors.textSec,
    lineHeight: 20,
  },
  heroBannerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing[4],
    marginTop: spacing[2],
  },
  heroBannerStat: { flex: 1, alignItems: 'center' },
  heroBannerStatVal: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.xl,
    color: colors.white,
  },
  heroBannerStatLbl: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2,
    letterSpacing: typography.tracking.wide,
  },
  heroBannerSep: { width: 1, height: 36, backgroundColor: colors.glassBorder },

  // List
  skeletonList: { paddingHorizontal: spacing[5], gap: spacing[4] },
  listLabel: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    color: colors.textMuted,
    letterSpacing: typography.tracking.widest,
    paddingHorizontal: spacing[5],
    marginBottom: -spacing[2],
  },
  insightList: {
    paddingHorizontal: spacing[5],
    gap: spacing[4],
  },

  // Insight card
  insightCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing[5],
    gap: spacing[4],
    overflow: 'hidden',
    ...shadow.card,
  },
  insightAccent: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    width: 3,
    borderTopLeftRadius: radius.xl,
    borderBottomLeftRadius: radius.xl,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  insightEmojiWrap: {
    width: 40, height: 40,
    borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  insightEmoji: { fontSize: 20 },
  insightTitle: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.base,
    flex: 1,
    lineHeight: 22,
  },
  insightBody: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    color: colors.textSec,
    lineHeight: 20,
    paddingLeft: spacing[1],
  },
  insightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightMeta: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textMuted,
    letterSpacing: typography.tracking.wide,
  },
  insightSeverityBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 3,
    borderWidth: 1,
  },
  insightSeverityText: {
    fontFamily: typography.family.bold,
    fontSize: 9,
    letterSpacing: typography.tracking.widest,
  },

  refreshBtn: { marginHorizontal: spacing[5] },
  footer: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textMuted,
    textAlign: 'center',
    letterSpacing: typography.tracking.wide,
  },
});
