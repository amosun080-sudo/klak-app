import React from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography, spacing, radius, shadow } from '../../theme/index';

// ── TRANSACTION ITEM ──────────────────────────────────────────────────────────
interface TransactionItemProps {
  emoji: string;
  merchant: string;
  date: string;
  amount: number;
  isDebit: boolean;
  onPress?: () => void;
}
export function TransactionItem({
  emoji, merchant, date, amount, isDebit, onPress,
}: TransactionItemProps) {
  const amountColor = isDebit ? colors.alertRed : colors.klakGreen;
  const amountSign = isDebit ? '−' : '+';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.transactionItem, { opacity: pressed ? 0.6 : 1 }]}
    >
      <View style={styles.transactionLeft}>
        <Text style={styles.transactionEmoji}>{emoji}</Text>
        <View>
          <Text style={styles.transactionMerchant}>{merchant}</Text>
          <Text style={styles.transactionDate}>{date}</Text>
        </View>
      </View>
      <Text style={[styles.transactionAmount, { color: amountColor }]}>
        {amountSign}₦{(amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
      </Text>
    </Pressable>
  );
}

// ── BUDGET BAR ────────────────────────────────────────────────────────────────
interface BudgetBarProps {
  category: string;
  emoji: string;
  spent: number;
  limit: number;
  categoryColor: string;
}
export function BudgetBar({
  category, emoji, spent, limit, categoryColor,
}: BudgetBarProps) {
  const percentage = Math.min((spent / limit) * 100, 100);
  const isOverspent = spent > limit;

  return (
    <View style={styles.budgetBar}>
      <View style={styles.budgetHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
          <Text style={styles.budgetEmoji}>{emoji}</Text>
          <Text style={styles.budgetCategory}>{category}</Text>
        </View>
        <Text style={styles.budgetAmount}>
          ₦{(spent / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 })} / ₦{(limit / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 })}
        </Text>
      </View>
      <View style={[styles.budgetProgressBg, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.budgetProgressFill,
            {
              width: `${percentage}%`,
              backgroundColor: isOverspent ? colors.alertRed : categoryColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

// ── INSIGHT CARD ──────────────────────────────────────────────────────────────
interface InsightCardProps {
  emoji: string;
  title: string;
  body: string;
  type?: 'warning' | 'info' | 'success';
}
export function InsightCard({
  emoji, title, body, type = 'info',
}: InsightCardProps) {
  const borderColor = {
    warning: '#D4A017',
    info: colors.klakBlue,
    success: colors.klakGreen,
  }[type];

  const bgColor = {
    warning: '#FFF9E6',
    info: '#EBF3FF',
    success: '#EDFAF3',
  }[type];

  const titleColor = {
    warning: '#7A5C00',
    info: colors.klakBlue,
    success: '#006845',
  }[type];

  return (
    <View style={[styles.insightCard, { borderLeftColor: borderColor, backgroundColor: bgColor }]}>
      <View style={styles.insightHeader}>
        <Text style={styles.insightEmoji}>{emoji}</Text>
        <Text style={[styles.insightTitle, { color: titleColor }]}>{title}</Text>
      </View>
      <Text style={styles.insightBody}>{body}</Text>
    </View>
  );
}

// ── SPEND PIE CHART SEGMENT ───────────────────────────────────────────────────
interface PieSegmentProps {
  label: string;
  percentage: number;
  color: string;
  amount: number;
}
export function PieSegment({ label, percentage, color, amount }: PieSegmentProps) {
  return (
    <View style={styles.pieSegment}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        <View style={[styles.pieColor, { backgroundColor: color }]} />
        <View>
          <Text style={styles.pieLabel}>{label}</Text>
          <Text style={styles.pieAmount}>₦{(amount / 100).toLocaleString('en-NG')}</Text>
        </View>
      </View>
      <Text style={styles.piePercentage}>{percentage.toFixed(1)}%</Text>
    </View>
  );
}

// ── MONTH PICKER ──────────────────────────────────────────────────────────────
interface MonthPickerProps {
  months: { label: string; value: string }[];
  selected: string;
  onSelect: (month: string) => void;
}
export function MonthPicker({ months, selected, onSelect }: MonthPickerProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.monthPickerScroll}
      contentContainerStyle={{ paddingHorizontal: spacing[4], gap: spacing[2] }}
    >
      {months.map((m) => (
        <Pressable
          key={m.value}
          onPress={() => onSelect(m.value)}
          style={[
            styles.monthPickerItem,
            selected === m.value && styles.monthPickerActive,
          ]}
        >
          <Text
            style={[
              styles.monthPickerText,
              selected === m.value && styles.monthPickerTextActive,
            ]}
          >
            {m.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ── PLAN BADGE ────────────────────────────────────────────────────────────────
interface PlanBadgeProps {
  plan: 'free' | 'know_am' | 'gbam';
  size?: 'sm' | 'md';
}
export function PlanBadge({ plan, size = 'md' }: PlanBadgeProps) {
  const labels = {
    free: { text: 'Free', bg: colors.border, color: colors.textSec },
    know_am: { text: 'Know Am', bg: '#FFE5B4', color: '#8B5A00' },
    gbam: { text: 'Gbam', bg: colors.klakGreen, color: colors.offWhite },
  };

  const label = labels[plan];
  const fontSize = size === 'sm' ? typography.size.xs : typography.size.sm;
  const padding = size === 'sm' ? spacing[1] : spacing[2];

  return (
    <View style={[styles.planBadge, { backgroundColor: label.bg, paddingHorizontal: padding }]}>
      <Text style={[styles.planBadgeText, { color: label.color, fontSize }]}>
        {label.text}
      </Text>
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  transactionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  transactionEmoji: {
    fontSize: 28,
  },
  transactionMerchant: {
    fontSize: typography.size.base,
    fontFamily: typography.family.semibold,
    color: colors.klakBlack,
    marginBottom: spacing[1],
  },
  transactionDate: {
    fontSize: typography.size.xs,
    fontFamily: typography.family.regular,
    color: colors.textSec,
  },
  transactionAmount: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.md,
  },
  budgetBar: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  budgetEmoji: {
    fontSize: 24,
  },
  budgetCategory: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    color: colors.klakBlack,
  },
  budgetAmount: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    color: colors.textSec,
  },
  budgetProgressBg: {
    height: 6,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  insightCard: {
    borderLeftWidth: 4,
    borderRadius: radius.md,
    padding: spacing[4],
    marginVertical: spacing[2],
    marginHorizontal: spacing[4],
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  insightEmoji: {
    fontSize: 24,
  },
  insightTitle: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    flex: 1,
  },
  insightBody: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    color: colors.textSec,
    lineHeight: 20,
  },
  pieSegment: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pieColor: {
    width: spacing[4],
    height: spacing[4],
    borderRadius: radius.sm,
  },
  pieLabel: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    color: colors.klakBlack,
    marginBottom: spacing[1],
  },
  pieAmount: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textSec,
  },
  piePercentage: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.md,
    color: colors.klakBlack,
  },
  monthPickerScroll: {
    marginVertical: spacing[4],
  },
  monthPickerItem: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  monthPickerActive: {
    backgroundColor: colors.klakBlue,
  },
  monthPickerText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    color: colors.textSec,
  },
  monthPickerTextActive: {
    color: colors.offWhite,
  },
  planBadge: {
    borderRadius: radius.full,
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
    alignSelf: 'flex-start',
  },
  planBadgeText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
  },
});
