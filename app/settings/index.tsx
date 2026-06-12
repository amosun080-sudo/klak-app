import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Alert, Linking, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { usersApi, authApi, getApiError } from '../../src/lib/api/index';
import { clearRefreshToken } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/auth';
import { colors } from '../../src/theme/colors';
import { typography, spacing, radius, shadow } from '../../src/theme/index';
import { LabelledInput } from '../../src/components/forms/index';
import { Button, Card } from '../../src/components/layout/index';
import { planLabel } from '../../src/utils/index';

export default function SettingsScreen() {
  const user       = useAuthStore(s => s.user);
  const logout     = useAuthStore(s => s.logout);
  const updateUser = useAuthStore(s => s.updateUser);
  const qc         = useQueryClient();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [language, setLanguage] = useState<'ENGLISH' | 'PIDGIN'>(user?.language ?? 'ENGLISH');
  const [editing, setEditing]   = useState(false);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    if (user?.fullName) setFullName(user.fullName);
    if (user?.language) setLanguage(user.language);
  }, [user?.fullName, user?.language]);

  useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => usersApi.me().then(r => { updateUser(r.data as any); return r.data; }),
    staleTime: 5 * 60 * 1000,
  });

  const { mutate: updateProfile, isPending: saving } = useMutation({
    mutationFn: () => usersApi.updateMe({ fullName, language }),
    onSuccess: (res) => {
      updateUser(res.data as any);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (err) => Alert.alert('Update Failed', getApiError(err)),
  });

  const { mutate: deleteAccount, isPending: deleting } = useMutation({
    mutationFn: usersApi.deleteMe,
    onSuccess: async () => {
      await clearRefreshToken(); qc.clear(); logout(); router.replace('/auth');
    },
    onError: (err) => Alert.alert('Delete Failed', getApiError(err)),
  });

  const handleLogout = async () => {
    try { await authApi.logout(); } catch (_) {}
    await clearRefreshToken(); qc.clear(); logout(); router.replace('/auth');
  };

  const confirmDelete = () => Alert.alert(
    'Delete Account',
    'This will permanently delete your Klak account and all your data. This cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAccount() },
    ],
  );

  const initials = (user?.fullName ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const planName = planLabel(user?.plan ?? 'FREE');

  const sections = [
    {
      title: 'Account',
      rows: [
        {
          icon: '◈',
          label: 'Subscription',
          value: planName,
          onPress: () => router.push('/subscription'),
        },
        {
          icon: '◎',
          label: 'Alert settings',
          onPress: () => router.push('/alerts/settings'),
        },
        {
          icon: '⬡',
          label: 'Export statements',
          onPress: () => router.push('/export'),
        },
        {
          icon: '⊞',
          label: 'Privacy & Security',
          onPress: () => Alert.alert(
            'Privacy & Security',
            'Your data is encrypted end-to-end. Klak never stores your bank credentials — handled exclusively by Mono Connect.\n\nFor data deletion: support@getklak.ng',
            [{ text: 'OK' }],
          ),
        },
      ],
    },
    {
      title: 'Support',
      rows: [
        {
          icon: '?',
          label: 'Help & FAQ',
          onPress: () => Linking.openURL('https://getklak.ng/help').catch(() =>
            Alert.alert('Could not open', 'Visit getklak.ng/help in your browser.')),
        },
        {
          icon: '✉',
          label: 'Contact support',
          onPress: () => Linking.openURL('mailto:support@getklak.ng?subject=Klak%20Support').catch(() =>
            Alert.alert('Could not open', 'Email us at support@getklak.ng')),
        },
        {
          icon: '★',
          label: 'Rate Klak',
          onPress: () => Linking.openURL('https://play.google.com/store/apps/details?id=ng.getklak.app').catch(() =>
            Alert.alert('Could not open', 'Search "Klak" in the Play Store or App Store.')),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile hero */}
        <LinearGradient
          colors={['#0D2B1A', '#060E07']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHero}
        >
          <View style={[styles.orb, { top: -40, right: -30, backgroundColor: colors.klakGreen }]} />
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{user?.fullName ?? '—'}</Text>
              <Text style={styles.profilePhone}>{user?.phone ?? '—'}</Text>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>{planName}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (!editing) {
                  // Sync latest values when opening edit form
                  setFullName(user?.fullName ?? '');
                  setLanguage(user?.language ?? 'ENGLISH');
                }
                setEditing(e => !e);
              }}
              style={styles.editBtn}
            >
              <Text style={styles.editBtnText}>{editing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Edit form */}
        {editing && (
          <Card style={styles.editCard}>
            <LabelledInput
              label="Full name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
            <Text style={styles.fieldLabel}>Alert language</Text>
            <View style={styles.langRow}>
              {(['ENGLISH', 'PIDGIN'] as const).map(l => (
                <Pressable
                  key={l}
                  onPress={() => setLanguage(l)}
                  style={[styles.langPill, language === l && styles.langPillActive]}
                >
                  <Text style={[styles.langPillText, language === l && { color: colors.background }]}>
                    {l === 'ENGLISH' ? '🇬🇧 English' : '🇳🇬 Pidgin'}
                  </Text>
                </Pressable>
              ))}
            </View>
            {saved && <Text style={styles.savedText}>✓ Changes saved</Text>}
            <Button
              label="Save changes"
              onPress={() => updateProfile()}
              loading={saving}
              style={{ marginTop: spacing[4] }}
            />
          </Card>
        )}

        {/* Setting sections */}
        {sections.map(section => (
          <View key={section.title} style={styles.sectionWrap}>
            <Text style={styles.sectionLabel}>{section.title.toUpperCase()}</Text>
            <View style={styles.sectionCard}>
              {section.rows.map((row, i) => (
                <View key={row.label}>
                  <TouchableOpacity
                    style={styles.settingRow}
                    onPress={row.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={styles.settingIconWrap}>
                      <Text style={styles.settingIcon}>{row.icon}</Text>
                    </View>
                    <Text style={styles.settingLabel}>{row.label}</Text>
                    <View style={{ flex: 1 }} />
                    {row.value && (
                      <Text style={styles.settingValue}>{row.value}</Text>
                    )}
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                  {i < section.rows.length - 1 && (
                    <View style={styles.rowDiv} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Klak v1.0.0 · Built for Nigeria 🇳🇬</Text>
        </View>

        {/* Danger zone */}
        <View style={styles.dangerZone}>
          <Button
            label="Log out"
            onPress={handleLogout}
            variant="outline"
            style={{ marginBottom: spacing[3] }}
          />
          <Button
            label="Delete account"
            onPress={confirmDelete}
            variant="danger"
            loading={deleting}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing[5], paddingVertical: spacing[4],
    borderBottomWidth: 1, borderBottomColor: colors.border,
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
  scroll: { paddingBottom: spacing[10] },

  // Demo banner
  demoBanner: {
    marginHorizontal: spacing[5],
    marginTop: spacing[4],
    marginBottom: spacing[2],
    backgroundColor: colors.klakGoldGlow,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.klakGold,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  demoBannerText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    color: colors.klakGold,
    letterSpacing: 0.3,
  },

  // Profile hero
  profileHero: {
    marginHorizontal: spacing[5],
    marginTop: spacing[5],
    borderRadius: radius['2xl'],
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    marginBottom: spacing[5],
    ...shadow.green,
  },
  orb: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.06,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  avatar: {
    width: 56, height: 56, borderRadius: radius.full,
    backgroundColor: colors.klakGreen,
    alignItems: 'center', justifyContent: 'center',
    ...shadow.green,
  },
  avatarText: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.xl,
    color: colors.background,
  },
  profileName: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    color: colors.white,
    marginBottom: 2,
  },
  profilePhone: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    color: colors.textSec,
    marginBottom: spacing[2],
  },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.klakGreenGlow,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.klakGreen + '30',
  },
  planBadgeText: {
    fontFamily: typography.family.bold,
    fontSize: 10,
    color: colors.klakGreen,
    letterSpacing: 0.8,
  },
  editBtn: {
    backgroundColor: colors.glass,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  editBtnText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    color: colors.klakGold,
  },

  // Edit card
  editCard: {
    marginHorizontal: spacing[5],
    padding: spacing[5],
    marginBottom: spacing[5],
  },
  fieldLabel: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    color: colors.white,
    marginBottom: spacing[2],
    marginTop: spacing[1],
  },
  langRow: { flexDirection: 'row', gap: spacing[2] },
  langPill: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderBright,
    alignItems: 'center',
    backgroundColor: colors.glass,
  },
  langPillActive: {
    backgroundColor: colors.klakGreen,
    borderColor: colors.klakGreen,
  },
  langPillText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    color: colors.textSec,
  },
  savedText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    color: colors.klakGreen,
    textAlign: 'center',
    marginTop: spacing[3],
  },

  // Sections
  sectionWrap: { marginHorizontal: spacing[5], marginBottom: spacing[5] },
  sectionLabel: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    color: colors.textMuted,
    letterSpacing: typography.tracking.widest,
    marginBottom: spacing[3],
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    ...shadow.card,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  settingIconWrap: {
    width: 36, height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingIcon: { fontSize: 16, color: colors.klakGreen },
  settingLabel: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    color: colors.white,
  },
  settingValue: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    color: colors.textSec,
    marginRight: spacing[2],
  },
  chevron: { fontSize: 20, color: colors.textMuted },
  rowDiv: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing[4] + 36 + spacing[3],
  },

  // App info
  appInfo: { alignItems: 'center', marginBottom: spacing[5] },
  appInfoText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textMuted,
    letterSpacing: typography.tracking.wide,
  },

  // Danger
  dangerZone: { marginHorizontal: spacing[5], gap: spacing[3] },
});
