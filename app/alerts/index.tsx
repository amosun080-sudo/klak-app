import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Switch, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { alertsApi } from '../../src/lib/api/index';
import { useAuthStore } from '../../src/store/auth';
import { colors } from '../../src/theme/colors';
import { typography, spacing, radius } from '../../src/theme/index';
import { ScreenHeader, Card, EmptyState, Skeleton } from '../../src/components/layout/index';
import { safeBack } from '../../src/utils/index';
import type { Alert as KlakAlert } from '../../src/types/models';

// ── ALERTS HISTORY ────────────────────────────────────────────────────────────
export default function AlertsScreen() {
  const { data: alerts, isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ['alerts', 'history'],
    queryFn: () => alertsApi.history().then(r => r.data),
    staleTime: 60 * 1000,
  });

  const severityIcon: Record<string, string> = {
    budget_80:  '⚠️',
    budget_100: '🚨',
    insight:    '💡',
    summary:    '📊',
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack('/settings')}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alerts</Text>
        <TouchableOpacity onPress={() => router.push('/alerts/settings')}>
          <Text style={styles.settingsText}>Settings</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.klakBlue} />}
      >
        {isLoading ? (
          [1,2,3].map(k => (
            <Skeleton key={k} width="100%" height={72} style={{ borderRadius: radius.lg, marginBottom: spacing[3] }} />
          ))
        ) : isError ? (
          <EmptyState
            emoji="⚠️"
            title="Could not load alerts"
            subtitle="Pull down to retry."
            action={{ label: 'Retry', onPress: () => refetch() }}
          />
        ) : !alerts || alerts.length === 0 ? (
          <EmptyState
            emoji="🔔"
            title="No alerts yet"
            subtitle="You'll see budget warnings and spending alerts here."
          />
        ) : (
          <Card style={{ overflow: 'hidden' }}>
            {(alerts as KlakAlert[]).map((alert: KlakAlert, i: number) => (
              <View key={alert.id}>
                <View style={[styles.alertRow, !alert.read && styles.alertUnread]}>
                  <Text style={styles.alertIcon}>{severityIcon[alert.type] ?? '🔔'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.alertMsg, !alert.read && { fontFamily: typography.family.bold }]}>
                      {alert.message}
                    </Text>
                    <Text style={styles.alertDate}>
                      {new Date(alert.createdAt).toLocaleDateString('en-NG', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  {!alert.read && <View style={styles.unreadDot} />}
                </View>
                {i < alerts.length - 1 && <View style={styles.rowDiv} />}
              </View>
            ))}
          </Card>
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
  backText:     { fontFamily: typography.family.semibold, fontSize: typography.size.base, color: colors.klakGreen, width: 60 },
  settingsText: { fontFamily: typography.family.semibold, fontSize: typography.size.base, color: colors.klakGreen },
  headerTitle:  { fontFamily: typography.family.extrabold, fontSize: typography.size.lg, color: colors.white },
  scroll:       { padding: spacing[5], paddingBottom: spacing[10] },
  sectionLabel: { fontFamily: typography.family.bold, fontSize: typography.size.xs, color: colors.textSec, letterSpacing: 1, marginBottom: spacing[2] },
  alertRow:     { flexDirection: 'row', alignItems: 'center', padding: spacing[4], gap: spacing[3] },
  alertUnread:  { backgroundColor: 'rgba(28,180,130,0.1)' },
  alertIcon:    { fontSize: 22 },
  alertMsg:     { fontFamily: typography.family.regular, fontSize: typography.size.base, color: colors.white, lineHeight: 20 },
  alertDate:    { fontFamily: typography.family.regular, fontSize: typography.size.xs, color: colors.textSec, marginTop: 2 },
  unreadDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.klakGreen },
  rowDiv:       { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: spacing[4] },
});
