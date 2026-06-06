import React from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import colors from '../tokens/colors.json';
import typography from '../tokens/typography.json';
import spacing from '../tokens/spacing.json';

const { width } = Dimensions.get('window');

export default function OnboardingMockup() {
  return (
    <View style={styles.page}>
      <View style={styles.hero}>
        <Text style={styles.headline}>Welcome to Klak</Text>
        <Text style={styles.lead}>AI-powered personal finance that thinks ahead.</Text>
        <View style={styles.floatingCard}><Text style={{ color: colors.text.primary }}>Your financial pulse — Live</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background.black, alignItems: 'center', justifyContent: 'center' },
  hero: { width: width - 40, alignItems: 'center' },
  headline: { color: colors.text.primary, fontSize: typography.scale['3xl'], fontWeight: '800', textAlign: 'center' },
  lead: { color: colors.text.secondary, marginTop: 12, textAlign: 'center' },
  floatingCard: { marginTop: 28, width: '100%', padding: 18, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center' }
});
