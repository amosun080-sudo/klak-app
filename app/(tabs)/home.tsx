import React, { useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, SafeAreaView, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/auth';
import { useQuery } from '@tanstack/react-query';
import { accountsApi, transactionsApi } from '../../src/lib/api/index';
import { BOTTOM_TAB_PADDING } from './_layout';
import { colors } from '../../src/theme/colors';
import { typography, spacing, radius, shadow } from '../../src/theme/index';
import { Skeleton } from '../../src/components/layout/index';
import { getGreeting, formatNairaFull, formatTxDate, getCategoryById } from '../../src/utils/index';

// ── Quick action items ────────────────────────────────────────────────────────
const ACTION_ITEMS = [
  { label: 'Transfers', icon: '↗', route: '/(tabs)/transactions' },
  { label: 'Accounts',  icon: '⬡', route: '/accounts' },
  { label: 'Alerts',    icon: '◎', route: '/alerts' },
  { label: 'Settings',  icon: '⊞', route: '/settings' },
] as const;

export default function HomeScreen() {
  const user = useAuthStore(s => s.user);

  const {
    data: balanceData,
    isLoading: balLoading,
    isError: balError,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ['balance'],
    queryFn: () => accountsApi.balance().then(r => r.data),
    staleTime: 30_000,
  });

  const {
    data: transactionsData,
    isLoading: txLoading,
    isError: txError,
    refetch: refetchTx,
  } = useQuery({
    queryKey: ['transactions', { limit: 5 }],
    queryFn: () => transactionsApi.list({ limit: 5 }).then(r => r.data),
    staleTime: 30_000,
  });

  const accounts = balanceData?.accounts ?? [];
  const totalCents = balanceData?.totalKobo ?? 0;
  const transactions = transactionsData?.data ?? [];
  const hasError = balError || txError;

  const onRefresh = useCallback(() => {
    refetchBalance();
    refetchTx();
  }, [refetchBalance, refetchTx]);

  const firstName = useMemo(() => {
    if (!user?.fullName) return 'Guest';
    return user.fullName.split(' ')[0];
  }, [user?.fullName]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={onRefresh}
            tintColor={colors.klakGreen}
          />
        }
      >
        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {firstName || 'Welcome to Klak'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/alerts')}
            style={styles.notifBtn}
            activeOpacity={0.75}
          >
            <Text style={styles.notifIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {hasError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️  Could not load data · pull to retry</Text>
          </View>
        )}

        {/* ── Balance card ── */}
        <View style={styles.balanceWrap}>
          <LinearGradient
            colors={['#0D2B1A', '#081C10']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            {/* Ambient glow orbs */}
            <View style={[styles.orb, styles.orbTopLeft]} />
            <View style={[styles.orb, styles.orbBottomRight]} />

            {/* Label row */}
            <View style={styles.balanceLabelRow}>
              <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>

            {/* Amount */}
            {balLoading ? (
              <Skeleton width="70%" height={44} style={{ borderRadius: radius.md, marginVertical: spacing[3] }} />
            ) : (
              <Text style={styles.balanceAmount}>{formatNairaFull(totalCents)}</Text>
            )}

            {/* Divider */}
            <View style={styles.balanceDivider} />

            {/* Stats row */}
            <View style={styles.balanceStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{accounts.length}</Text>
                <Text style={styles.statLabel}>Accounts</Text>
              </View>
              <View style={styles.statSep} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.klakGreen }]}>+4.8%</Text>
                <Text style={styles.statLabel}>30-day growth</Text>
              </View>
              <View style={styles.statSep} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{transactions.length}</Text>
                <Text style={styles.statLabel}>Recent txns</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Quick actions ── */}
        <View style={styles.actionsWrap}>
          {ACTION_ITEMS.map(item => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push(item.route)}
            >
              <View style={styles.actionIconWrap}>
                <Text style={styles.actionIconChar}>{item.icon}</Text>
              </View>
              <Text style={styles.actionLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* ── Recent transactions ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')} activeOpacity={0.7}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>

          {txLoading ? (
            <View style={styles.skeletonList}>
              {[0, 1, 2].map(k => (
                <Skeleton key={k} width="100%" height={72} style={{ borderRadius: radius.lg, marginBottom: spacing[3] }} />
              ))}
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyTx}>
              <Text style={styles.emptyTxEmoji}>💳</Text>
              <Text style={styles.emptyTxText}>No recent transactions</Text>
              <Text style={styles.emptyTxSub}>Link an account to start tracking</Text>
            </View>
          ) : (
            <View style={styles.txList}>
              {transactions.map((tx: any, index: number) => {
                const category = getCategoryById(tx.categoryId ?? tx.category?.id);
                const isDebit = (tx.amount ?? 0) < 0;
                const amountStr = isDebit
                  ? `−${formatNairaFull(Math.abs(tx.amount ?? 0))}`
                  : `+${formatNairaFull(tx.amount ?? 0)}`;
                const isLast = index === transactions.length - 1;
                return (
                  <Pressable
                    key={tx.id}
                    style={({ pressed }) => [styles.txRow, { opacity: pressed ? 0.8 : 1 }]}
                    onPress={() => router.push(`/(tabs)/transactions/${tx.id}`)}
                  >
                    <View style={[styles.txAvatar, { backgroundColor: category.color + '18' }]}>
                      <Text style={styles.txEmoji}>{category.icon}</Text>
                    </View>
                    <View style={styles.txMeta}>
                      <Text style={styles.txName} numberOfLines={1}>{tx.narration}</Text>
                      <Text style={styles.txDate}>{formatTxDate(tx.date)}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: isDebit ? colors.alertRed : colors.klakGreen }]}>
                      {amountStr}
                    </Text>
                    {!isLast && <View style={styles.txRowDivider} />}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Linked accounts ── */}
        {accounts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Linked Accounts</Text>
              <TouchableOpacity onPress={() => router.push('/accounts')} activeOpacity={0.7}>
                <Text style={styles.seeAll}>Manage</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.accountsRow}>
              {accounts.slice(0, 3).map((acc: any) => (
                <View key={acc.id} style={styles.accountChip}>
                  <View style={styles.accountInitials}>
                    <Text style={styles.accountInitialsText}>
                      {acc.institutionName.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accountName} numberOfLines={1}>{acc.institutionName}</Text>
                    <Text style={styles.accountBal}>{formatNairaFull(acc.balanceCents)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: BOTTOM_TAB_PADDING },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[5],
  },
  greeting: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    color: colors.textSec,
    marginBottom: 2,
    letterSpacing: typography.tracking.wide,
  },
  userName: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size['2xl'],
    color: colors.white,
    letterSpacing: typography.tracking.tight,
  },
  notifBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIcon: { fontSize: 20 },

  // Error
  errorBanner: {
    marginHorizontal: spacing[5],
    marginBottom: spacing[4],
    backgroundColor: colors.alertRedDim,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.alertRed,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  errorText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    color: colors.alertRed,
  },

  // Balance card
  balanceWrap: {
    marginHorizontal: spacing[5],
    marginBottom: spacing[5],
    borderRadius: radius['2xl'],
    ...shadow.green,
  },
  balanceCard: {
    borderRadius: radius['2xl'],
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    minHeight: 210,
  },
  orb: {
    position: 'absolute',
    borderRadius: radius.full,
    opacity: 0.35,
  },
  orbTopLeft: {
    width: 180,
    height: 180,
    backgroundColor: colors.klakGreen,
    top: -90,
    left: -60,
    opacity: 0.07,
  },
  orbBottomRight: {
    width: 140,
    height: 140,
    backgroundColor: colors.klakGold,
    bottom: -60,
    right: -40,
    opacity: 0.06,
  },
  balanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  balanceLabel: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    color: colors.textSec,
    letterSpacing: typography.tracking.widest,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.klakGreenGlow,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.klakGreen + '30',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.klakGreen,
  },
  liveText: {
    fontFamily: typography.family.bold,
    fontSize: 10,
    color: colors.klakGreen,
    letterSpacing: 1,
  },
  balanceAmount: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size['4xl'],
    color: colors.white,
    letterSpacing: -1.5,
    lineHeight: typography.size['4xl'] * 1.1,
    marginVertical: spacing[3],
  },
  balanceDivider: {
    height: 1,
    backgroundColor: colors.glassBorder,
    marginBottom: spacing[4],
  },
  balanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.md,
    color: colors.white,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textMuted,
    letterSpacing: typography.tracking.wide,
  },
  statSep: {
    width: 1,
    height: 36,
    backgroundColor: colors.glassBorder,
  },

  // Quick actions
  actionsWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    marginBottom: spacing[7],
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[4],
    marginHorizontal: spacing[1],
  },
  actionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
    ...shadow.card,
  },
  actionIconChar: {
    fontSize: 22,
    color: colors.klakGreen,
    fontFamily: typography.family.bold,
  },
  actionLabel: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    color: colors.textSec,
    letterSpacing: typography.tracking.wide,
  },

  // Section
  section: {
    paddingHorizontal: spacing[5],
    marginBottom: spacing[7],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.lg,
    color: colors.white,
    letterSpacing: typography.tracking.tight,
  },
  seeAll: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    color: colors.klakGreen,
  },

  // Tx list
  skeletonList: { gap: spacing[3] },
  txList: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...shadow.card,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  txRowDivider: {
    position: 'absolute',
    bottom: 0,
    left: spacing[4] + 44 + spacing[3],
    right: 0,
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  txAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  txEmoji: { fontSize: 20 },
  txMeta: { flex: 1, gap: 3 },
  txName: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    color: colors.white,
  },
  txDate: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textSec,
  },
  txAmount: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.sm,
    flexShrink: 0,
  },

  // Empty tx
  emptyTx: {
    alignItems: 'center',
    paddingVertical: spacing[10],
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: spacing[2],
  },
  emptyTxEmoji: { fontSize: 36, marginBottom: spacing[2] },
  emptyTxText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    color: colors.white,
  },
  emptyTxSub: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    color: colors.textSec,
  },

  // Accounts
  accountsRow: { gap: spacing[3] },
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  accountInitials: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.klakGreenGlow,
    borderWidth: 1,
    borderColor: colors.klakGreen + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInitialsText: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.sm,
    color: colors.klakGreen,
  },
  accountName: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    color: colors.white,
  },
  accountBal: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textSec,
    marginTop: 1,
  },
});
