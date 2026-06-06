import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Animated, View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography, radius, spacing } from '../../src/theme/index';

// ── Tab bar measurements — exported so screens can clear the bar ──────────────
export const TAB_BAR_HEIGHT        = 64;
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
  const scale   = useRef(new Animated.Value(focused ? 1 : 0.88)).current;
  const opacity = useRef(new Animated.Value(focused ? 1 : 0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1 : 0.88,
        tension: 180,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: focused ? 1 : 0.5,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <Animated.View
      style={[
        s.wrap,
        focused && s.wrapActive,
        { transform: [{ scale }], opacity },
      ]}
    >
      <Ionicons
        name={focused ? iconActive : icon}
        size={22}
        color={focused ? colors.klakGreen : colors.textMuted}
      />
      <Text style={[s.label, focused && s.labelActive]}>{label}</Text>
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
          borderRadius: 22,
          backgroundColor: colors.surfaceHigh,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOpacity: 0.5,
          shadowRadius: 36,
          shadowOffset: { width: 0, height: 18 },
          elevation: 20,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.lg,
    minWidth: 64,
    gap: 3,
  },
  wrapActive: {
    backgroundColor: colors.klakGreenGlow,
  },
  label: {
    fontFamily: typography.family.medium,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  labelActive: {
    color: colors.klakGreen,
  },
});
