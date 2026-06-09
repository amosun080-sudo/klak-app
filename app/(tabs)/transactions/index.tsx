import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
  TextInput, Pressable,
} from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { transactionsApi } from '../../../src/lib/api/index';
import { colors } from '../../../src/theme/colors';
import { typography, spacing, radius, shadow } from '../../../src/theme/index';
import { ScreenHeader, EmptyState, Skeleton } from '../../../src/components/layout/index';
import {
  SYSTEM_CATEGORIES, currentMonthYear, formatMonthYear,
  formatNaira, formatTxDate, getCategoryById,
} from '../../../src/utils/index';
import { BOTTOM_TAB_PADDING } from '../_layout';
import type { Transaction } from '../../../src/types/models';

const PAGE_SIZE = 25;

const formatSectionTitle = (date: string) => {
  const parsed = new Date(date);
  return new Intl.DateTimeFormat('en-NG', {
    weekday: 'short', month: 'short', day: 'numeric',
  }).format(parsed);
};

export default function TransactionsScreen() {
  const { month, year } = currentMonthYear();
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [activeType, setActiveType]         = useState<'DEBIT' | 'CREDIT' | undefined>(undefined);
  const [searchQuery, setSearchQuery]       = useState('');

  // ── Summary ───────────────────────────────────────────────────────────────
  const { data: summaryData } = useQuery({
    queryKey: ['transactions', 'summary', month, year],
    queryFn: () => transactionsApi.summary({
        startDate: `${year}-${String(month).padStart(2, '0')}-01`,
        endDate:   `${year}-${String(month).padStart(2, '0')}-31`,
      }).then(r => r.data.data),
    staleTime: 2 * 60 * 1000,
  });

  const debitCents  = summaryData?.reduce((s, r) => s + (r.totalCents < 0 ? Math.abs(r.totalCents) : 0), 0) ?? 0;
  const creditCents = summaryData?.reduce((s, r) => s + (r.totalCents > 0 ? r.totalCents : 0), 0)         ?? 0;
  const netCents    = creditCents - debitCents;

  // ── Transaction list ──────────────────────────────────────────────────────
  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage,
    isLoading, refetch, isRefetching, isError,
  } = useInfiniteQuery({
    queryKey: ['transactions', 'list', activeCategory, activeType, month, year],
    queryFn: ({ pageParam = 1 }) =>
      transactionsApi.list({
        page: pageParam as number, limit: PAGE_SIZE,
        categoryId: activeCategory, type: activeType,
        startDate: `${year}-${String(month).padStart(2, '0')}-01`,
        endDate:   `${year}-${String(month).padStart(2, '0')}-31`,
      }).then(r => r.data),
    initialPageParam: 1,
    getNextPageParam: last =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    staleTime: 2 * 60 * 1000,
  });

  const allTransactions: Transaction[] = data?.pages.flatMap(p => p.data) ?? [];

  // ── Client-side filter ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = allTransactions;
    if (activeType) list = list.filter(tx => tx.type === activeType);
    if (activeCategory) list = list.filter(tx => tx.categoryId === activeCategory || tx.category?.id === activeCategory);
    const q = searchQuery.trim().toLowerCase();
    if (q) list = list.filter(tx =>
      (tx.narration?.toLowerCase() ?? '').includes(q) ||
      (tx.category?.name?.toLowerCase() ?? '').includes(q)
    );
    return list;
  }, [allTransactions, activeType, activeCategory, searchQuery]);

  // ── Group by date ─────────────────────────────────────────────────────────
  const groups = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    for (const tx of filtered) {
      const key = formatSectionTitle(tx.date);
      if (!map[key]) map[key] = [];
      map[key].push(tx);
    }
    return Object.entries(map).sort(([, a], [, b]) =>
      new Date(b[0].date).getTime() - new Date(a[0].date).getTime()
    );
  }, [filtered]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader label={formatMonthYear(month, year)} title="Activity" />

      {/* ── Filters ── */}
      <View style={styles.controlsWrap}>
        {/* Search */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search transactions…"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Type + category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {(['all', 'DEBIT', 'CREDIT'] as const).map(type => {
            const active = type === 'all' ? activeType === undefined : activeType === type;
            const label  = type === 'all' ? 'All' : type === 'DEBIT' ? 'Spent' : 'Income';
            return (
              <TouchableOpacity
                key={type}
                onPress={() => setActiveType(type === 'all' ? undefined : type)}
                style={[styles.filterChip, active && styles.filterChipActive]}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <View style={styles.filterSep} />

          {[
            { id: undefined, name: 'All', icon: '📋', color: colors.klakGreen },
            ...SYSTEM_CATEGORIES,
          ].map(cat => {
            const active = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id ?? 'all'}
                onPress={() => setActiveCategory(cat.id)}
                style={[
                  styles.catChip,
                  active && { backgroundColor: cat.color + '22', borderColor: cat.color },
                ]}
                activeOpacity={0.75}
              >
                <Text style={styles.catChipIcon}>{cat.icon}</Text>
                <Text style={[styles.catChipText, active && { color: cat.color }]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Main list ── */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.klakGreen}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const nearEnd = layoutMeasurement.height + contentOffset.y >= contentSize.height - 200;
          if (nearEnd) loadMore();
        }}
        scrollEventThrottle={200}
      >
        {/* ── Summary card ── */}
        <View style={styles.summaryWrap}>
          <View style={styles.metricsRow}>
            <View style={[styles.metricBox, styles.metricBoxSpent]}>
              <Text style={styles.metricBadge}>SPENT</Text>
              <Text style={[styles.metricAmt, { color: colors.alertRed }]}>
                {formatNaira(debitCents)}
              </Text>
            </View>
            <View style={[styles.metricBox, styles.metricBoxIncome]}>
              <Text style={styles.metricBadge}>INCOME</Text>
              <Text style={[styles.metricAmt, { color: colors.klakGreen }]}>
                {formatNaira(creditCents)}
              </Text>
            </View>
            <View style={[styles.metricBox, styles.metricBoxNet]}>
              <Text style={styles.metricBadge}>NET</Text>
              <Text style={[
                styles.metricAmt,
                { color: netCents >= 0 ? colors.klakGreen : colors.alertRed },
              ]}>
                {netCents >= 0 ? '+' : '−'}{formatNaira(Math.abs(netCents))}
              </Text>
            </View>
          </View>

          {(debitCents > 0 || creditCents > 0) && (
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFillSpent,
                  {
                    width: `${Math.min(
                      100,
                      (debitCents / (debitCents + creditCents)) * 100
                    )}%` as any,
                  },
                ]}
              />
            </View>
          )}

          <Text style={styles.summaryCaption}>
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} this month
          </Text>
        </View>

        {/* ── Loading skeletons ── */}
        {isLoading && (
          <View style={styles.skeletonList}>
            {[0, 1, 2, 3, 4].map(k => (
              <Skeleton
                key={k}
                width="100%"
                height={72}
                style={{ borderRadius: radius.lg, marginBottom: spacing[3] }}
              />
            ))}
          </View>
        )}

        {/* ── Error ── */}
        {!isLoading && isError && (
          <EmptyState
            emoji="⚠️"
            title="Could not load transactions"
            subtitle="Pull down to retry."
            action={{ label: 'Retry', onPress: refetch }}
          />
        )}

        {/* ── Empty ── */}
        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState
            emoji="💳"
            title="No transactions found"
            subtitle="Adjust your filters or link a bank account."
          />
        )}

        {/* ── Grouped transaction rows ── */}
        {!isLoading && !isError && groups.map(([dateLabel, txList]) => (
          <View key={dateLabel}>
            {/* Date header */}
            <View style={styles.dateHeader}>
              <Text style={styles.dateHeaderText}>{dateLabel}</Text>
              <View style={styles.dateHeaderLine} />
            </View>

            {/* Transactions */}
            <View style={styles.txGroup}>
              {txList.map((tx, i) => {
                const cat     = getCategoryById(tx.categoryId ?? tx.category?.id);
                const isDebit = tx.amount < 0;
                return (
                  <Pressable
                    key={tx.id}
                    style={({ pressed }) => [
                      styles.txRow,
                      pressed && { opacity: 0.78 },
                      i < txList.length - 1 && styles.txRowBorder,
                    ]}
                    onPress={() => router.push(`/(tabs)/transactions/${tx.id}`)}
                  >
                    <View style={[styles.txIcon, { backgroundColor: cat.color + '18' }]}>
                      <Text style={styles.txIconEmoji}>{cat.icon}</Text>
                    </View>
                    <View style={styles.txContent}>
                      <Text style={styles.txName} numberOfLines={1}>{tx.narration}</Text>
                      <View style={styles.txMeta}>
                        <Text style={styles.txDate}>{formatTxDate(tx.date)}</Text>
                        <View style={[styles.catPill, { backgroundColor: cat.color + '14' }]}>
                          <Text style={[styles.catPillText, { color: cat.color }]}>
                            {cat.name}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text style={[
                      styles.txAmount,
                      { color: isDebit ? colors.alertRed : colors.klakGreen },
                    ]}>
                      {isDebit ? '−' : '+'}{formatNaira(Math.abs(tx.amount))}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {/* ── Loading more ── */}
        {isFetchingNextPage && (
          <View style={styles.footerLoader}>
            <ActivityIndicator color={colors.klakGreen} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingBottom: BOTTOM_TAB_PADDING },

  // Controls
  controlsWrap: {
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing[3],
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginHorizontal: spacing[5],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  searchIcon: { fontSize: 16, color: colors.textMuted },
  searchInput: {
    flex: 1,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    color: colors.white,
    paddingVertical: 0,
    outlineStyle: 'none', // web only — removes blue outline
  } as any,
  searchClear: { fontSize: 13, color: colors.textMuted, paddingHorizontal: 4 },

  filtersRow: {
    paddingHorizontal: spacing[5],
    gap: spacing[2],
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
  },
  filterChipActive: {
    backgroundColor: colors.klakGreenGlow,
    borderColor: colors.klakGreen,
  },
  filterChipText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    color: colors.textSec,
    letterSpacing: 0.5,
  },
  filterChipTextActive: { color: colors.klakGreen },
  filterSep: {
    width: 1,
    height: 18,
    backgroundColor: colors.glassBorder,
    marginHorizontal: spacing[1],
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
  },
  catChipIcon: { fontSize: 12 },
  catChipText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    color: colors.textSec,
  },

  // Summary card
  summaryWrap: {
    margin: spacing[5],
    marginBottom: spacing[4],
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing[5],
    gap: spacing[4],
    ...shadow.card,
  },
  metricsRow: { flexDirection: 'row', gap: spacing[3] },
  metricBox: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing[3],
    gap: 4,
    borderWidth: 1,
  },
  metricBoxSpent:  { backgroundColor: 'rgba(255,90,90,0.07)',  borderColor: 'rgba(255,90,90,0.18)' },
  metricBoxIncome: { backgroundColor: 'rgba(0,214,143,0.07)',  borderColor: 'rgba(0,214,143,0.18)' },
  metricBoxNet:    { backgroundColor: colors.glass,            borderColor: colors.glassBorder },
  metricBadge: {
    fontFamily: typography.family.semibold,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 1.2,
  },
  metricAmt: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.md,
    letterSpacing: -0.3,
  },
  barTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,214,143,0.12)',
    overflow: 'hidden',
  },
  barFillSpent: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.alertRed,
    opacity: 0.65,
  },
  summaryCaption: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },

  // Date headers
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    backgroundColor: colors.background,
  },
  dateHeaderText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    color: colors.klakGold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    flexShrink: 0,
  },
  dateHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.45,
  },

  // Transaction group + rows
  txGroup: {
    marginHorizontal: spacing[5],
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    marginBottom: spacing[4],
    ...shadow.card,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  txRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  txIconEmoji: { fontSize: 20 },
  txContent: { flex: 1, gap: 3 },
  txName: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    color: colors.white,
  },
  txMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  txDate: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textSec,
  },
  catPill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  catPillText: {
    fontFamily: typography.family.semibold,
    fontSize: 10,
  },
  txAmount: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.sm,
    flexShrink: 0,
  },

  skeletonList: { padding: spacing[5], gap: spacing[3] },
  footerLoader: { paddingVertical: spacing[5], alignItems: 'center' },
});
