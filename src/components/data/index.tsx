import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { typography, spacing, radius, shadow } from '../../theme/index';
import { formatNairaFull, formatNaira, formatTxDate, getBudgetStatus, getCategoryById } from '../../utils/index';
import type { Account, Transaction, Budget, Insight } from '../../types/models';

// ── BALANCE CARD ─────────────────────────────────────────────────────────────
interface BalanceCardProps {
  totalCents: number;
  accountCount: number;
}
export function BalanceCard({ totalCents, accountCount }: BalanceCardProps) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  const shadowRadius = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 30] });
  const shadowOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.32] });
  const shadowTranslate = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });

  return (
    <Animated.View style={[styles.balanceCardContainer, { shadowRadius, shadowOpacity, transform: [{ translateY: shadowTranslate }] }]}> 
      <LinearGradient
        colors={['#0E1F4F', '#173A8A', '#1E69D2']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <View style={styles.chartBackground} pointerEvents="none">
          <View style={[styles.chartLine, styles.chartLineThin, { top: '20%', left: '12%' }]} />
          <View style={[styles.chartLine, styles.chartLineThin, { top: '42%', left: '8%' }]} />
          <View style={[styles.chartLine, styles.chartLineThin, { top: '64%', left: '16%' }]} />
          <View style={styles.chartPath} />
          <View style={styles.chartDot} />
          <View style={[styles.chartDot, styles.chartDotAccent]} />
        </View>

        <View style={styles.cardHeader}>
          <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
          <View style={styles.trendPill}> 
            <Text style={styles.trendIcon}>↑</Text>
            <Text style={styles.trendText}>+8.4% this month</Text>
          </View>
        </View>

        <Text style={styles.balanceAmount}>{formatNairaFull(totalCents)}</Text>

        <Text style={styles.balanceFooter}>
          Across {accountCount} account{accountCount !== 1 ? 's' : ''}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

// ── ACCOUNT ROW ───────────────────────────────────────────────────────────────
interface AccountRowProps {
  account: Account;
  onPress?: () => void;
}
export function AccountRow({ account, onPress }: AccountRowProps) {
  const initials = account.institutionName.slice(0, 2).toUpperCase();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.accountRow, { opacity: pressed ? 0.7 : 1 }]}>
      <View style={styles.accountInitials}>
        <Text style={styles.accountInitialsText}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.accountName}>{account.institutionName} {account.accountType}</Text>
        <Text style={styles.accountType}>{account.accountType.charAt(0) + account.accountType.slice(1).toLowerCase()} Account</Text>
      </View>
      <Text style={styles.accountBalance}>{formatNaira(account.balanceCents)}</Text>
    </Pressable>
  );
}

// ── ADD ACCOUNT BUTTON ────────────────────────────────────────────────────────
export function AddAccountRow({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.addAccountRow} activeOpacity={0.7}>
      <Text style={styles.addAccountText}>＋  Link bank account</Text>
    </TouchableOpacity>
  );
}

// ── TRANSACTION ITEM ─────────────────────────────────────────────────────────
interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
  showDivider?: boolean;
}
export function TransactionItem({ transaction, onPress, showDivider = true }: TransactionItemProps) {
  const category = getCategoryById(transaction.categoryId ?? transaction.category?.id) ?? {
    id: 'unknown',
    name: 'Other',
    icon: '💼',
    color: colors.textSec,
    isSystem: true,
  };
  const isDebit = transaction.amount < 0;
  const amountDisplay = isDebit
    ? `- ${formatNairaFull(Math.abs(transaction.amount))}`
    : `+ ${formatNairaFull(transaction.amount)}`;

  return (
    <>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.txCard, { opacity: pressed ? 0.82 : 1 }]}> 
        <View style={[styles.txAvatar, { backgroundColor: category.color + '20' }]}> 
          <Text style={styles.txAvatarEmoji}>{category.icon}</Text>
        </View>
        <View style={styles.txMeta}>
          <View style={styles.txHeaderRow}>
            <Text style={styles.txName} numberOfLines={1}>{transaction.narration}</Text>
            <Text style={[styles.txAmount, { color: isDebit ? colors.alertRed : colors.klakGreen }]}> 
              {amountDisplay}
            </Text>
          </View>
          <View style={styles.txDetailsRow}>
            <Text style={styles.txDate}>{formatTxDate(transaction.date)}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: category.color + '18' }]}> 
              <Text style={[styles.categoryBadgeText, { color: category.color }]}>{category.name}</Text>
            </View>
          </View>
        </View>
      </Pressable>
      {showDivider && <View style={styles.txDivider} />}
    </>
  );
}

