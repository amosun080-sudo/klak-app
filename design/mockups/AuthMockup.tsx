import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import colors from '../tokens/colors.json';
import typography from '../tokens/typography.json';
import spacing from '../tokens/spacing.json';

const { width } = Dimensions.get('window');

export default function AuthMockup() {
  return (
    <View style={styles.page}>
      <View style={styles.frostCard}>
        <Text style={styles.logo}>KLAK</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to see your money clearly.</Text>

        <TextInput placeholder="+234 812 345 6789" placeholderTextColor={colors.text.muted} style={styles.input} />
        <TextInput placeholder="Password" placeholderTextColor={colors.text.muted} secureTextEntry style={styles.input} />

        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Log in</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow} activeOpacity={0.8}>
          <Text style={styles.linkText}>Don't have an account? <Text style={{ color: colors.brand.emerald }}>Sign up</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background.black, alignItems: 'center', justifyContent: 'center' },
  frostCard: { width: width - 48, padding: 24, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  logo: { color: colors.brand.emerald, fontSize: 20, fontWeight: '800', marginBottom: 8 },
  title: { color: colors.text.primary, fontSize: typography.scale['2xl'], fontWeight: '800' },
  subtitle: { color: colors.text.secondary, marginBottom: 16 },
  input: { backgroundColor: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 12, color: colors.text.primary, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  primaryBtn: { backgroundColor: colors.brand.emerald, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#00110A', fontWeight: '700' },
  linkRow: { alignItems: 'center', marginTop: 12 },
  linkText: { color: colors.text.secondary }
});
