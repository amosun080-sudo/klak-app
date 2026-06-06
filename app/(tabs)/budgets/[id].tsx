import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, FlatList, Alert, ActivityIndicator,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { budgetsApi, getApiError } from '../../../src/lib/api/index';
import { colors } from '../../../src/theme/colors';
import { typography, spacing, radius } from '../../../src/theme/index';
import { CurrencyInput } from '../../../src/components/forms/index';
import { Button, Card, Skeleton } from '../../../src/components/layout/index';
import { SYSTEM_CATEGORIES, currentMonthYear, formatNaira, getBudgetStatus } from '../../../src/utils/index';
import type { Budget } from '../../../src/types/models';

export default function BudgetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const { month, year } = currentMonthYear();

  const [limitCents, setLimitCents] = useState(0);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  // ── Fetch budget ──────────────────────────────────────────────────────────
  const { data: budget, isLoading, isError } = useQuery<Budget>({
    queryKey: ['budget', id],
    queryFn: () =>
      budgetsApi.list().then(r => {
        const found = r.data.data.find(b => b.id === id);
        if (!found) throw new Error('Budget not found');
        setLimitCents(found.limitCents);
        return found;
      }),
    enabled: !!id,
  });

  // ── Update mutation ───────────────────────────────────────────────────────
  const { mutate: update, isPending: updating } = useMutation({
    mutationFn: () => budgetsApi.update(id, { limitCents }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      qc.invalidateQueries({ queryKey: ['budget', id] });
      setEditing(false);
      setError('');
    },
    onError: (err) => setError(getApiError(err)),
  });

  // ── Delete mutation ───────────────────────────────────────────────────────
  const { mutate: del, isPending: deleting } = useMutation({
    mutationFn: () => budgetsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      router.back();
    },
    onError: (err) =>
      Alert.alert('Delete Failed', getApiError(err)),
  });

  const handleDelete = () => {
    Alert.alert('Delete Budget', 'Remove this budget category?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => del() },
    ]);
  };

  const handleSave = () => {
    if (limitCents <= 0) { setError('Enter a spending limit'); return; }
    setError('');
    update();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Budget</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={{ padding: spacing[5], gap: spacing[4] }}>
          <Skeleton width="100%" height={120} style={{ borderRadius: radius.xl }} />
          <Skeleton width="100%" height={80} style={{ borderRadius: radius.xl }} />
          <Skeleton width="100%" height={56} style={{ borderRadius: radius.xl }} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !budget) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Budget</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.errorState}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Budget not found</Text>
          <Button label="Go back" onPress={() => router.back()} style={{ marginTop: spacing[4] }} />
        </View>
      </SafeAreaView>
    );
  }

  const cat = SYSTEM_CATEGORIES.find(c => c.id === budget.categoryId) ?? SYSTEM_CATEGORIES[SYSTEM_CATEGORIES.length - 1];
  const { pct, color, label: statusLabel } = getBudgetStatus(budget.spentCents, budget.limitCents);
  const remaining = Math.max(0, budget.limitCents - budget.spentCents);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{budget.category?.name ?? cat.name}</Text>
        <TouchableOpacity onPress={() => setEditing(e => !e)}>
          <Text style={styles.editText}>{editing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={[styles.catIcon, { backgroundColor: cat.color + '22' }]}>
            <Text style={styles.catEmoji}>{cat.icon}</Text>
          </View>
          <Text style={styles.heroTitle}>{budget.category?.name ?? cat.name}</Text>
          <Text style={styles.heroMonth}>
            {new Date(year, month - 1, 1).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Spent</Text>
            <Text style={[styles.statValue, { color: colors.alertRed }]}>{formatNaira(budget.spentCents)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Limit</Text>
            <Text style={[styles.statValue, { color: colors.white }]}>{formatNaira(budget.limitCents)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text style={[styles.statValue, { color: colors.klakGreen }]}>{formatNaira(remaining)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Used</Text>
            <Text style={[styles.statValue, { color }]}>{Math.round(pct)}%</Text>
          </View>
        </View>

        {/* Progress bar */}
        <Card style={{ padding: spacing[5], marginBottom: spacing[5] }}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Budget utilization</Text>
            <View style={[styles.statusPill, { backgroundColor: color + '22' }]}>
              <Text style={[styles.statusPillText, { color }]}>{statusLabel}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, pct)}%` as any, backgroundColor: color }]} />
          </View>
          <Text style={styles.progressSub}>{Math.round(pct)}% of {formatNaira(budget.limitCents)} used</Text>
        </Card>

        {/* Edit form */}
        {editing && (
          <Card style={{ padding: spacing[5], marginBottom: spacing[5] }}>
            <Text style={styles.sectionLabel}>EDIT LIMIT</Text>
            <CurrencyInput
              label="Monthly spending limit"
              valueCents={limitCents}
              onChange={setLimitCents}
              placeholder="20,000"
              error={undefined}
            />
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            <Button
              label="Save changes"
              onPress={handleSave}
              loading={updating}
              style={{ marginTop: spacing[4] }}
            />
          </Card>
        )}

        {/* Tip */}
        <View style={styles.tip}>
          <Text style={styles.tipText}>
            💡 Klak will alert you at 80% and 100% of this limit — in English or Pidgin, your choice.
          </Text>
        </View>

        {/* Delete */}
        <Button
          label={deleting ? 'Deleting…' : 'Delete budget'}
          onPress={handleDelete}
          loading={deleting}
          variant="danger"
          style={{ marginTop: spacing[4] }}
        />
      </ScrollView>
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
  editText:   { fontFamily: typography.family.semibold, fontSize: typography.size.base, color: colors.klakGold },
  headerTitle: { fontFamily: typography.family.extrabold, fontSize: typography.size.lg, color: colors.white },
  scroll: { padding: spacing[5], paddingBottom: spacing[10] },

  heroCard: { alignItems: 'center', marginBottom: spacing[5], paddingVertical: spacing[4] },
  catIcon: { width: 72, height: 72, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[3] },
  catEmoji: { fontSize: 36 },
  heroTitle: { fontFamily: typography.family.extrabold, fontSize: typography.size['2xl'], color: colors.white, marginBottom: spacing[1] },
  heroMonth: { fontFamily: typography.family.regular, fontSize: typography.size.sm, color: colors.textSec },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3], marginBottom: spacing[5] },
  statCard: {
    width: '47%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: spacing[4],
  },
  statLabel: { fontFamily: typography.family.regular, fontSize: typography.size.xs, color: colors.textSec, marginBottom: spacing[1] },
  statValue: { fontFamily: typography.family.extrabold, fontSize: typography.size.lg },

  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] },
  progressLabel: { fontFamily: typography.family.semibold, fontSize: typography.size.sm, color: colors.textSec },
  statusPill: { borderRadius: radius.full, paddingHorizontal: spacing[3], paddingVertical: spacing[1] },
  statusPillText: { fontFamily: typography.family.semibold, fontSize: typography.size.xs },
  progressTrack: { height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: spacing[2] },
  progressFill: { height: '100%', borderRadius: 5 },
  progressSub: { fontFamily: typography.family.regular, fontSize: typography.size.xs, color: colors.textSec },

  sectionLabel: { fontFamily: typography.family.bold, fontSize: typography.size.xs, color: colors.textSec, letterSpacing: 1, marginBottom: spacing[3] },
  errorText: { fontFamily: typography.family.regular, fontSize: typography.size.sm, color: colors.alertRed, textAlign: 'center', marginTop: spacing[2] },

  tip: { backgroundColor: 'rgba(28,180,130,0.1)', borderRadius: radius.md, padding: spacing[4], borderLeftWidth: 3, borderLeftColor: colors.klakGreen, marginTop: spacing[2] },
  tipText: { fontFamily: typography.family.regular, fontSize: typography.size.sm, color: colors.textSec, lineHeight: 20 },

  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[8] },
  errorEmoji: { fontSize: 48, marginBottom: spacing[3] },
  errorTitle: { fontFamily: typography.family.bold, fontSize: typography.size.lg, color: colors.textSec, textAlign: 'center' },
});
