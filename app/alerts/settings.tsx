import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Switch, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { alertsApi, getApiError } from '../../src/lib/api/index';
import { useAuthStore } from '../../src/store/auth';
import { colors } from '../../src/theme/colors';
import { typography, spacing, radius } from '../../src/theme/index';import { Card, Skeleton } from '../../src/components/layout/index';

export default function AlertSettingsScreen() {
  const user = useAuthStore(s => s.user);
  const qc   = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['alerts', 'settings'],
    queryFn: () => alertsApi.settings().then(r => r.data.data),
  });

  const { mutate: update } = useMutation({
    mutationFn: (dto: Parameters<typeof alertsApi.updateSettings>[0]) =>
      alertsApi.updateSettings(dto),
    onMutate: async (dto) => {
      await qc.cancelQueries({ queryKey: ['alerts', 'settings'] });
      qc.setQueryData(['alerts', 'settings'], (old: any) => ({ ...old, ...dto }));
    },
    onError: (err) => {
      Alert.alert('Update Failed', getApiError(err));
      qc.invalidateQueries({ queryKey: ['alerts', 'settings'] });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['alerts', 'settings'] }),
  });

  const toggle = (key: 'pushEnabled' | 'smsEnabled' | 'emailEnabled') => {
    if (!settings || isLoading) return;
    update({ [key]: !settings[key] });
  };

  const toggleLanguage = () => {
    if (!settings || isLoading) return;
    update({ language: settings.language === 'ENGLISH' ? 'PIDGIN' : 'ENGLISH' });
  };

  const rows = [
    { key: 'pushEnabled',  label: 'Push notifications', sub: 'Instant alerts on your phone', icon: '📲' },
    { key: 'smsEnabled',   label: 'SMS alerts',         sub: 'Budget alerts via text message', icon: '💬' },
    { key: 'emailEnabled', label: 'Email alerts',       sub: 'Weekly summaries and reports',   icon: '📧' },
  ] as const;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alert settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {isLoading ? (
          <View style={{ paddingTop: spacing[5], gap: spacing[3] }}>
            <Skeleton width="100%" height={64} style={{ borderRadius: radius.lg }} />
            <Skeleton width="100%" height={64} style={{ borderRadius: radius.lg }} />
            <Skeleton width="100%" height={64} style={{ borderRadius: radius.lg }} />
          </View>
        ) : (
          <>
        <Text style={styles.sectionLabel}>CHANNELS</Text>
        <Card style={{ overflow: 'hidden', marginBottom: spacing[5] }}>
          {rows.map((row, i) => (
            <View key={row.key}>
              <View style={styles.settingRow}>
                <Text style={styles.settingIcon}>{row.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>{row.label}</Text>
                  <Text style={styles.settingSub}>{row.sub}</Text>
                </View>
                <Switch
                  value={settings?.[row.key] ?? false}
                  onValueChange={() => toggle(row.key)}
                  disabled={isLoading}
                  trackColor={{ false: colors.border, true: colors.klakGreen }}
                  thumbColor={colors.white}
                />
              </View>
              {i < rows.length - 1 && <View style={styles.rowDiv} />}
            </View>
          ))}
        </Card>

        <Text style={styles.sectionLabel}>LANGUAGE</Text>
        <Card style={{ overflow: 'hidden' }}>
          <View style={styles.settingRow}>
            <Text style={styles.settingIcon}>🗣️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Alert language</Text>
              <Text style={styles.settingSub}>
                {settings?.language === 'PIDGIN' ? 'Pidgin English' : 'Standard English'}
              </Text>
            </View>
            <Switch
              value={settings?.language === 'PIDGIN'}
              onValueChange={toggleLanguage}
              disabled={isLoading}
              trackColor={{ false: colors.border, true: colors.klakGold }}
              thumbColor={colors.white}
            />
          </View>
          {settings?.language === 'PIDGIN' && (
            <View style={styles.pidginPreview}>
              <Text style={styles.pidginText}>
                "Bills budget almost finish o! You don use 90% — abeg watch am."
              </Text>
            </View>
          )}
        </Card>
          </>
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
  headerTitle:  { fontFamily: typography.family.extrabold, fontSize: typography.size.lg, color: colors.white },
  scroll:       { paddingHorizontal: spacing[5], paddingBottom: spacing[10] },
  sectionLabel: { fontFamily: typography.family.bold, fontSize: typography.size.xs, color: colors.textSec, letterSpacing: 1, marginBottom: spacing[2], paddingTop: spacing[5] },
  settingRow:   { flexDirection: 'row', alignItems: 'center', padding: spacing[4], gap: spacing[3] },
  settingIcon:  { fontSize: 22 },
  settingLabel: { fontFamily: typography.family.semibold, fontSize: typography.size.base, color: colors.white },
  settingSub:   { fontFamily: typography.family.regular, fontSize: typography.size.xs, color: colors.textSec, marginTop: 2 },
  rowDiv:       { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: spacing[4] },
  pidginPreview:{ backgroundColor: 'rgba(216,178,76,0.1)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', padding: spacing[4] },
  pidginText:   { fontFamily: typography.family.medium, fontSize: typography.size.sm, color: colors.klakGold, fontStyle: 'italic', lineHeight: 20 },
});
