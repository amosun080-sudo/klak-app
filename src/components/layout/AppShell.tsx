import React from 'react';
import { View, SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/index';

interface AppShellProps {
  children: React.ReactNode;
  backgroundColor?: string;
}

export function AppShell({ children, backgroundColor = colors.background }: AppShellProps) {
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]}> 
      <StatusBar
        barStyle="light-content"
        backgroundColor={backgroundColor}
        translucent={false}
      />
      <View style={[styles.container, { backgroundColor }]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  container: {
    flex: 1,
  },
});
