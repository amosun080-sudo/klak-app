import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated,
  SafeAreaView, FlatList, ActivityIndicator, Platform,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography, spacing, radius, shadow } from '../../theme/index';

// ── LOADING SKELETON ──────────────────────────────────────────────────────────
interface LoadingSkeletonProps {
  lines?: number;
  width?: string | number;
}
export function LoadingSkeleton({ lines = 3, width = '80%' }: LoadingSkeletonProps) {
  const anim = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1000, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(anim, { toValue: 0.3, duration: 1000, useNativeDriver: Platform.OS !== 'web' }),
      ])
    ).start();
  }, [anim]);

  return (
    <View>
      {Array.from({ length: lines }).map((_, i) => {
        const widthValue = i === lines - 1
          ? ('60%' as const)
          : (width as number | `${number}%`);
        return (
          <Animated.View
            key={i}
            style={[
              styles.skeletonLine,
              { width: widthValue, opacity: anim },
              { marginBottom: i < lines - 1 ? spacing[3] : 0 },
            ]}
          />
        );
      })}
    </View>
  );
}

// ── EMPTY STATE ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  cta?: { label: string; onPress: () => void };
}
export function EmptyState({ icon, title, subtitle, cta }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      {icon && <View style={{ marginBottom: spacing[4] }}>{icon}</View>}
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
      {cta && (
        <Pressable style={[styles.emptyButton, shadow.elevated]} onPress={cta.onPress}>
          <Text style={styles.emptyButtonText}>{cta.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ── ALERT BANNER ──────────────────────────────────────────────────────────────
interface AlertBannerProps {
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message?: string;
  onDismiss?: () => void;
}
export function AlertBanner({ type, title, message, onDismiss }: AlertBannerProps) {
  const bgColor = {
    warning: '#FFF9E6',
    error: '#FFEBEB',
    info: '#EBF3FF',
    success: '#EDFAF3',
  }[type];

  const borderColor = {
    warning: '#D4A017',
    error: colors.alertRed,
    info: colors.klakBlue,
    success: colors.klakGreen,
  }[type];

  const textColor = {
    warning: '#7A5C00',
    error: '#8B2C2C',
    info: colors.klakBlue,
    success: '#006845',
  }[type];

  return (
    <View style={[styles.alertBanner, { backgroundColor: bgColor, borderLeftColor: borderColor }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.alertTitle, { color: textColor }]}>{title}</Text>
        {message && <Text style={[styles.alertMessage, { color: textColor }]}>{message}</Text>}
      </View>
      {onDismiss && (
        <Pressable onPress={onDismiss} style={{ padding: spacing[2] }}>
          <Text style={{ fontSize: 18, color: textColor }}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

// ── PLAN GATE ─────────────────────────────────────────────────────────────────
interface PlanGateProps {
  plan: 'free' | 'know_am' | 'gbam';
  requiredPlan: 'pro' | 'premium';
  onUpgrade: () => void;
}
export function PlanGate({ plan, requiredPlan, onUpgrade }: PlanGateProps) {
  return (
    <View style={styles.planGateOverlay}>
      <View style={[styles.planGateCard, shadow.elevated]}>
        <Text style={styles.planGateIcon}>🔒</Text>
        <Text style={styles.planGateTitle}>Upgrade Required</Text>
        <Text style={styles.planGateMessage}>
          This feature is only available on {requiredPlan === 'premium' ? 'Premium' : 'Pro'} plans.
        </Text>
        <Pressable style={[styles.planGateButton, shadow.blue]} onPress={onUpgrade}>
          <Text style={styles.planGateButtonText}>View Plans</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}
export function Toast({ message, type = 'success' }: ToastProps) {
  const bgColor = {
    success: colors.klakGreen,
    error: colors.alertRed,
    info: colors.klakBlue,
  }[type];

  return (
    <View style={[styles.toast, { backgroundColor: bgColor }, shadow.elevated]}>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
}

// ── CONFIRM SHEET ─────────────────────────────────────────────────────────────
interface ConfirmSheetProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'danger' | 'default';
}
export function ConfirmSheet({
  title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onCancel, variant = 'default',
}: ConfirmSheetProps) {
  const confirmColor = variant === 'danger' ? colors.alertRed : colors.klakGreen;

  return (
    <View style={styles.confirmSheetOverlay}>
      <View style={[styles.confirmSheet, shadow.elevated]}>
        <Text style={styles.confirmTitle}>{title}</Text>
        <Text style={styles.confirmMessage}>{message}</Text>
        <View style={styles.confirmActions}>
          <Pressable
            style={[styles.confirmButton, { borderColor: colors.border }]}
            onPress={onCancel}
          >
            <Text style={styles.confirmCancelText}>{cancelLabel}</Text>
          </Pressable>
          <Pressable
            style={[styles.confirmButton, { backgroundColor: confirmColor }]}
            onPress={onConfirm}
          >
            <Text style={styles.confirmConfirmText}>{confirmLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ── PROTECTED ROUTE ───────────────────────────────────────────────────────────
interface ProtectedRouteProps {
  isAuthenticated: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
export function ProtectedRoute({ isAuthenticated, children, fallback }: ProtectedRouteProps) {
  return isAuthenticated ? <>{children}</> : <>{fallback}</>;
}

// ── KEYBOARD SHEET ────────────────────────────────────────────────────────────
interface KeyboardSheetProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  title?: string;
}
export function KeyboardSheet({ visible, onDismiss, children, title }: KeyboardSheetProps) {
  if (!visible) return null;

  return (
    <View style={styles.keyboardSheetOverlay}>
      <Pressable style={styles.keyboardSheetBackdrop} onPress={onDismiss} />
      <View style={[styles.keyboardSheet, shadow.elevated]}>
        {title && (
          <View style={styles.keyboardSheetHeader}>
            <Text style={styles.keyboardSheetTitle}>{title}</Text>
            <Pressable onPress={onDismiss}>
              <Text style={{ fontSize: 24, color: colors.textSec }}>✕</Text>
            </Pressable>
          </View>
        )}
        <View style={{ padding: spacing[4] }}>
          {children}
        </View>
      </View>
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  skeletonLine: {
    height: spacing[4],
    backgroundColor: colors.border,
    borderRadius: radius.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[4],
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontFamily: typography.family.bold,
    color: colors.klakBlack,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.size.base,
    fontFamily: typography.family.regular,
    color: colors.textSec,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  emptyButton: {
    backgroundColor: colors.klakGreen,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: radius.md,
  },
  emptyButtonText: {
    color: colors.offWhite,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
  },
  alertBanner: {
    flexDirection: 'row',
    borderLeftWidth: 4,
    backgroundColor: '#FFF9E6',
    borderRadius: radius.md,
    padding: spacing[4],
    marginVertical: spacing[2],
  },
  alertTitle: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    marginBottom: spacing[1],
  },
  alertMessage: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
  },
  planGateOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  planGateCard: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    padding: spacing[6],
    alignItems: 'center',
    width: '85%',
  },
  planGateIcon: {
    fontSize: 48,
    marginBottom: spacing[4],
  },
  planGateTitle: {
    fontSize: typography.size.lg,
    fontFamily: typography.family.bold,
    color: colors.klakBlack,
    marginBottom: spacing[2],
  },
  planGateMessage: {
    fontSize: typography.size.base,
    fontFamily: typography.family.regular,
    color: colors.textSec,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  planGateButton: {
    backgroundColor: colors.klakBlue,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[8],
    borderRadius: radius.md,
    width: '100%',
    alignItems: 'center',
  },
  planGateButtonText: {
    color: colors.offWhite,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
  },
  toast: {
    position: 'absolute',
    top: spacing[6],
    left: spacing[4],
    right: spacing[4],
    backgroundColor: colors.klakGreen,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radius.md,
    zIndex: 1000,
  },
  toastText: {
    color: colors.offWhite,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
  },
  confirmSheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    zIndex: 998,
  },
  confirmSheet: {
    backgroundColor: colors.offWhite,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing[6],
    paddingBottom: spacing[8],
  },
  confirmTitle: {
    fontSize: typography.size.lg,
    fontFamily: typography.family.bold,
    color: colors.klakBlack,
    marginBottom: spacing[2],
  },
  confirmMessage: {
    fontSize: typography.size.base,
    fontFamily: typography.family.regular,
    color: colors.textSec,
    marginBottom: spacing[6],
    lineHeight: 24,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  confirmButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  confirmCancelText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    color: colors.textSec,
  },
  confirmConfirmText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    color: colors.offWhite,
  },
  keyboardSheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    zIndex: 997,
  },
  keyboardSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardSheet: {
    backgroundColor: colors.offWhite,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '80%',
  },
  keyboardSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  keyboardSheetTitle: {
    fontSize: typography.size.lg,
    fontFamily: typography.family.semibold,
    color: colors.klakBlack,
  },
});