// ── BUDGET BAR ────────────────────────────────────────────────────────────────
interface BudgetBarProps {
  budget: Budget;
  onPress?: () => void;
  showDivider?: boolean;
}
export function BudgetBar({ budget, onPress, showDivider = true }: BudgetBarProps) {
  const cat = getCategoryById(budget.categoryId);
  const { pct, color } = getBudgetStatus(budget.spentCents, budget.limitCents);
  const spent  = formatNaira(budget.spentCents);
  const limit  = formatNaira(budget.limitCents);

  return (
    <>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.budgetBar, { opacity: pressed ? 0.8 : 1 }]}>
        <View style={styles.budgetTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.budgetEmoji}>{cat.icon}</Text>
            <Text style={styles.budgetName}>{budget.category?.name ?? cat.name}</Text>
          </View>
          <Text style={styles.budgetAmounts}>
            <Text style={{ color: colors.klakBlack, fontFamily: typography.family.bold }}>{spent}</Text>
            <Text style={{ color: colors.textSec, fontFamily: typography.family.regular }}> / {limit}</Text>
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: color }]} />
        </View>
        <Text style={[styles.budgetPct, { color }]}>{Math.round(pct)}% used</Text>
      </Pressable>
      {showDivider && <View style={styles.txDivider} />}
    </>
  );
}

// ── OVERALL BUDGET ────────────────────────────────────────────────────────────
export function OverallBudgetCard({ spentCents, limitCents }: { spentCents: number; limitCents: number }) {
  const { pct, color } = getBudgetStatus(spentCents, limitCents);
  const remaining = limitCents - spentCents;
  return (
    <View style={styles.overallCard}>
      <View style={styles.overallTop}>
        <Text style={styles.overallLabel}>Overall spending</Text>
        <Text style={[styles.overallAmount, { color }]}>
          {formatNaira(spentCents)} / {formatNaira(limitCents)}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: color, height: 10 }]} />
      </View>
      <Text style={{ fontFamily: typography.family.regular, fontSize: typography.size.xs, color: colors.textSec, marginTop: 6 }}>
        {Math.round(pct)}% used · {formatNaira(remaining)} remaining
      </Text>
    </View>
  );
}

// ── INSIGHT CARD ──────────────────────────────────────────────────────────────
interface InsightCardProps { insight: Insight }
export function InsightCard({ insight }: InsightCardProps) {
  const cfg = {
    warning: { bg: colors.insightWarningBg, border: colors.insightWarningBorder, title: colors.insightWarningTitle },
    info:    { bg: colors.insightInfoBg,    border: colors.insightInfoBorder,    title: colors.insightInfoTitle },
    success: { bg: colors.insightSuccessBg, border: colors.insightSuccessBorder, title: colors.insightSuccessTitle },
  }[insight.severity];

  return (
    <View style={[styles.insightCard, { backgroundColor: cfg.bg, borderLeftColor: cfg.border }]}>
      <View style={styles.insightTitle}>
        <Text style={styles.insightEmoji}>{insight.emoji}</Text>
        <Text style={[styles.insightTitleText, { color: cfg.title }]}>{insight.title}</Text>
      </View>
      <Text style={styles.insightBody}>{insight.body}</Text>
    </View>
  );
}

