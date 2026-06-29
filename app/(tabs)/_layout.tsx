import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Animated, View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography, spacing } from '../../src/theme/index';

// ── Measurements ──────────────────────────────────────────────────────────────
export const TAB_BAR_HEIGHT        = 68;
export const TAB_BAR_BOTTOM_OFFSET = Platform.OS === 'ios' ? 24 : 16;
export const BOTTOM_TAB_PADDING    = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_OFFSET + 16;

// ── Tab config ────────────────────────────────────────────────────────────────
const TAB_CONFIG = [
  {
    name:         'home',
    label:        'Home',
    icon:         'home-outline'         as const,
    iconFocused:  'home'                 as const,
  },
  {
    name:         'transactions/index',
    label:        'Activity',
    icon:         'card-outline'         as const,
    iconFocused:  'card'                 as const,
  },
  {
    name:         'budgets/index',
    label:        'Budgets',
    icon:         'bar-chart-outline'    as const,
    iconFocused:  'bar-chart'            as const,
  },
  {
    name:         'insights',
    label:        'Insights',
    icon:         'bulb-outline'         as const,
    iconFocused:  'bulb'                 as const,
  },
] as const;

// ── Tab icon component ────────────────────────────────────────────────────────
function TabIcon({
  icon,
  iconFocused,
  label,
  focused,
}: {
  icon:        React.ComponentProps<typeof Ionicons>['name'];
  iconFocused: React.ComponentProps<typeof Ionicons>['name'];
  label:       string;
  focused:     boolean;
}) {
  const pillScale   = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const pillOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const iconScale   = useRef(new Animated.Value(focused ? 1 : 0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(pillScale, {
        toValue: focused ? 1 : 0,
        tension: 300,
        friction: 20,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(pillOpacity, {
        toValue: focused ? 1 : 0,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(iconScale, {
        toValue: focused ? 1 : 0.9,
        tension: 300,
        friction: 20,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [focused]);

  return (
    <View style={s.tabItem}>
      {/* Pill highlight behind icon */}
      <Animated.View
        style={[
          s.pill,
          {
            opacity: pillOpacity,
            transform: [{ scaleX: pillScale }],
          },
        ]}
      />

      {/* Icon */}
      <Animated.View style={{ transform: [{ scale: iconScale }] }}>
        <Ionicons
          name={focused ? iconFocused : icon}
          size={22}
          color={focused ? colors.klakGreen : colors.textMuted}
        />
      </Animated.View>

      {/* Label — always visible */}
      <Text
        style={[s.label, focused && s.labelFocused]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  const insets      = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, TAB_BAR_BOTTOM_OFFSET);

  return (
    <Tabs
      screenOptions={{
        headerShown:          false,
        tabBarShowLabel:      false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position:        'absolute',
          left:            spacing[4],
          right:           spacing[4],
          bottom:          bottomInset,
          height:          TAB_BAR_HEIGHT,
          backgroundColor: colors.surfaceHigh,
          borderRadius:    22,
          borderWidth:     1,
          borderColor:     colors.glassBorder,
          borderTopWidth:  0,
          shadowColor:     '#000',
          shadowOpacity:   0.15,
          shadowRadius:    24,
          shadowOffset:    { width: 0, height: 8 },
          elevation:       12,
          overflow:        'hidden',
          paddingBottom:   0,
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
                iconFocused={tab.iconFocused}
                label={tab.label}
                focused={focused}
              />
            ),
          }}
        />
      ))}

      {/* ── Hide sub-routes from the tab bar ── */}
      <Tabs.Screen name="transactions/[id]"  options={{ href: null }} />
      <Tabs.Screen name="budgets/new"        options={{ href: null }} />
      <Tabs.Screen name="budgets/[id]"       options={{ href: null }} />
    </Tabs>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  tabItem: {
    alignItems:      'center',
    justifyContent:  'center',
    gap:             3,
    paddingVertical: spacing[2],
    position:        'relative',
    minWidth:        64,
  },
  pill: {
    position:        'absolute',
    top:             6,
    width:           44,
    height:          34,
    borderRadius:    12,
    backgroundColor: colors.klakGreenGlow,
  },
  label: {
    fontFamily:    typography.family.medium,
    fontSize:      10,
    color:         colors.textMuted,
    letterSpacing: 0.2,
  },
  labelFocused: {
    color:         colors.klakGreen,
    fontFamily:    typography.family.bold,
  },
});
