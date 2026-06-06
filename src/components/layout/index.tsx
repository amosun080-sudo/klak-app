import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Pressable, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { typography, spacing, radius, shadow } from '../../theme/index';

// ── SCREEN HEADER ─────────────────────────────────────────────────────────────
interface ScreenHeaderProps {
  label?: string;
  title: string;
  rightAction?: React.ReactNode;
  subtitle?: string;
}
export function ScreenHeader({ label, title, rightAction, subtitle }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerInner}>
        <View style={styles.headerText}>
          {label && (
            <Text style={styles.headerLabel}>{label.toUpperCase()}</Text>
          )}
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.headerActions}>
          {rightAction ? (
            <View style={styles.actionWrapper}>{rightAction}</View>
          ) : null}
        </View>
      </View>
      <View style={styles.headerDivider} />
    </View>
  );
}

// ── SECTION LABEL ─────────────────────────────────────────────────────────────
export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children.toUpperCase()}</Text>;
}

// ── DIVIDER ───────────────────────────────────────────────────────────────────
export function Divider({ color: c = colors.border }: { color?: string }) {
  return <View style={[styles.divider, { backgroundColor: c }]} />;
}

// ── CARD ──────────────────────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ── GLASS CARD ────────────────────────────────────────────────────────────────
export function GlassCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.glassCard, style]}>{children}</View>;
}

// ── PRIMARY BUTTON ────────────────────────────────────────────────────────────
interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  style?: object;
  icon?: React.ReactNode;
}

