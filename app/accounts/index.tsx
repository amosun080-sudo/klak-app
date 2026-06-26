import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { accountsApi, getApiError } from '../../src/lib/api/index';
import { colors } from '../../src/theme/colors';
import { typography, spacing, radius, shadow } from '../../src/theme/index';
import { Button, Skeleton, EmptyState } from '../../src/components/layout/index';
import { formatNairaFull, formatTxDate, safeBack } from '../../src/utils/index';
import type { Account } from '../../src/types/models';

export default function AccountsScreen() {
  const qc = useQueryClient();

  const {
    data: accounts = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.list().then(r => r.data as Account[]),
    staleTime: 30 * 1000,
  });

  const { mutate: unlinkAccount, isPending: isUnlinking } = useMutation({
    mutationFn: (accountId: string) => accountsApi.unlink(accountId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['balance'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      Alert.alert('Account Unlinked', 'Your account has been successfully removed from Klak.', [{ text: 'OK' }]);
    },
    onError: (err) => Alert.alert('Unlink Failed', getApiError(err)),
  });

  const { mutate: syncAccount, isPending: isSyncing } = useMutation({
    mutationFn: (accountId: string) => accountsApi.sync(accountId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['balance'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      const newTxCount = (data as any)?.data?.newTransactions ?? 0;
      Alert.alert(
        'Sync Complete',
        newTxCount > 0
          ? `Found ${newTxCount} new transaction${newTxCount > 1 ? 's' : ''}.`
          : 'Your account is up to date.',
        [{ text: 'OK' }],
      );
    },
    onError: (err) => Alert.alert('Sync Failed', getApiError(err)),
  });

  const handleUnlinkAccount = (account: Account) => {
    Alert.alert(
      'Unlink Account',
      `Are you sure you want to remove ${account.institutionName} ${account.accountType} from Klak? This will also remove all associated transactions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unlink', style: 'destructive', onPress: () => unlinkAccount(account.id) },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => safeBack('/settings')}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Linked Accounts</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.content}>
          {[0, 1, 2].map(i => (
            <Skeleton key={i} width="100%" height={120} style={{ borderRadius: radius.xl, marginBottom: spacing[4] }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => safeBack('/settings')}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Linked Accounts</Text>
          <View style={{ width: 60 }} />
        </View>
        <EmptyState
          emoji="⚠️"
          title="Failed to load accounts"
          subtitle="Pull down to retry"
          action={{ label: 'Try Again', onPress: () => refetch() }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack('/settings')}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Linked Accounts</Text>
        <TouchableOpacity onPress={() => router.push('/accounts/link')}>
          <Text style={styles.addText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {accounts.length === 0 ? (
        <EmptyState
          emoji="🏦"
          title="No accounts linked"
          subtitle="Connect your bank account to start tracking your finances"
          action={{ label: 'Link Account', onPress: () => router.push('/accounts/link') }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.klakGreen} />
          }
        >
          {accounts.map((account: Account) => {
            const isActive = account.isActive !== false;
            const syncDateStr = formatTxDate(account.lastSyncedAt);

            return (
              <View key={account.id} style={styles.accountCard}>
                <View style={styles.accountHeader}>
                  <View style={styles.accountInitials}>
                    <Text style={styles.accountInitialsText}>
                      {account.institutionName.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.accountMeta}>
                    <Text style={styles.accountName}>{account.institutionName}</Text>
                    <Text style={styles.accountType}>{account.accountType} Account</Text>
                  </View>

                  <View style={[styles.statusBadge, {
                    backgroundColor: isActive ? colors.klakGreenGlow : colors.alertRedDim,
                    borderColor: isActive ? colors.klakGreen + '30' : colors.alertRed + '30',
                  }]}>
                    <Text style={[styles.statusText, { color: isActive ? colors.klakGreen : colors.alertRed }]}>
                      {isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <View style={styles.accountStats}>
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>Balance</Text>
                    <Text style={styles.statValue}>{formatNairaFull(account.balanceCents)}</Text>
                  </View>
                  <View style={styles.statSep} />
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>Last Sync</Text>
                    <Text style={styles.statValue}>{syncDateStr}</Text>
                  </View>
                </View>

                <View style={styles.accountActions}>
                  <Button
                    label={isSyncing ? 'Syncing...' : 'Sync Now'}
                    onPress={() => syncAccount(account.id)}
                    loading={isSyncing}
                    variant="outline"
                    size="sm"
                    style={{ flex: 1 }}
                  />
                  <Button
                    label={isUnlinking ? 'Unlinking...' : 'Unlink'}
                    onPress={() => handleUnlinkAccount(account)}
                    loading={isUnlinking}
                    variant="outline"
                    size="sm"
                    style={{ flex: 1, borderColor: colors.alertRed + '40' }}
                    textStyle={{ color: colors.alertRed }}
                  />
                </View>
              </View>
            );
          })}

          <View style={styles.footerNote}>
            <Text style={styles.footerNoteText}>
              💡 Accounts are synced automatically every few hours. Use "Sync Now" for immediate updates.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    color: colors.klakGreen,
    width: 60,
  },
  headerTitle: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.lg,
    color: colors.white,
  },
  addText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    color: colors.klakGreen,
    width: 60,
    textAlign: 'right',
  },

  content: {
    flex: 1,
    padding: spacing[5],
  },
  scroll: {
    padding: spacing[5],
    paddingBottom: spacing[10],
  },

  accountCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing[5],
    marginBottom: spacing[4],
    ...shadow.card,
  },

  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  accountInitials: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.klakGreenGlow,
    borderWidth: 1,
    borderColor: colors.klakGreen + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  accountInitialsText: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.base,
    color: colors.klakGreen,
  },
  accountMeta: { flex: 1 },
  accountName: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    color: colors.white,
    marginBottom: 2,
  },
  accountType: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    color: colors.textSec,
  },
  statusBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderWidth: 1,
  },
  statusText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    letterSpacing: typography.tracking.wide,
  },

  accountStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  statCol: { flex: 1, alignItems: 'center' },
  statLabel: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textMuted,
    letterSpacing: typography.tracking.wide,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    color: colors.white,
  },
  statSep: { width: 1, height: 32, backgroundColor: colors.border },

  accountActions: { flexDirection: 'row', gap: spacing[3] },

  footerNote: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: colors.klakBlue,
    marginTop: spacing[4],
  },
  footerNoteText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    color: colors.textSec,
    lineHeight: 20,
  },
});
