import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Animated, View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { typography, spacing } from '../../src/theme/index';

// ── Measurements ──────────────────────────────────────────────────────────────
export const TAB_BAR_HEIGHT        = 64;
export const TAB_BAR_BOTTOM_OFFSET = Platform.OS === 'ios' ? 24 : 16;
export const BOTTOM_TAB_PADDING    = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_OFFSET + 16;

// ── Tab config — emoji icons, zero dependency ─────────────────────────────────
const TAB_CONFIG = [
  { name: 'home',                  label: 'Home',     emoji: '🏠' },
  { name: 'transactions/index',    label: 'Activity', emoji: '💳' },
  { name: 'budgets/index',         label: 'Budgets',  emoji: '📊' },
  { name: 'insights',              label: 'Insights', emoji: '✨' },
] as const;

// ── Tab icon component ────────────────────────────────────────────────────────
function TabIcon({
  emoji,
  label,
  focused,
}: {
  emoji:   string;
  label:   string;
  focused: boolean;
}) {
  const iconScale      = useRef(new Animated.Value(focused ? 1 : 0.82)).current;
  const iconOpacity    = useRef(new Animated.Value(focused ? 1 : 0.5)).current;
  const underlineScale = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const labelOpacity   = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(iconScale, {
        toValue: focused ? 1 : 0.82,
        tension: 280,
        friction: 16,
        useNativeDriver: true,
      }),
      Animated.timing(iconOpacity, {
        toValue: focused ? 1 : 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(underlineScale, {
        toValue: focused ? 1 : 0,
        tension: 300,
        friction: 18,
        useNativeDriver: true,
      }),
      Animated.timing(labelOpacity, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <View style={s.tabItem}>
      {/* Emoji icon */}
      <Animated.View
        style={[
          s.iconWrapper,
          { transform: [{ scale: iconScale }], opacity: iconOpacity },
        ]}
      >
        <Text style={s.emoji}>{emoji}</Text>
      </Animated.View>

      {/* Green underline indicator */}
      <Animated.View
        style={[s.underline, { transform: [{ scaleX: underlineScale }] }]}
      />

      {/* Label — only visible when focused */}
      <Animated.Text
        style={[s.label, { opacity: labelOpacity }]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>
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
          borderRadius:    20,
          borderWidth:     1,
          borderColor:     colors.glassBorder,
          borderTopWidth:  0,
          shadowColor:     '#000',
          shadowOpacity:   0.1,
          shadowRadius:    20,
          shadowOffset:    { width: 0, height: 8 },
          elevation:       12,
          overflow:        'hidden',
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
                emoji={tab.emoji}
                label={tab.label}
                focused={focused}
              />
            ),
          }}
        />
      ))}

      {/* ── Hide all sub-routes from the tab bar ── */}
      <Tabs.Screen name="transactions/[id]"  options={{ href: null }} />
      <Tabs.Screen name="budgets/new"        options={{ href: null }} />
      <Tabs.Screen name="budgets/[id]"       options={{ href: null }} />
    </Tabs>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    position: 'relative',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  underline: {
    position: 'absolute',
    bottom: 4,
    width: 20,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: colors.klakGreen,
  },
  label: {
    fontFamily:    typography.family.medium,
    fontSize:      10,
    color:         colors.klakGreen,
    marginTop:     2,
    letterSpacing: 0.3,
  },
});
