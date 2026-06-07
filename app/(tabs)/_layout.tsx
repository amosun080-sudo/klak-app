import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Animated, View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography, radius, spacing } from '../../src/theme/index';

// ── Tab bar measurements — exported so screens can clear the bar ──────────────
export const TAB_BAR_HEIGHT        = 68;
export const TAB_BAR_BOTTOM_OFFSET = Platform.OS === 'ios' ? 24 : 16;
export const BOTTOM_TAB_PADDING    = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_OFFSET + 16;

// ── Tab config ────────────────────────────────────────────────────────────────
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: Array<{
  name: string;
  label: string;
  icon: IoniconsName;
  iconActive: IoniconsName;
}> = [
  { name: 'home',         label: 'Home',     icon: 'home-outline',           iconActive: 'home'           },
  { name: 'transactions', label: 'Activity', icon: 'swap-horizontal-outline', iconActive: 'swap-horizontal'},
  { name: 'budgets',      label: 'Budgets',  icon: 'pie-chart-outline',       iconActive: 'pie-chart'      },
  { name: 'insights',     label: 'Insights', icon: 'sparkles-outline',        iconActive: 'sparkles'       },
];

// ── Tab icon component ────────────────────────────────────────────────────────
function TabIcon({
  icon, iconActive, label, focused,
}: {
  icon: IoniconsName;
  iconActive: IoniconsName;
  label: string;
  focused: boolean;
}) {
  const scale         = useRef(new Animated.Value(focused ? 1 : 0.9)).current;
  const opacity       = useRef(new Animated.Value(focused ? 1 : 0.55)).current;
  const bgOpacity     = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const labelOpacity  = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      // ── Icon scale: crisp, responsive ──
      Animated.spring(scale, {
        toValue: focused ? 1 : 0.9,
        tension: 200,
        friction: 12,
        useNativeDriver: true,
      }),
      // ── Icon opacity: smooth fade ──
      Animated.timing(opacity, {
        toValue: focused ? 1 : 0.55,
        duration: 200,
        useNativeDriver: true,
      }),
      // ── Background glow: subtle entrance ──
      Animated.timing(bgOpacity, {
        toValue: focused ? 1 : 0,
        duration: 240,
        useNativeDriver: false,
      }),
      // ── Label fade: elegant reveal ──
      Animated.timing(labelOpacity, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <Animated.View
      style={[
        s.wrap,
        {
          transform: [{ scale }],
          opacity,
        },
      ]}
    >
      {/* ── Animated background glow ── */}
      <Animated.View
        style={[
          s.bgGlow,
          {
            opacity: bgOpacity,
            backgroundColor: colors.klakGreen,
          },
        ]}
      />

      {/* ── Icon ── */}
      <Ionicons
        name={focused ? iconActive : icon}
        size={24}
        color={focused ? colors.klakGreen : colors.textMuted}
        style={s.icon}
      />

      {/* ── Label: only visible when focused ── */}
      <Animated.Text
        style={[
          s.label,
          {
            opacity: labelOpacity,
            fontFamily: focused ? typography.family.semibold : typography.family.medium,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>
    </Animated.View>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  const insets      = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, TAB_BAR_BOTTOM_OFFSET);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          left: spacing[4],
          right: spacing[4],
          bottom: bottomInset,
          height: TAB_BAR_HEIGHT,
          borderRadius: 28,
          backgroundColor: colors.surfaceHigh,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          borderTopWidth: 0,
          // ── Professional shadow ──
          shadowColor: colors.klakGreen,
          shadowOpacity: 0.08,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
          elevation: 16,
          // ── Subtle backdrop blur effect (iOS) ──
          // Android: handled by surfaceHigh backgroundColor
        },
        tabBarActiveTintColor:   colors.klakGreen,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      {TAB_CONFIG.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon={tab.icon}
                iconActive={tab.iconActive}
                label={tab.label}
                focused={focused}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const s = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  bgGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.lg,
    opacity: 0.08,
  },
  icon: {
    zIndex: 2,
  },
  label: {
    fontFamily: typography.family.medium,
    fontSize: 9,
    color: colors.klakGreen,
    letterSpacing: 0.3,
    marginTop: 2,
    zIndex: 2,
  },
});