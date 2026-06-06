import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated, Easing, View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, RefreshControl, Pressable, Platform,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { budgetsApi } from '../../../src/lib/api/index';
import { colors } from '../../../src/theme/colors';
import { typography, spacing, radius, shadow } from '../../../src/theme/index';
import { Button, EmptyState, ScreenHeader, Skeleton } from '../../../src/components/layout/index';
import { currentMonthYear, formatMonthYear, formatNaira, getBudgetStatus } from '../../../src/utils/index';
import { useBudgetOverview } from '../../../src/lib/useDemoQuery';
import { BOTTOM_TAB_PADDING } from '../_layout';
import type { Budget } from '../../../src/types/models';

// ── Progress ring ─────────────────────────────────────────────────────────────
// Web: plain SVG (no Animated.createAnimatedComponent — avoids collapsable DOM warning)
// Native: animated SVG stroke
function ProgressRing({ percent, tintColor, size = 72 }: { percent: number; tintColor: string; size?: number }) {
  const strokeWidth  = 5;
  const ringRadius   = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * ringRadius;
  const cx = size / 2;
  const cy = size / 2;

  if (Platform.OS === 'web') {
    // Static SVG on web — no Animated, no collapsable prop issue
    const offset = circumference * (1 - Math.min(100, percent) / 100);
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0 }}>
          <Circle
            cx={cx} cy={cy} r={ringRadius}
            stroke={colors.glassBorder}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={cx} cy={cy} r={ringRadius}
            stroke={tintColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            fill="none"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        </Svg>
        <Text style={[styles.ringPct, { fontSize: size < 64 ? typography.size.xs : typography.size.sm }]}>
          {Math.round(percent)}%
        </Text>
      </View>
    );
  }

  // Native: animated stroke
  return <ProgressRingNative percent={percent} tintColor={tintColor} size={size} />;
}

// Animated version for native only — keeps AnimatedCircle out of web bundle
const AnimatedCircleNative = Animated.createAnimatedComponent(Circle);

function ProgressRingNative({ percent, tintColor, size }: { percent: number; tintColor: string; size: number }) {
  const strokeWidth   = 5;
  const ringRadius    = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * ringRadius;
  const cx = size / 2;
  const cy = size / 2;

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: percent,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent]);

  const dashOffset = anim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, circumference * (1 - percent / 100)],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Circle
          cx={cx} cy={cy} r={ringRadius}
          stroke={colors.glassBorder}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircleNative
          cx={cx} cy={cy} r={ringRadius}
          stroke={tintColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          fill="none"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
      <Text style={[styles.ringPct, { fontSize: size < 64 ? typography.size.xs : typography.size.sm }]}>
        {Math.round(percent)}%
      </Text>
    </View>
  );
}