export function Button({
  label, onPress, loading, disabled,
  variant = 'primary', size = 'lg', style, icon,
}: ButtonProps) {
  const pad = { sm: 11, md: 14, lg: 17 }[size];
  const fontSize = { sm: typography.size.sm, md: typography.size.base, lg: typography.size.base }[size];

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [styles.btnBase, { opacity: pressed || disabled ? 0.7 : 1 }, style]}
      >
        <LinearGradient
          colors={['#00D68F', '#00A36E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.btnGradient, { paddingVertical: pad }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.btnContent}>
              {icon}
              <Text style={[styles.btnText, { fontSize, color: '#fff' }]}>{label}</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === 'gold') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [styles.btnBase, { opacity: pressed || disabled ? 0.7 : 1 }, style]}
      >
        <LinearGradient
          colors={['#F0C060', '#C9973D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.btnGradient, { paddingVertical: pad }]}
        >
          {loading ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <View style={styles.btnContent}>
              {icon}
              <Text style={[styles.btnText, { fontSize, color: '#0C1A0E' }]}>{label}</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  const outlineColors = {
    outline: { border: colors.klakGreen, text: colors.klakGreen, bg: 'transparent' },
    ghost:   { border: 'transparent',    text: colors.textSec,   bg: 'transparent' },
    danger:  { border: colors.alertRed,  text: colors.alertRed,  bg: colors.alertRedDim },
  }[variant] ?? { border: colors.klakGreen, text: colors.klakGreen, bg: 'transparent' };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btnBase,
        {
          borderWidth: variant === 'ghost' ? 0 : 1.5,
          borderColor: outlineColors.border,
          backgroundColor: outlineColors.bg,
          paddingVertical: pad,
          opacity: pressed || disabled ? 0.65 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={outlineColors.text} size="small" />
      ) : (
        <View style={styles.btnContent}>
          {icon}
          <Text style={[styles.btnText, { fontSize, color: outlineColors.text }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

// ── ICON BUTTON ───────────────────────────────────────────────────────────────
export function IconButton({
  icon, onPress, style,
}: { icon: React.ReactNode; onPress: () => void; style?: object }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.iconBtn, style]} activeOpacity={0.7}>
      {icon}
    </TouchableOpacity>
  );
}

// ── PLAN BADGE ────────────────────────────────────────────────────────────────
export function PlanBadge({ plan }: { plan: 'FREE' | 'PRO' | 'PREMIUM' }) {
  const cfg = {
    FREE:    { label: 'See Am',  bg: colors.border,       text: colors.textSec },
    PRO:     { label: 'Know Am', bg: colors.klakGreenDim, text: colors.white },
    PREMIUM: { label: 'Gbam',    bg: colors.klakGoldDim,  text: colors.background },
  }[plan];
  return (
    <View style={[styles.planBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.planBadgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

// ── SKELETON ─────────────────────────────────────────────────────────────────
export function Skeleton({ width, height, style }: { width: number | string; height: number; style?: object }) {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.85, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3,  duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius: radius.md,
          backgroundColor: colors.surfaceHigh,
          opacity: anim,
        },
        style,
      ]}
    />
  );
}

// ── EMPTY STATE ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle: string;
  action?: { label: string; onPress: () => void };
}
export function EmptyState({ emoji, title, subtitle, action }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Text style={styles.emptyEmoji}>{emoji}</Text>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
      {action && (
        <Button label={action.label} onPress={action.onPress} style={{ marginTop: spacing[5], minWidth: 180 }} />
      )}
    </View>
  );
}

// ── PLAN GATE ─────────────────────────────────────────────────────────────────
export function PlanGate({ plan, onUpgrade }: { plan: 'PRO' | 'PREMIUM'; onUpgrade: () => void }) {
  const label = plan === 'PRO' ? 'Know Am' : 'Gbam';
  const accentColor = plan === 'PRO' ? colors.klakGreen : colors.klakGold;
  return (
    <View style={styles.planGate}>
      <View style={[styles.planGateLock, { borderColor: accentColor + '40', backgroundColor: accentColor + '12' }]}>
        <Text style={styles.planGateEmoji}>🔒</Text>
      </View>
      <Text style={styles.planGateTitle}>Upgrade to {label}</Text>
      <Text style={styles.planGateSub}>This feature is available on the {label} plan.</Text>
      <Button
        label={`Upgrade to ${label}`}
        onPress={onUpgrade}
        variant={plan === 'PREMIUM' ? 'gold' : 'primary'}
        style={{ marginTop: spacing[6], minWidth: 220 }}
      />
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Header
  header: {
    backgroundColor: colors.background,
    paddingTop: spacing[5],
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
  },
  headerText: { flex: 1 },
  headerLabel: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    color: colors.klakGreen,
    letterSpacing: typography.tracking.widest,
    marginBottom: spacing[1],
  },
  headerTitle: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size['2xl'],
    color: colors.white,
    letterSpacing: typography.tracking.tight,
    lineHeight: typography.size['2xl'] * 1.2,
  },
  headerSubtitle: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    color: colors.textSec,
    marginTop: spacing[1],
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  actionWrapper: { marginLeft: spacing[3] },
  headerDivider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.6,
    marginHorizontal: spacing[5],
  },

  // Labels
  sectionLabel: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    color: colors.textMuted,
    letterSpacing: typography.tracking.widest,
    marginBottom: spacing[3],
    marginTop: spacing[1],
  },
  divider: { height: 1, width: '100%' },

  // Cards
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...shadow.card,
  },
  glassCard: {
    backgroundColor: colors.glass,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...shadow.elevated,
  },

  // Button
  btnBase: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: spacing[6],
  },
  btnGradient: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  btnText: {
    fontFamily: typography.family.bold,
    letterSpacing: typography.tracking.wide,
  },

  // Icon button
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },

  // Plan badge
  planBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
  planBadgeText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    letterSpacing: typography.tracking.wide,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[10],
    gap: spacing[3],
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    color: colors.white,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    color: colors.textSec,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },

  // Plan gate
  planGate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    backgroundColor: colors.background,
    gap: spacing[3],
  },
  planGateLock: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: spacing[3],
  },
  planGateEmoji: { fontSize: 40 },
  planGateTitle: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.xl,
    color: colors.white,
    textAlign: 'center',
  },
  planGateSub: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    color: colors.textSec,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },
});
