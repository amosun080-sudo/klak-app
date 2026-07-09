import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Modal, FlatList, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { transactionsApi, getApiError } from '../../../src/lib/api/index';
import api from '../../../src/lib/api';
import { colors } from '../../../src/theme/colors';
import { typography, spacing, radius, shadow } from '../../../src/theme/index';
import { Button, Card, Skeleton } from '../../../src/components/layout/index';
import { formatNairaFull, formatTxDate, safeBack } from '../../../src/utils/index';
import type { Category } from '../../../src/types/models';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [pendingCatId, setPendingCatId] = useState<string | null>(null);

  // ── Fetch transaction ─────────────────────────────────────────────────────
  const { data: tx, isLoading } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => transactionsApi.get(id).then(r => r.data.data),
    enabled: !!id,
  });

  // ── Fetch real categories (UUIDs from the backend) ────────────────────────
  // Bypass withCache so the picker always reflects the live backend state
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn:  async () => {
      const r = await api.get('/categories');
      const res = r.data as { system?: Category[]; custom?: Category[] };
      return [...(res.system ?? []), ...(res.custom ?? [])] as Category[];
    },
    staleTime: 5 * 60_000,
  });

  // ── Recategorise mutation ─────────────────────────────────────────────────
  const { mutate: recategorise } = useMutation({
    mutationFn: (categoryId: string) => transactionsApi.recategorise(id, categoryId),
    onMutate: (categoryId) => setPendingCatId(categoryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transaction', id] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      setPendingCatId(null);
      setShowCatPicker(false);
    },
    onError: (err) => {
      setPendingCatId(null);
      Alert.alert('Recategorise Failed', getApiError(err));
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ padding: spacing[5] }}>
          <Skeleton width="100%" height={200} style={{ borderRadius: radius.xl }} />
        </View>
      </SafeAreaView>
    );
  }

  if (!tx) return null;

  // Prefer the category object already on the transaction; fall back to categories list
  const cat = tx.category ?? categories.find((c: Category) => c.id === tx.categoryId) ?? { name: 'Other', icon: '📦', color: '#9CA3AF' };
  const isDebit = tx.amount < 0;
  const amountColor = isDebit ? colors.alertRed : colors.klakGreen;
  const amountPrefix = isDebit ? '-' : '+';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity onPress={() => safeBack('/(tabs)/transactions/index')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: cat.color + '20' }]}>
            <Text style={styles.heroEmoji}>{cat.icon}</Text>
          </View>
          <Text style={styles.heroName}>{tx.narration}</Text>
          <Text style={[styles.heroAmount, { color: amountColor }]}>
            {amountPrefix}{formatNairaFull(tx.amount)}
          </Text>
          <Text style={styles.heroDate}>{formatTxDate(tx.date)}</Text>
        </View>

        {/* Details */}
        <Card style={styles.detailCard}>
          {[
            { label: 'Type',        value: tx.type },
            { label: 'Description', value: tx.description },
            { label: 'Date',        value: new Date(tx.date).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
            { label: 'Reference',   value: tx.monoTxRef },
          ].map((row, i, arr) => (
            <View key={row.label}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{row.label}</Text>
                <Text style={styles.detailValue} numberOfLines={1}>{row.value}</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.rowDiv} />}
            </View>
          ))}
        </Card>

        {/* Category */}
        <Text style={styles.sectionLabel}>CATEGORY</Text>
        <TouchableOpacity
          onPress={() => setShowCatPicker(true)}
          style={styles.catRow}
          activeOpacity={0.8}
        >
          <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}>
            <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.catName}>{tx.category?.name ?? cat.name}</Text>
            <Text style={styles.catSub}>Tap to change</Text>
          </View>
          <Text style={styles.catChevron}>›</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Category Picker Modal */}
      <Modal visible={showCatPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Choose category</Text>
            <FlatList
              data={categories}
              keyExtractor={c => c.id}
              renderItem={({ item: c }) => {
                const isActive  = tx.category?.id === c.id || tx.categoryId === c.id;
                const isPending = pendingCatId === c.id;
                return (
                  <TouchableOpacity
                    style={styles.catPickerRow}
                    onPress={() => !pendingCatId && recategorise(c.id)}
                    activeOpacity={0.7}
                    disabled={!!pendingCatId}
                  >
                    <View style={[styles.catPickerIcon, { backgroundColor: (c.color ?? '#9CA3AF') + '20' }]}>
                      <Text style={{ fontSize: 20 }}>{c.icon ?? '📦'}</Text>
                    </View>
                    <Text style={styles.catPickerName}>{c.name}</Text>
                    {isPending
                      ? <ActivityIndicator size="small" color={colors.klakGreen} />
                      : isActive && <Text style={{ color: colors.klakGreen, fontSize: 18 }}>✓</Text>
                    }
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
            <Button label="Cancel" onPress={() => setShowCatPicker(false)} variant="outline" style={{ margin: spacing[5] }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.background },
  scroll:  { padding: spacing[5], paddingBottom: spacing[10] },
  backBtn: { marginBottom: spacing[4] },
  backText: { fontFamily: typography.family.semibold, fontSize: typography.size.base, color: colors.klakGreen },
  hero: { alignItems: 'center', marginBottom: spacing[6] },
  heroIcon: { width: 72, height: 72, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[3] },
  heroEmoji: { fontSize: 32 },
  heroName: { fontFamily: typography.family.bold, fontSize: typography.size.lg, color: colors.white, textAlign: 'center', marginBottom: spacing[2] },
  heroAmount: { fontFamily: typography.family.extrabold, fontSize: typography.size['2xl'], letterSpacing: -0.5 },
  heroDate: { fontFamily: typography.family.regular, fontSize: typography.size.sm, color: colors.textSec, marginTop: spacing[1] },
  detailCard: { marginBottom: spacing[5], overflow: 'hidden' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing[4] },
  detailLabel: { fontFamily: typography.family.regular, fontSize: typography.size.sm, color: colors.textSec },
  detailValue: { fontFamily: typography.family.semibold, fontSize: typography.size.sm, color: colors.white, maxWidth: '60%', textAlign: 'right' },
  rowDiv: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: spacing[4] },
  sectionLabel: { fontFamily: typography.family.bold, fontSize: typography.size.xs, color: colors.textSec, letterSpacing: 1, marginBottom: spacing[2] },
  catRow: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', flexDirection: 'row', alignItems: 'center', padding: spacing[4], gap: spacing[3], ...shadow.card },
  catIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  catName: { fontFamily: typography.family.bold, fontSize: typography.size.base, color: colors.white },
  catSub:  { fontFamily: typography.family.regular, fontSize: typography.size.xs, color: colors.textSec, marginTop: 2 },
  catChevron: { fontSize: 22, color: colors.textSec },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '75%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.16)', alignSelf: 'center', marginTop: spacing[3], marginBottom: spacing[2] },
  modalTitle: { fontFamily: typography.family.extrabold, fontSize: typography.size.lg, color: colors.white, paddingHorizontal: spacing[5], paddingBottom: spacing[3] },
  catPickerRow: { flexDirection: 'row', alignItems: 'center', padding: spacing[4], gap: spacing[3], borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  catPickerIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  catPickerName: { flex: 1, fontFamily: typography.family.semibold, fontSize: typography.size.base, color: colors.white },
});
