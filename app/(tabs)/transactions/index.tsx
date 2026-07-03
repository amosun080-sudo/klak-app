import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
  TextInput, Pressable, Modal,
} from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { transactionsApi } from '../../../src/lib/api/index';
import { colors } from '../../../src/theme/colors';
import { typography, spacing, radius, shadow } from '../../../src/theme/index';
import { EmptyState, Skeleton } from '../../../src/components/layout/index';
import {
  SYSTEM_CATEGORIES, currentMonthYear,
  formatNaira, formatTxDate, getCategoryById,
} from '../../../src/utils/index';
import { BOTTOM_TAB_PADDING } from '../_layout';
import type { Transaction } from '../../../src/types/models';

const PAGE_SIZE = 25;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function lastDayOfMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function formatRange(sm: number, sy: number, em: number, ey: number): string {
  if (sm === em && sy === ey) return `${MONTH_NAMES[sm - 1]} ${sy}`;
  if (sy === ey) return `${MONTH_NAMES[sm - 1]} – ${MONTH_NAMES[em - 1]} ${sy}`;
  return `${MONTH_NAMES[sm - 1]} ${sy} – ${MONTH_NAMES[em - 1]} ${ey}`;
}

function RangePicker({
  visible,
  startMonth, startYear, endMonth, endYear,
  onApply, onClose,
}: {
  visible: boolean;
  startMonth: number; startYear: number;
  endMonth: number;   endYear: number;
  onApply: (sm: number, sy: number, em: number, ey: number) => void;
  onClose: () => void;
}) {
  const now = currentMonthYear();
  const [sm, setSm] = useState(startMonth);
  const [sy, setSy] = useState(startYear);
  const [em, setEm] = useState(endMonth);
  const [ey, setEy] = useState(endYear);

  const clampEnd = useCallback((newSm: number, newSy: number, curEm: number, curEy: number) => {
    // if end is before start, pull end forward
    if (curEy < newSy || (curEy === newSy && curEm < newSm)) {
      setEm(newSm);
      setEy(newSy);
    }
  }, []);

  const changeStartYear = (delta: number) => {
    const ny = sy + delta;
    if (ny < 2020 || ny > now.year) return;
    setSy(ny);
    clampEnd(sm, ny, em, ey);
  };

  const changeEndYear = (delta: number) => {
    const ny = ey + delta;
    if (ny < 2020 || ny > now.year) return;
    setEy(ny);
    // clamp: end must not be before start
    if (ny < sy || (ny === sy && em < sm)) { setEm(sm); setEy(sy); }
  };

  const selectStartMonth = (m: number) => {
    setSm(m);
    clampEnd(m, sy, em, ey);
  };

  const selectEndMonth = (m: number) => {
    if (ey < sy || (ey === sy && m < sm)) return;
    setEm(m);
  };

  const isEndMonthDisabled = (m: number) =>
    ey < sy || (ey === sy && m < sm) || (ey === now.year && m > now.month);

  const isStartMonthDisabled = (m: number) =>
    sy === now.year && m > now.month;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={rStyles.overlay}>
        <View style={rStyles.sheet}>
          {/* Header */}
          <View style={rStyles.sheetHeader}>
            <Text style={rStyles.sheetTitle}>Select Date Range</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={rStyles.sheetClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* FROM */}
            <Text style={rStyles.sectionLabel}>FROM</Text>
            <View style={rStyles.yearRow}>
              <TouchableOpacity onPress={() => changeStartYear(-1)} style={rStyles.yearBtn}>
                <Text style={rStyles.yearArrow}>‹</Text>
              </TouchableOpacity>
              <Text style={rStyles.yearText}>{sy}</Text>
              <TouchableOpacity
                onPress={() => changeStartYear(1)}
                style={[rStyles.yearBtn, sy >= now.year && rStyles.yearBtnDisabled]}
                disabled={sy >= now.year}
              >
                <Text style={[rStyles.yearArrow, sy >= now.year && rStyles.disabledText]}>›</Text>
              </TouchableOpacity>
            </View>
            <View style={rStyles.monthGrid}>
              {MONTH_NAMES.map((name, idx) => {
                const m = idx + 1;
                const active = m === sm && sy === sy;
                const disabled = isStartMonthDisabled(m);
                return (
                  <TouchableOpacity
                    key={name}
                    onPress={() => !disabled && selectStartMonth(m)}
                    style={[
                      rStyles.monthCell,
                      active && rStyles.monthCellActive,
                      disabled && rStyles.monthCellDisabled,
                    ]}
                    disabled={disabled}
                  >
                    <Text style={[
                      rStyles.monthCellText,
                      active && rStyles.monthCellTextActive,
                      disabled && rStyles.disabledText,
                    ]}>
                      {name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={rStyles.divider} />

            {/* TO */}
            <Text style={rStyles.sectionLabel}>TO</Text>
            <View style={rStyles.yearRow}>
              <TouchableOpacity
                onPress={() => changeEndYear(-1)}
                style={[rStyles.yearBtn, ey <= sy && rStyles.yearBtnDisabled]}
                disabled={ey <= sy}
              >
                <Text style={[rStyles.yearArrow, ey <= sy && rStyles.disabledText]}>‹</Text>
              </TouchableOpacity>
              <Text style={rStyles.yearText}>{ey}</Text>
              <TouchableOpacity
                onPress={() => changeEndYear(1)}
                style={[rStyles.yearBtn, ey >= now.year && rStyles.yearBtnDisabled]}
                disabled={ey >= now.year}
              >
                <Text style={[rStyles.yearArrow, ey >= now.year && rStyles.disabledText]}>›</Text>
              </TouchableOpacity>
            </View>
            <View style={rStyles.monthGrid}>
              {MONTH_NAMES.map((name, idx) => {
                const m = idx + 1;
                const active = m === em && ey === ey;
                const disabled = isEndMonthDisabled(m);
                return (
                  <TouchableOpacity
                    key={name}
                    onPress={() => !disabled && selectEndMonth(m)}
                    style={[
                      rStyles.monthCell,
                      active && rStyles.monthCellActive,
                      disabled && rStyles.monthCellDisabled,
                    ]}
                    disabled={disabled}
                  >
                    <Text style={[
                      rStyles.monthCellText,
                      active && rStyles.monthCellTextActive,
                      disabled && rStyles.disabledText,
                    ]}>
                      {name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Preview */}
            <View style={rStyles.previewRow}>
              <Text style={rStyles.previewLabel}>Showing:</Text>
              <Text style={rStyles.previewValue}>{formatRange(sm, sy, em, ey)}</Text>
            </View>

            {/* Apply */}
            <TouchableOpacity style={rStyles.applyBtn} onPress={() => onApply(sm, sy, em, ey)}>
              <Text style={rStyles.applyBtnText}>Apply Range</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const formatSectionTitle = (date: string) => {
  const parsed = new Date(date);
  return new Intl.DateTimeFormat('en-NG', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  }).format(parsed);
};

export default function TransactionsScreen() {
  const now = currentMonthYear();
  // Default to last 3 months (current month + 2 before it)
  const defaultStart = new Date(now.year, now.month - 3, 1);
  const [startMonth, setStartMonth] = useState(defaultStart.getMonth() + 1);
  const [startYear, setStartYear]   = useState(defaultStart.getFullYear());
  const [endMonth, setEndMonth]     = useState(now.month);
  const [endYear, setEndYear]       = useState(now.year);
  const [pickerVisible, setPickerVisible] = useState(false);

  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [activeType, setActiveType]         = useState<'DEBIT' | 'CREDIT' | undefined>(undefined);
  const [searchQuery, setSearchQuery]       = useState('');

  const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-01`;
  const endDate   = `${endYear}-${String(endMonth).padStart(2, '0')}-${lastDayOfMonth(endMonth, endYear)}`;

  const applyRange = useCallback((sm: number, sy: number, em: number, ey: number) => {
    setStartMonth(sm); setStartYear(sy);
    setEndMonth(em);   setEndYear(ey);
    setPickerVisible(false);
  }, []);

  // ── Summary ─────────────────────────────────────────────────────────────────
  const { data: summaryData } = useQuery({
    queryKey: ['transactions', 'summary', startDate, endDate],
    queryFn: () => transactionsApi.summary({ startDate, endDate }).then(r => r.data ?? null),
    staleTime: 2 * 60 * 1000,
  });

  const debitCents  = summaryData?.totalExpenses ?? 0;
  const creditCents = summaryData?.totalIncome   ?? 0;
  const netCents    = summaryData?.netSavings    ?? (creditCents - debitCents);

  // ── Transaction list ─────────────────────────────────────────────────────────
  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage,
    isLoading, refetch, isRefetching, isError,
  } = useInfiniteQuery({
    queryKey: ['transactions', 'list', activeCategory, activeType, startDate, endDate],
    queryFn: ({ pageParam = 1 }) =>
      transactionsApi.list({
        page: pageParam as number, limit: PAGE_SIZE,
        categoryId: activeCategory, type: activeType,
        startDate, endDate,
      }).then(r => r.data),
    initialPageParam: 1,
    getNextPageParam: last =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    staleTime: 2 * 60 * 1000,
  });

  const allTransactions: Transaction[] = data?.pages.flatMap(p => p.data) ?? [];

  // ── Client-side filter ───────────────────────────────────────────────────────
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

  // ── Group by date ────────────────────────────────────────────────────────────
  const groups = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    for (const tx of filtered) {
      const key = formatSectionTitle(tx.date);
      if (!map[key]) map[key] = [];
      map[key].push(tx);
    }
    return Object.entries(map).sort(([a], [b]) => {
      const da = new Date(filtered.find(t => formatSectionTitle(t.date) === a)?.date ?? 0);
      const db = new Date(filtered.find(t => formatSectionTitle(t.date) === b)?.date ?? 0);
      return db.getTime() - da.getTime();
    });
  }, [filtered]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header with range selector ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.rangeBtn} onPress={() => setPickerVisible(true)} activeOpacity={0.75}>
          <Text style={styles.rangeLabel}>DATE RANGE</Text>
          <View style={styles.rangeValueRow}>
            <Text style={styles.rangeValue}>{formatRange(startMonth, startYear, endMonth, endYear)}</Text>
            <Text style={styles.rangeChevron}>⌄</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity</Text>
      </View>

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
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Type + category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
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
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
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
                style={[styles.catChip, active && { backgroundColor: cat.color + '22', borderColor: cat.color }]}
                activeOpacity={0.75}
              >
                <Text style={styles.catChipIcon}>{cat.icon}</Text>
                <Text style={[styles.catChipText, active && { color: cat.color }]}>{cat.name}</Text>
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
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.klakGreen} />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 200) loadMore();
        }}
        scrollEventThrottle={200}
      >
        {/* ── Summary card ── */}
        <View style={styles.summaryWrap}>
          <View style={styles.metricsRow}>
            <View style={[styles.metricBox, styles.metricBoxSpent]}>
              <Text style={styles.metricBadge}>SPENT</Text>
              <Text style={[styles.metricAmt, { color: colors.alertRed }]}>{formatNaira(debitCents)}</Text>
            </View>
            <View style={[styles.metricBox, styles.metricBoxIncome]}>
              <Text style={styles.metricBadge}>INCOME</Text>
              <Text style={[styles.metricAmt, { color: colors.klakGreen }]}>{formatNaira(creditCents)}</Text>
            </View>
            <View style={[styles.metricBox, styles.metricBoxNet]}>
              <Text style={styles.metricBadge}>NET</Text>
              <Text style={[styles.metricAmt, { color: netCents >= 0 ? colors.klakGreen : colors.alertRed }]}>
                {netCents >= 0 ? '+' : '−'}{formatNaira(Math.abs(netCents))}
              </Text>
            </View>
          </View>

          {(debitCents > 0 || creditCents > 0) && (
            <View style={styles.barTrack}>
              <View style={[styles.barFillSpent, { width: `${Math.min(100, (debitCents / (debitCents + creditCents)) * 100)}%` as any }]} />
            </View>
          )}

          <Text style={styles.summaryCaption}>
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} in range
          </Text>
        </View>

        {isLoading && (
          <View style={styles.skeletonList}>
            {[0, 1, 2, 3, 4].map(k => (
              <Skeleton key={k} width="100%" height={72} style={{ borderRadius: radius.lg, marginBottom: spacing[3] }} />
            ))}
          </View>
        )}

        {!isLoading && isError && (
          <EmptyState emoji="⚠️" title="Could not load transactions" subtitle="Pull down to retry." action={{ label: 'Retry', onPress: refetch }} />
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState
            emoji="💳"
            title="No transactions found"
            subtitle="Try a different date range or adjust your filters."
            action={{ label: 'Change Range', onPress: () => setPickerVisible(true) }}
          />
        )}

        {!isLoading && !isError && groups.map(([dateLabel, txList]) => (
          <View key={dateLabel}>
            <View style={styles.dateHeader}>
              <Text style={styles.dateHeaderText}>{dateLabel}</Text>
              <View style={styles.dateHeaderLine} />
            </View>
            <View style={styles.txGroup}>
              {txList.map((tx, i) => {
                const cat     = getCategoryById(tx.categoryId ?? tx.category?.id);
                const isDebit = tx.amount < 0;
                return (
                  <Pressable
                    key={tx.id}
                    style={({ pressed }) => [styles.txRow, pressed && { opacity: 0.78 }, i < txList.length - 1 && styles.txRowBorder]}
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
                          <Text style={[styles.catPillText, { color: cat.color }]}>{cat.name}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={[styles.txAmount, { color: isDebit ? colors.alertRed : colors.klakGreen }]}>
                      {isDebit ? '−' : '+'}{formatNaira(Math.abs(tx.amount))}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {isFetchingNextPage && (
          <View style={styles.footerLoader}><ActivityIndicator color={colors.klakGreen} /></View>
        )}
      </ScrollView>

      {/* ── Date Range Picker Modal ── */}
      <RangePicker
        visible={pickerVisible}
        startMonth={startMonth} startYear={startYear}
        endMonth={endMonth}     endYear={endYear}
        onApply={applyRange}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

// ── Range picker styles ─────────────────────────────────────────────────────
const rStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.glassBorder,
    maxHeight: '88%',
    paddingBottom: spacing[8],
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.lg,
    color: colors.white,
  },
  sheetClose: {
    fontSize: 18,
    color: colors.textMuted,
    padding: spacing[1],
  },
  sectionLabel: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    color: colors.klakGreen,
    letterSpacing: typography.tracking.widest,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[5],
    paddingBottom: spacing[3],
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[6],
    marginBottom: spacing[4],
  },
  yearBtn: { padding: spacing[2] },
  yearBtnDisabled: { opacity: 0.25 },
  yearArrow: {
    fontSize: 28,
    color: colors.klakGreen,
    fontFamily: typography.family.bold,
    lineHeight: 30,
  },
  disabledText: { color: colors.textMuted },
  yearText: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.xl,
    color: colors.white,
    minWidth: 64,
    textAlign: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[5],
    gap: spacing[2],
    justifyContent: 'center',
  },
  monthCell: {
    width: '22%',
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
    alignItems: 'center',
  },
  monthCellActive: {
    backgroundColor: colors.klakGreenGlow,
    borderColor: colors.klakGreen,
  },
  monthCellDisabled: {
    opacity: 0.3,
  },
  monthCellText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    color: colors.textSec,
  },
  monthCellTextActive: { color: colors.klakGreen },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing[6],
    marginTop: spacing[5],
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[6],
    paddingTop: spacing[5],
    paddingBottom: spacing[2],
  },
  previewLabel: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  previewValue: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    color: colors.klakGold,
  },
  applyBtn: {
    marginHorizontal: spacing[6],
    marginTop: spacing[4],
    backgroundColor: colors.klakGreen,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  applyBtnText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    color: colors.background,
    letterSpacing: typography.tracking.wide,
  },
});

// ── Main screen styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingBottom: BOTTOM_TAB_PADDING },

  // Header
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing[1],
  },
  rangeBtn: {
    alignSelf: 'flex-start',
    gap: 2,
  },
  rangeLabel: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    color: colors.klakGreen,
    letterSpacing: typography.tracking.widest,
  },
  rangeValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  rangeValue: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    color: colors.textSec,
  },
  rangeChevron: {
    fontSize: 16,
    color: colors.klakGreen,
    lineHeight: 20,
  },
  headerTitle: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size['2xl'],
    color: colors.white,
    letterSpacing: typography.tracking.tight,
  },

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
    outlineStyle: 'none',
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
    width: 1, height: 18,
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
    flex: 1, borderRadius: radius.lg,
    padding: spacing[3], gap: 4, borderWidth: 1,
  },
  metricBoxSpent:  { backgroundColor: 'rgba(255,90,90,0.07)',  borderColor: 'rgba(255,90,90,0.18)' },
  metricBoxIncome: { backgroundColor: 'rgba(0,214,143,0.07)',  borderColor: 'rgba(0,214,143,0.18)' },
  metricBoxNet:    { backgroundColor: colors.glass,            borderColor: colors.glassBorder },
  metricBadge: {
    fontFamily: typography.family.semibold,
    fontSize: 9, color: colors.textMuted, letterSpacing: 1.2,
  },
  metricAmt: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.md, letterSpacing: -0.3,
  },
  barTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(0,214,143,0.12)', overflow: 'hidden' },
  barFillSpent: { height: '100%', borderRadius: 2, backgroundColor: colors.alertRed, opacity: 0.65 },
  summaryCaption: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs, color: colors.textMuted, letterSpacing: 0.5,
  },

  // Date headers
  dateHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing[3], paddingHorizontal: spacing[5],
    paddingVertical: spacing[3], backgroundColor: colors.background,
  },
  dateHeaderText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs, color: colors.klakGold,
    letterSpacing: 1.2, textTransform: 'uppercase', flexShrink: 0,
  },
  dateHeaderLine: { flex: 1, height: 1, backgroundColor: colors.border, opacity: 0.45 },

  // Transaction rows
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
    flexDirection: 'row', alignItems: 'center',
    gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[4],
  },
  txRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  txIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  txIconEmoji: { fontSize: 20 },
  txContent: { flex: 1, gap: 3 },
  txName: { fontFamily: typography.family.semibold, fontSize: typography.size.sm, color: colors.white },
  txMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  txDate: { fontFamily: typography.family.regular, fontSize: typography.size.xs, color: colors.textSec },
  catPill: { borderRadius: radius.full, paddingHorizontal: spacing[2], paddingVertical: 2 },
  catPillText: { fontFamily: typography.family.semibold, fontSize: 10 },
  txAmount: { fontFamily: typography.family.extrabold, fontSize: typography.size.sm, flexShrink: 0 },

  skeletonList: { padding: spacing[5], gap: spacing[3] },
  footerLoader: { paddingVertical: spacing[5], alignItems: 'center' },
});
