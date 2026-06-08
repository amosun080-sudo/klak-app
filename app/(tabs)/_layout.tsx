import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Animated, View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography, radius, spacing } from '../../src/theme/index';
 
// ── Tab bar measurements — exported so screens can clear the bar ──────────────
export const TAB_BAR_HEIGHT        = 72;
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
  const scale         = useRef(new Animated.Value(focused ? 1 : 0.92)).current;
  const opacity       = useRef(new Animated.Value(focused ? 1 : 0.5)).current;
  const bgOpacity     = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const bgScale       = useRef(new Animated.Value(focused ? 1 : 0.8)).current;
  const labelOpacity  = useRef(new Animated.Value(focused ? 1 : 0)).current;
 
  useEffect(() => {
    Animated.parallel([
      // ── Icon scale: premium, responsive ──
      Animated.spring(scale, {
        toValue: focused ? 1 : 0.92,
        tension: 220,
        friction: 14,
        useNativeDriver: true,
      }),
      // ── Icon opacity: refined fade ──
      Animated.timing(opacity, {
        toValue: focused ? 1 : 0.5,
        duration: 220,
        useNativeDriver: true,
      }),
      // ── Background glow: luxe entrance ──
      Animated.timing(bgOpacity, {
        toValue: focused ? 1 : 0,
        duration: 280,
        useNativeDriver: false,
      }),
      // ── Background scale: elegant expansion ──
      Animated.spring(bgScale, {
        toValue: focused ? 1 : 0.7,
        tension: 200,
        friction: 13,
        useNativeDriver: false,
      }),
      // ── Label fade: sophisticated reveal ──
      Animated.timing(labelOpacity, {
        toValue: focused ? 1 : 0,
        duration: 220,
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
            transform: [{ scale: bgScale }],
            backgroundColor: colors.klakGreen,
          },
        ]}
      />
 
      {/* ── Icon container with premium styling ── */}
      <View style={s.iconContainer}>
        <Ionicons
          name={focused ? iconActive : icon}
          size={focused ? 26 : 24}
          color={focused ? colors.klakGreen : colors.textMuted}
          style={s.icon}
        />
      </View>
 
      {/* ── Label: elegant, refined typography ── */}
      <Animated.Text
        style={[
          s.label,
          {
            opacity: labelOpacity,
            fontFamily: focused ? typography.family.semibold : typography.family.medium,
            fontWeight: focused ? '600' : '500',
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
          borderRadius: 32,
          backgroundColor: colors.surfaceHigh,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          borderTopWidth: 0,
          // ── Signature green shadow for luxury feel ──
          shadowColor: colors.klakGreen,
          shadowOpacity: 0.1,
          shadowRadius: 28,
          shadowOffset: { width: 0, height: 14 },
          elevation: 18,
          // ── Ensure clean rendering ──
          overflow: 'hidden',
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
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.lg,
    opacity: 0.1,
  },
  icon: {
    zIndex: 2,
    fontWeight: '600',
  },
  label: {
    fontFamily: typography.family.medium,
    fontSize: 8.5,
    color: colors.klakGreen,
    letterSpacing: 0.2,
    marginTop: 3,
    zIndex: 2,
    textTransform: 'uppercase',
  },
});