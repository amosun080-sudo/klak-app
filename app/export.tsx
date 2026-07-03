import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Alert, Platform,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { subMonths, format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { exportsApi } from '../src/lib/api/index';
import { useAuthStore } from '../src/store/auth';
import { colors } from '../src/theme/colors';
import { typography, spacing, radius } from '../src/theme/index';
import { Card, PlanGate, EmptyState, Skeleton } from '../src/components/layout/index';
import { planMeetsRequirement, safeBack } from '../src/utils/index';
import type { ExportRecord } from '../src/types/models';

export default function ExportScreen() {
  const user    = useAuthStore(s => s.user);
  const qc      = useQueryClient();
  const now     = new Date();
  const canExport = planMeetsRequirement(user?.plan ?? 'FREE', 'PRO');

  const [startDate, setStartDate] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [endDate,   setEndDate]   = useState(format(endOfMonth(now),   'yyyy-MM-dd'));
  const [pdfPending,   setPdfPending]   = useState(false);
  const [excelPending, setExcelPending] = useState(false);

  // ── Past exports ─────────────────────────────────────────────────────────
  const { data: history, isLoading: historyLoading, isError: historyError, refetch: refetchHistory } = useQuery({
    queryKey: ['exports', 'history'],
    queryFn:  () => exportsApi.history().then(r => r.data.data),
    enabled:  canExport,
    staleTime: 60_000,
  });

  // ── Download ──────────────────────────────────────────────────────────────
  const download = async (fmt: 'PDF' | 'EXCEL') => {
    const setPending = fmt === 'PDF' ? setPdfPending : setExcelPending;
    setPending(true);
    try {
      const token = useAuthStore.getState().accessToken;
      const url   = exportsApi.getDownloadUrl({ format: fmt, dateFrom: startDate, dateTo: endDate });
      const ext   = fmt === 'PDF' ? 'pdf' : 'xlsx';
      const filename = `klak-statement-${startDate}_${endDate}.${ext}`;

      if (Platform.OS === 'web') {
        // Web: fetch the blob and trigger a browser download
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(objectUrl);
      } else {
        // Native: download to cache then open share sheet
        const dest = `${FileSystem.cacheDirectory}${filename}`;
        const result = await FileSystem.downloadAsync(url, dest, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (result.status !== 200 && result.status !== 201) {
          throw new Error(`Server returned ${result.status}`);
        }
        // expo-sharing is native-only — require it here so it never loads on web
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Sharing = require('expo-sharing');
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(result.uri, {
            mimeType: fmt === 'PDF'
              ? 'application/pdf'
              : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: `Klak ${fmt} Statement`,
            UTI: fmt === 'PDF' ? 'com.adobe.pdf' : 'org.openxmlformats.spreadsheetml.sheet',
          });
        } else {
          Alert.alert('Downloaded', `Saved to ${result.uri}`);
        }
      }

      qc.invalidateQueries({ queryKey: ['exports', 'history'] });
    } catch (err: any) {
      Alert.alert('Download Failed', err?.message ?? 'Something went wrong. Try again.');
    } finally {
      setPending(false);
    }
  };

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

        <Card style={{ padding: spacing[4], marginBottom: spacing[5] }}>
          <Text style={styles.rangeLabel}>Export range</Text>
          <Text style={styles.rangeValue}>{startDate} → {endDate}</Text>
        </Card>

        {/* Format buttons */}
        <Text style={styles.sectionLabel}>FORMAT</Text>
        <View style={styles.formatRow}>
          <TouchableOpacity
            style={styles.formatCard}
            onPress={() => download('PDF')}
            disabled={pdfPending}
            activeOpacity={0.8}
          >
            <Text style={styles.formatEmoji}>📄</Text>
            <Text style={styles.formatName}>PDF</Text>
            <Text style={styles.formatSub}>Visa · Loans · Records</Text>
            <Text style={[styles.formatBtn, { color: colors.klakBlue }]}>
              {pdfPending ? 'Downloading…' : 'Download'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.formatCard}
            onPress={() => download('EXCEL')}
            disabled={excelPending}
            activeOpacity={0.8}
          >
            <Text style={styles.formatEmoji}>📊</Text>
            <Text style={styles.formatName}>Excel</Text>
            <Text style={styles.formatSub}>Spreadsheet · Analysis</Text>
            <Text style={[styles.formatBtn, { color: colors.klakGreen }]}>
              {excelPending ? 'Downloading…' : 'Download'}
            </Text>
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
                <View style={styles.historyRow}>
                  <Text style={styles.formatEmoji}>{exp.format === 'PDF' ? '📄' : '📊'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyType}>{exp.format} Statement</Text>
                    <Text style={styles.historyDate}>
                      {new Date(exp.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
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
  safe:            { flex: 1, backgroundColor: colors.background },
  header:          {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing[5], paddingVertical: spacing[4],
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backText:        { fontFamily: typography.family.semibold, fontSize: typography.size.base, color: colors.klakGreen, width: 60 },
  headerTitle:     { fontFamily: typography.family.extrabold, fontSize: typography.size.lg, color: colors.white },
  scroll:          { padding: spacing[5], paddingBottom: spacing[10] },
  sectionLabel:    { fontFamily: typography.family.bold, fontSize: typography.size.xs, color: colors.textSec, letterSpacing: 1, marginBottom: spacing[2] },
  presetRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[4] },
  presetPill:      { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.06)' },
  presetPillActive:{ backgroundColor: colors.klakGreen, borderColor: colors.klakGreen },
  presetText:      { fontFamily: typography.family.semibold, fontSize: typography.size.sm, color: colors.textSec },
  rangeLabel:      { fontFamily: typography.family.regular, fontSize: typography.size.xs, color: colors.textSec, marginBottom: 4 },
  rangeValue:      { fontFamily: typography.family.semibold, fontSize: typography.size.base, color: colors.white },
  formatRow:       { flexDirection: 'row', gap: spacing[3], marginBottom: spacing[3] },
  formatCard:      {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.lg,
    padding: spacing[4], borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', gap: spacing[1],
  },
  formatEmoji:     { fontSize: 32 },
  formatName:      { fontFamily: typography.family.extrabold, fontSize: typography.size.lg, color: colors.white },
  formatSub:       { fontFamily: typography.family.regular, fontSize: typography.size.xs, color: colors.textSec, textAlign: 'center' },
  formatBtn:       { fontFamily: typography.family.bold, fontSize: typography.size.base, marginTop: spacing[2] },
  historyRow:      { flexDirection: 'row', alignItems: 'center', padding: spacing[4], gap: spacing[3] },
  historyType:     { fontFamily: typography.family.semibold, fontSize: typography.size.base, color: colors.white },
  historyDate:     { fontFamily: typography.family.regular, fontSize: typography.size.xs, color: colors.textSec, marginTop: 2 },
  rowDiv:          { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: spacing[4] },
});
