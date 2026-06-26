import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Linking, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { subMonths, format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { exportsApi, getApiError } from '../src/lib/api/index';
import { validation } from '../src/lib/validation';
import { useAuthStore } from '../src/store/auth';
import { colors } from '../src/theme/colors';
import { typography, spacing, radius } from '../src/theme/index';
import { Button, Card, PlanGate, EmptyState, Skeleton } from '../src/components/layout/index';
import { planMeetsRequirement, safeBack } from '../src/utils/index';
import type { ExportRecord } from '../src/types/models';

export default function ExportScreen() {
  const user    = useAuthStore(s => s.user);
  const qc = useQueryClient();
  const now = new Date();
  const canExport = planMeetsRequirement(user?.plan ?? 'FREE', 'PRO');

  const [startDate, setStartDate] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [endDate,   setEndDate]   = useState(format(endOfMonth(now), 'yyyy-MM-dd'));

  // Validate date range
  const validateDateRange = () => {
    const dateValidation = validation.dateRange(startDate, endDate);
    return dateValidation === true;
  };

  // ── Past exports ─────────────────────────────────────────────────────────
  const { data: history, isLoading: historyLoading, isError: historyError, refetch: refetchHistory } = useQuery({
    queryKey: ['exports', 'history'],
    queryFn: () => exportsApi.history().then(r => r.data.data),
    enabled: canExport,
    staleTime: 5 * 60 * 1000,
  });

  // ── Generate mutations ────────────────────────────────────────────────────
  const { mutate: genPDF, isPending: pdfPending } = useMutation({
    mutationFn: () => {
      if (!validateDateRange()) {
        throw new Error('Invalid date range selected');
      }
      return exportsApi.request({ format: 'PDF', dateFrom: startDate, dateTo: endDate }).then(r => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exports', 'history'] });
      Alert.alert('Export Requested', 'Your PDF export is being generated. It will appear in Past Exports below shortly.');
    },
    onError: (err) => Alert.alert('Export Failed', getApiError(err)),
  });

  const { mutate: genExcel, isPending: excelPending } = useMutation({
    mutationFn: () => {
      if (!validateDateRange()) {
        throw new Error('Invalid date range selected');
      }
      return exportsApi.request({ format: 'EXCEL', dateFrom: startDate, dateTo: endDate }).then(r => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exports', 'history'] });
      Alert.alert('Export Requested', 'Your Excel export is being generated. It will appear in Past Exports below shortly.');
    },
    onError: (err) => Alert.alert('Export Failed', getApiError(err)),
  });

  if (!canExport) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => safeBack('/settings')}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Export</Text>
          <View style={{ width: 60 }} />
        </View>
        <PlanGate plan="PRO" onUpgrade={() => router.push('/subscription')} />
      </SafeAreaView>
    );
  }

  // Quick month presets using date-fns (no buggy manual arithmetic)
  const presets = [
    {
      label: 'This month',
      start: format(startOfMonth(now), 'yyyy-MM-dd'),
      end:   format(endOfMonth(now),   'yyyy-MM-dd'),
    },
    {
      label: 'Last 3 months',
      start: format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'),
      end:   format(endOfMonth(now),                 'yyyy-MM-dd'),
    },
    {
      label: 'This year',
      start: format(startOfYear(now), 'yyyy-MM-dd'),
      end:   format(endOfYear(now),   'yyyy-MM-dd'),
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack('/settings')}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Export statements</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Period presets */}
        <Text style={styles.sectionLabel}>SELECT PERIOD</Text>
        <View style={styles.presetRow}>
          {presets.map(p => (
            <TouchableOpacity
              key={p.label}
              onPress={() => { setStartDate(p.start); setEndDate(p.end); }}
              style={[styles.presetPill, startDate === p.start && styles.presetPillActive]}
            >
              <Text style={[styles.presetText, startDate === p.start && { color: colors.white }]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Selected range display */}
        <Card style={{ padding: spacing[4], marginBottom: spacing[5] }}>
          <Text style={styles.rangeLabel}>Export range</Text>
          <Text style={styles.rangeValue}>{startDate} → {endDate}</Text>
        </Card>

        {/* Export buttons */}
        <Text style={styles.sectionLabel}>FORMAT</Text>
        <View style={styles.formatRow}>
          <TouchableOpacity
            style={styles.formatCard}
            onPress={() => genPDF()}
            activeOpacity={0.8}
          >
            <Text style={styles.formatEmoji}>📄</Text>
            <Text style={styles.formatName}>PDF</Text>
            <Text style={styles.formatSub}>Visa · Loans · Records</Text>
            {pdfPending
              ? <Text style={styles.formatBtn}>Generating…</Text>
              : <Text style={[styles.formatBtn, { color: colors.klakBlue }]}>Download</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.formatCard}
            onPress={() => genExcel()}
            activeOpacity={0.8}
          >
            <Text style={styles.formatEmoji}>📊</Text>
            <Text style={styles.formatName}>Excel</Text>
            <Text style={styles.formatSub}>Spreadsheet · Analysis</Text>
            {excelPending
              ? <Text style={styles.formatBtn}>Generating…</Text>
              : <Text style={[styles.formatBtn, { color: colors.klakGreen }]}>Download</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Past exports */}
        <Text style={[styles.sectionLabel, { marginTop: spacing[5] }]}>PAST EXPORTS</Text>
        {historyLoading ? (
          <Skeleton width="100%" height={80} style={{ borderRadius: radius.lg }} />
        ) : historyError ? (
          <EmptyState
            emoji="⚠️"
            title="Could not load export history"
            subtitle="Tap to retry."
            action={{ label: 'Retry', onPress: () => refetchHistory() }}
          />
        ) : history && history.length > 0 ? (
          <Card style={{ overflow: 'hidden' }}>
            {(history as ExportRecord[]).map((exp: ExportRecord, i: number) => (
              <View key={exp.id}>
                <TouchableOpacity
                  style={styles.historyRow}
                  onPress={() => exp.url ? Linking.openURL(exp.url) : null}
                  activeOpacity={0.7}
                  disabled={!exp.url}
                >
                  <Text style={styles.formatEmoji}>{exp.type === 'PDF' ? '📄' : '📊'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyType}>{exp.type} Statement</Text>
                    <Text style={styles.historyDate}>
                      {new Date(exp.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={styles.downloadLink}>Open ↗</Text>
                </TouchableOpacity>
                {i < history.length - 1 && <View style={styles.rowDiv} />}
              </View>
            ))}
          </Card>
        ) : (
          <EmptyState
            emoji="📂"
            title="No exports yet"
            subtitle="Your generated statements will appear here."
          />
        )}
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
  backText: { fontFamily: typography.family.semibold, fontSize: typography.size.base, color: colors.klakGreen, width: 60 },
  headerTitle: { fontFamily: typography.family.extrabold, fontSize: typography.size.lg, color: colors.white },
  scroll: { padding: spacing[5], paddingBottom: spacing[10] },
  sectionLabel: { fontFamily: typography.family.bold, fontSize: typography.size.xs, color: colors.textSec, letterSpacing: 1, marginBottom: spacing[2] },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[4] },
  presetPill: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.06)' },
  presetPillActive: { backgroundColor: colors.klakGreen, borderColor: colors.klakGreen },
  presetText: { fontFamily: typography.family.semibold, fontSize: typography.size.sm, color: colors.textSec },
  rangeLabel: { fontFamily: typography.family.regular, fontSize: typography.size.xs, color: colors.textSec, marginBottom: 4 },
  rangeValue: { fontFamily: typography.family.semibold, fontSize: typography.size.base, color: colors.white },
  formatRow: { flexDirection: 'row', gap: spacing[3], marginBottom: spacing[3] },
  formatCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.lg,
    padding: spacing[4], borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', gap: spacing[1],
  },
  formatEmoji: { fontSize: 32 },
  formatName: { fontFamily: typography.family.extrabold, fontSize: typography.size.lg, color: colors.white },
  formatSub: { fontFamily: typography.family.regular, fontSize: typography.size.xs, color: colors.textSec, textAlign: 'center' },
  formatBtn: { fontFamily: typography.family.bold, fontSize: typography.size.base, marginTop: spacing[2] },
  historyRow: { flexDirection: 'row', alignItems: 'center', padding: spacing[4], gap: spacing[3] },
  historyType: { fontFamily: typography.family.semibold, fontSize: typography.size.base, color: colors.white },
  historyDate: { fontFamily: typography.family.regular, fontSize: typography.size.xs, color: colors.textSec, marginTop: 2 },
  downloadLink: { fontFamily: typography.family.semibold, fontSize: typography.size.sm, color: colors.klakGreen },
  rowDiv: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: spacing[4] },
});