// ── SPEND SUMMARY ROW ─────────────────────────────────────────────────────────
export function SpendSummaryRow({
  debitCents, creditCents,
}: { debitCents: number; creditCents: number }) {
  const net = creditCents - debitCents;
  const netColor = net >= 0 ? colors.klakGreen : colors.alertRed;
  const items = [
    { label: 'Spent',  value: formatNaira(debitCents),  color: colors.alertRed },
    { label: 'Income', value: formatNaira(creditCents), color: colors.klakGreen },
    { label: 'Net',    value: (net >= 0 ? '+' : '-') + formatNaira(Math.abs(net)), color: netColor },
  ];
  return (
    <View style={styles.summaryContainer}>
      {items.map(item => (
        <View key={item.label} style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: item.color }]}>{item.value}</Text>
          <Text style={styles.summaryLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  balanceLabel: {
    fontFamily: typography.family.bold, fontSize: typography.size.xs,
    color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5, marginBottom: spacing[2],
  },
  balanceCardContainer: {
    borderRadius: radius.xl,
    shadowColor: '#3B7CFF',
    shadowOffset: { width: 0, height: 14 },
    elevation: 18,
    marginBottom: spacing[5],
  },
  balanceCard: {
    borderRadius: radius.xl,
    padding: spacing[6],
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 38, 94, 0.84)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  chartBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  chartLine: {
    position: 'absolute',
    width: '70%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 1,
  },
  chartLineThin: {
    width: '45%',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  chartPath: {
    position: 'absolute',
    left: '12%',
    bottom: '16%',
    width: '70%',
    height: '48%',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
    transform: [{ rotate: '20deg' }],
  },
  chartDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.45)',
    top: '26%',
    left: '68%',
  },
  chartDotAccent: {
    width: 10,
    height: 10,
    top: '56%',
    left: '34%',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
    zIndex: 1,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  trendIcon: {
    fontFamily: typography.family.extrabold,
    color: colors.klakGreen,
    fontSize: typography.size.sm,
  },
  trendText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    color: colors.white,
  },
  balanceAmount: {
    fontFamily: typography.family.extrabold, fontSize: typography.size['3xl'],
    color: colors.white, letterSpacing: -0.75, lineHeight: 54,
    marginTop: spacing[3],
  },
  balanceFooter: {
    fontFamily: typography.family.regular, fontSize: typography.size.sm,
    color: 'rgba(255,255,255,0.72)', marginTop: spacing[3],
  },
  accountRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing[4], gap: spacing[3],
  },
  accountInitials: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.offWhite, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  accountInitialsText: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.sm, color: colors.klakBlue,
  },
  accountName: {
    fontFamily: typography.family.bold, fontSize: typography.size.base,
    color: colors.white,
  },
  accountType: {
    fontFamily: typography.family.regular, fontSize: typography.size.xs,
    color: colors.textSec, marginTop: 2,
  },
  accountBalance: {
    fontFamily: typography.family.bold, fontSize: typography.size.md,
    color: colors.klakGreen,
  },
  addAccountRow: {
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing[3],
    alignItems: 'center', justifyContent: 'center', marginTop: spacing[2],
  },
  addAccountText: {
    fontFamily: typography.family.semibold, fontSize: typography.size.base,
    color: colors.textSec,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: spacing[3],
    ...shadow.card,
  },
  txAvatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txAvatarEmoji: {
    fontSize: 24,
  },
  txMeta: {
    flex: 1,
    marginLeft: spacing[4],
  },
  txHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  txName: {
    flex: 1,
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.base,
    color: colors.white,
    marginRight: spacing[4],
  },
  txDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },
  txDate: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textSec,
  },
  categoryBadge: {
    paddingVertical: 4,
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
  },
  categoryBadgeText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
  },
  txAmount: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.md,
  },
  txDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginLeft: spacing[4] + 52 + spacing[4],
  },
  budgetBar: {
    paddingHorizontal: spacing[4], paddingVertical: spacing[4],
  },
  budgetTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2],
  },
  budgetEmoji: { fontSize: 16 },
  budgetName: {
    fontFamily: typography.family.bold, fontSize: typography.size.md,
    color: colors.klakBlack,
  },
  budgetAmounts: { fontSize: typography.size.sm },
  progressTrack: {
    height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 4,
  },
  budgetPct: {
    fontFamily: typography.family.regular, fontSize: typography.size.xs,
    marginTop: 6,
  },
  overallCard: {
    backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing[4],
    borderWidth: 1, borderColor: colors.border, ...shadow.card, marginBottom: spacing[5],
  },
  overallTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] },
  overallLabel: { fontFamily: typography.family.semibold, fontSize: typography.size.base, color: colors.klakBlack },
  overallAmount: { fontFamily: typography.family.extrabold, fontSize: typography.size.md },
  insightCard: {
    borderRadius: radius.lg, padding: spacing[4],
    borderLeftWidth: 4,
    ...shadow.card,
  },
  insightTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] },
  insightEmoji: { fontSize: 16 },
  insightTitleText: { fontFamily: typography.family.extrabold, fontSize: typography.size.base },
  insightBody: {
    fontFamily: typography.family.medium, fontSize: typography.size.base,
    color: colors.klakBlack, lineHeight: 22,
  },
  summaryContainer: {
    flexDirection: 'row', gap: spacing[3], padding: spacing[4],
    backgroundColor: colors.surface, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border, marginHorizontal: spacing[5], marginTop: spacing[3],
  },
  summaryItem: {
    flex: 1, alignItems: 'center', padding: spacing[3],
  },
  summaryValue: { fontFamily: typography.family.extrabold, fontSize: typography.size.base },
  summaryLabel: { fontFamily: typography.family.regular, fontSize: typography.size.xs, color: colors.textSec, marginTop: 4 },
});