export default function BudgetsScreen() {
  const { month, year } = currentMonthYear();
  const qc = useQueryClient();

  const { data: overview, isLoading, refetch, isRefetching, isError } = useBudgetOverview();

  const onRefresh = useCallback(() => refetch(), [refetch]);

  const budgets: Budget[] = overview?.budgets ?? [];

  const totalBudgeted = useMemo(() => budgets.reduce((s, b) => s + (b.limitCents ?? 0), 0), [budgets]);
  const totalSpent    = useMemo(() => budgets.reduce((s, b) => s + (b.spentCents ?? 0), 0), [budgets]);
  const utilization   = totalBudgeted > 0 ? Math.min(100, Math.round((totalSpent / totalBudgeted) * 100)) : 0;
  const remaining     = Math.max(0, totalBudgeted - totalSpent);
  const overCount     = budgets.filter(b => b.limitCents && b.spentCents > b.limitCents).length;
  const healthCount   = budgets.filter(b => b.limitCents && b.spentCents / b.limitCents < 0.65).length;

  const overallStatus = getBudgetStatus(overview?.overallSpentCents ?? 0, overview?.overallLimitCents ?? 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        label={formatMonthYear(month, year)}
        title="Budgets"
        rightAction={
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/budgets/new')}
            style={styles.addBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>＋</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.klakGreen} />}
      >
        {isLoading ? (
          <View style={{ gap: spacing[4] }}>
            <Skeleton width="100%" height={180} style={{ borderRadius: radius.xl }} />
            <Skeleton width="100%" height={130} style={{ borderRadius: radius.xl }} />
            {[0, 1].map(k => (
              <Skeleton key={k} width="48%" height={140} style={{ borderRadius: radius.xl }} />
            ))}
          </View>
        ) : isError ? (
          <EmptyState emoji="⚠️" title="Could not load budgets" subtitle="Pull down to retry." action={{ label: 'Retry', onPress: refetch }} />
        ) : !overview ? null : (
          <>
            {/* ── Health card ── */}
            <LinearGradient
              colors={['#0D2B1A', '#081C10']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.healthCard}
            >
              <View style={[styles.orb, { top: -50, right: -30, backgroundColor: overallStatus.color + '18' }]} />
              <View style={styles.healthTop}>
                <View>
                  <Text style={styles.healthLabel}>BUDGET HEALTH</Text>
                  <Text style={styles.healthTitle}>{overallStatus.label}</Text>
                </View>
                <ProgressRing
                  percent={Math.min(100, overview.overallLimitCents
                    ? Math.round((overview.overallSpentCents / overview.overallLimitCents) * 100) : 0)}
                  tintColor={overallStatus.color}
                  size={80}
                />
              </View>
              <View style={styles.healthStats}>
                {[
                  { label: 'Spent',    value: formatNaira(totalSpent),    color: colors.alertRed   },
                  { label: 'Budget',   value: formatNaira(totalBudgeted), color: colors.white       },
                  { label: 'Headroom', value: formatNaira(remaining),     color: colors.klakGreen  },
                ].map(s => (
                  <View key={s.label} style={styles.healthStat}>
                    <Text style={[styles.healthStatVal, { color: s.color }]}>{s.value}</Text>
                    <Text style={styles.healthStatLbl}>{s.label}</Text>
                  </View>
                ))}
              </View>
              {/* Progress bar */}
              <View style={styles.healthBar}>
                <View style={[styles.healthBarFill, {
                  width: `${Math.min(100, utilization)}%` as any,
                  backgroundColor: overallStatus.color,
                }]} />
              </View>
              <Text style={styles.healthBarCaption}>{utilization}% of total budget used</Text>
            </LinearGradient>

            {/* ── KPI strip ── */}
            <View style={styles.kpiRow}>
              {[
                { label: 'Categories',  value: String(budgets.length),  accent: colors.white },
                { label: 'Healthy',     value: String(healthCount),      accent: colors.klakGreen },
                { label: 'Over limit',  value: String(overCount),        accent: overCount > 0 ? colors.alertRed : colors.textSec },
              ].map(k => (
                <View key={k.label} style={styles.kpiBox}>
                  <Text style={[styles.kpiValue, { color: k.accent }]}>{k.value}</Text>
                  <Text style={styles.kpiLabel}>{k.label}</Text>
                </View>
              ))}
            </View>

            {/* ── Budget grid ── */}
            {budgets.length === 0 ? (
              <EmptyState
                emoji="📊"
                title="No budgets yet"
                subtitle="Set spending limits so Klak can track your categories."
                action={{ label: '＋ Add budget', onPress: () => router.push('/(tabs)/budgets/new') }}
              />
            ) : (
              <>
                <Text style={styles.gridLabel}>CATEGORY BUDGETS</Text>
                <View style={styles.grid}>
                  {budgets.map(budget => {
                    const { pct, color } = getBudgetStatus(budget.spentCents, budget.limitCents);
                    return (
                      <Pressable
                        key={budget.id}
                        style={({ pressed }) => [styles.budgetCard, { opacity: pressed ? 0.85 : 1 }]}
                        onPress={() => router.push(`/(tabs)/budgets/${budget.id}`)}
                      >
                        <ProgressRing percent={Math.min(100, pct)} tintColor={color} size={64} />
                        <Text style={styles.budgetCatName} numberOfLines={1}>
                          {budget.category?.name ?? 'Budget'}
                        </Text>
                        <Text style={styles.budgetSpent}>{formatNaira(budget.spentCents)}</Text>
                        <Text style={styles.budgetLimit}>of {formatNaira(budget.limitCents)}</Text>
                        <View style={[styles.budgetStatusPill, { backgroundColor: color + '18' }]}>
                          <Text style={[styles.budgetStatusText, { color }]}>
                            {Math.round(pct)}%
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                <Button
                  label="＋ Add category"
                  onPress={() => router.push('/(tabs)/budgets/new')}
                  variant="outline"
                  style={styles.addMoreBtn}
                />
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  addBtn: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.klakGreen,
    alignItems: 'center', justifyContent: 'center',
    ...shadow.green,
  },
  addBtnText: {
    color: colors.background, fontSize: 22,
    fontFamily: typography.family.extrabold, lineHeight: 26,
  },
  scroll: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: BOTTOM_TAB_PADDING,
    gap: spacing[5],
  },

  // Health card
  healthCard: {
    borderRadius: radius['2xl'],
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    ...shadow.green,
    gap: spacing[5],
  },
  orb: {
    position: 'absolute',
    width: 160, height: 160,
    borderRadius: radius.full,
    opacity: 0.4,
  },
  healthTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  healthLabel: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    color: colors.klakGreen,
    letterSpacing: typography.tracking.widest,
    marginBottom: spacing[1],
  },
  healthTitle: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.xl,
    color: colors.white,
    letterSpacing: typography.tracking.tight,
  },
  ringPct: {
    fontFamily: typography.family.extrabold,
    color: colors.white,
  },
  healthStats: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  healthStat: { flex: 1 },
  healthStatVal: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.lg,
    letterSpacing: typography.tracking.tight,
  },
  healthStatLbl: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2,
    letterSpacing: typography.tracking.wide,
  },
  healthBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.glass,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  healthBarCaption: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textMuted,
    letterSpacing: typography.tracking.wide,
  },

  // KPI row
  kpiRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  kpiBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing[4],
    alignItems: 'center',
    gap: 4,
  },
  kpiValue: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.xl,
    letterSpacing: typography.tracking.tight,
  },
  kpiLabel: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textMuted,
    letterSpacing: typography.tracking.wide,
  },

  // Grid
  gridLabel: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    color: colors.textMuted,
    letterSpacing: typography.tracking.widest,
    marginBottom: -spacing[3],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  budgetCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing[4],
    alignItems: 'center',
    gap: spacing[2],
    ...shadow.card,
  },
  budgetCatName: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    color: colors.white,
    textAlign: 'center',
  },
  budgetSpent: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.base,
    color: colors.white,
  },
  budgetLimit: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textSec,
  },
  budgetStatusPill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 3,
    marginTop: spacing[1],
  },
  budgetStatusText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    letterSpacing: typography.tracking.wide,
  },
  addMoreBtn: { marginTop: spacing[2] },
});
