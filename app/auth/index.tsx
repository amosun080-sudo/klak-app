import React, { useState, useEffect, useRef } from 'react';
import {
  Animated, View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, SafeAreaView, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { typography, spacing, radius, shadow } from '../../src/theme/index';
import { LabelledInput, OTPInput } from '../../src/components/forms/index';
import { Button } from '../../src/components/layout/index';
import { authApi, getApiError } from '../../src/lib/api/index';
import { setRefreshToken } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/auth';
import { normalizePhone, isValidNigerianPhone } from '../../src/utils/index';
import { validation, validateFields, isFormValid } from '../../src/lib/validation';

// ── Password strength ─────────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const score = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8)        s++;
    if (password.length >= 12)       s++;
    if (/[A-Z]/.test(password))      s++;
    if (/[0-9]/.test(password))      s++;
    if (/[!@#$%^&*]/.test(password)) s++;
    return Math.min(s, 4);
  })();
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const barColors = [colors.alertRed, '#F97316', colors.klakGold, colors.klakGreen];
  if (!password) return null;
  return (
    <View style={ps.wrap}>
      <View style={ps.bars}>
        {[0, 1, 2, 3].map(i => (
          <View
            key={i}
            style={[ps.bar, { backgroundColor: i < score ? barColors[score - 1] : colors.glassBorder }]}
          />
        ))}
      </View>
      <Text style={[ps.label, { color: barColors[score - 1] }]}>{labels[score - 1]}</Text>
    </View>
  );
}
const ps = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginTop: spacing[2] },
  bars: { flex: 1, flexDirection: 'row', gap: spacing[1] },
  bar:  { flex: 1, height: 3, borderRadius: 2 },
  label: { fontFamily: typography.family.semibold, fontSize: typography.size.xs, width: 48, textAlign: 'right' },
});

// ── Register ──────────────────────────────────────────────────────────────────
function RegisterScreen({ onLogin, onOTP }: { onLogin: () => void; onOTP: (phone: string) => void }) {
  const { login } = useAuthStore();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    // Use the new validation system
    const validationResults = validateFields(
      { fullName, phone: normalizePhone(phone), password, confirm, agreed },
      {
        fullName: validation.fullName,
        phone: validation.phone,
        password: validation.password,
        confirm: (value) => value !== password ? 'Passwords do not match' : true,
        agreed: (value) => !value ? 'Accept terms to continue' : true,
      }
    );
    
    setErrors(validationResults);
    return isFormValid(validationResults);
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const normalized = normalizePhone(phone);
      // Backend returns { user, accessToken, refreshToken } directly
      const { data } = await authApi.register({ phone: normalized, fullName: fullName.trim(), password });
      const tokens = { accessToken: data.accessToken, refreshToken: data.refreshToken };
      await setRefreshToken(data.refreshToken);
      login(tokens, data.user);
      router.replace('/(tabs)/home');
    } catch (err) {
      setErrors({ form: getApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.formTitle}>Create account</Text>
        <Text style={styles.formSub}>Premium finance management for Nigeria.</Text>

        <View style={styles.fieldGroup}>
          <LabelledInput label="Full name" value={fullName} onChangeText={setFullName}
            placeholder="Adaeze Okonkwo" autoCapitalize="words" error={errors.fullName} />
        </View>
        <View style={styles.fieldGroup}>
          <LabelledInput label="Phone (+234)" value={phone} onChangeText={setPhone}
            placeholder="08012345678" keyboardType="phone-pad" autoCapitalize="none" error={errors.phone} />
        </View>
        <View style={styles.fieldGroup}>
          <LabelledInput
            label="Password" value={password} onChangeText={setPassword}
            placeholder="8+ characters" secureTextEntry={!showPass} autoCapitalize="none"
            error={errors.password}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPass(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.eyeToggle}>{showPass ? '●' : '○'}</Text>
              </TouchableOpacity>
            }
          />
          <PasswordStrength password={password} />
        </View>
        <View style={styles.fieldGroup}>
          <LabelledInput label="Confirm password" value={confirm} onChangeText={setConfirm}
            placeholder="Re-enter password" secureTextEntry={!showPass} autoCapitalize="none" error={errors.confirm} />
        </View>

        <Pressable style={styles.checkRow} onPress={() => setAgreed(v => !v)}>
          <View style={[styles.checkbox, agreed && styles.checkboxOn]}>
            {agreed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkLabel}>I agree to the Terms &amp; Privacy Policy</Text>
        </Pressable>
        {errors.terms ? <Text style={styles.fieldError}>{errors.terms}</Text> : null}

        {errors.form ? (
          <View style={styles.formError}><Text style={styles.formErrorText}>⚠ {errors.form}</Text></View>
        ) : null}

        <Button label={loading ? 'Creating…' : 'Continue'} onPress={submit} loading={loading} style={{ marginTop: spacing[5] }} />
        <TouchableOpacity onPress={onLogin} style={styles.switchRow}>
          <Text style={styles.switchText}>Already have an account? </Text>
          <Text style={styles.switchLink}>Sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onRegister, onOTP }: { onRegister: () => void; onOTP: (phone: string) => void }) {
  const { login } = useAuthStore();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const validationResults = validateFields(
      { phone: normalizePhone(phone), password },
      {
        phone: validation.phone,
        password: validation.required,
      }
    );
    
    setErrors(validationResults);
    return isFormValid(validationResults);
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    
    try {
      const normalized = normalizePhone(phone);
      // Backend returns { user, accessToken, refreshToken } directly
      const { data } = await authApi.login({ phone: normalized, password });
      const tokens = { accessToken: data.accessToken, refreshToken: data.refreshToken };
      await setRefreshToken(data.refreshToken);
      login(tokens, data.user);
      router.replace('/(tabs)/home');
    } catch (err) {
      setErrors({ form: getApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  const sendOTPLogin = async () => {
    const normalized = normalizePhone(phone);
    const phoneValidation = validation.phone(normalized);
    
    if (phoneValidation !== true) {
      setErrors({ phone: phoneValidation as string });
      return;
    }
    
    try {
      await authApi.sendOTP(normalized);
      onOTP(normalized);
    } catch (err) {
      setErrors({ form: getApiError(err) });
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.formTitle}>Welcome back</Text>
        <Text style={styles.formSub}>Access your financial overview.</Text>

        {errors.form ? <View style={styles.formError}><Text style={styles.formErrorText}>⚠ {errors.form}</Text></View> : null}

        <View style={styles.fieldGroup}>
          <LabelledInput label="Phone (+234)" value={phone} onChangeText={setPhone}
            placeholder="08012345678" keyboardType="phone-pad" autoCapitalize="none" error={errors.phone} />
        </View>
        <View style={styles.fieldGroup}>
          <LabelledInput
            label="Password" value={password} onChangeText={setPassword}
            placeholder="Enter password" secureTextEntry={!showPass} autoCapitalize="none"
            error={errors.password}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPass(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.eyeToggle}>{showPass ? '●' : '○'}</Text>
              </TouchableOpacity>
            }
          />
        </View>

        <Button label={loading ? 'Signing in…' : 'Sign in'} onPress={submit} loading={loading} style={{ marginTop: spacing[2] }} />

        <View style={styles.divRow}>
          <View style={styles.divLine} /><Text style={styles.divText}>or</Text><View style={styles.divLine} />
        </View>

        <Pressable style={styles.otpBtn} onPress={sendOTPLogin}>
          <Text style={styles.otpBtnText}>Sign in with OTP</Text>
        </Pressable>

        <TouchableOpacity onPress={onRegister} style={styles.switchRow}>
          <Text style={styles.switchText}>Don't have an account? </Text>
          <Text style={styles.switchLink}>Create one</Text>
        </TouchableOpacity>

        <View style={styles.secTip}>
          <Text style={styles.secTipIcon}>🔒</Text>
          <Text style={styles.secTipText}>Klak staff will never ask for your password.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── OTP verify ────────────────────────────────────────────────────────────────
function OTPScreen({ phone, onBack }: { phone: string; onBack: () => void }) {
  const { login } = useAuthStore();
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setInterval(() => setTimer(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [timer]);

  const verify = async () => {
    const otpValidation = validation.otp(otp);
    if (otpValidation !== true) {
      setErrors({ otp: otpValidation as string });
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      // OTP verify only confirms phone — returns { verified, message }
      const { data } = await authApi.verifyOTP({ phone, code: otp });
      if (!data.verified) {
        setErrors({ otp: 'Invalid or expired code. Please try again.' });
        return;
      }
      // After OTP verify, log the user in via password login
      // (they provided phone during OTP request — prompt for password)
      // For now navigate back to login with success message
      onBack();
    } catch (err) {
      setErrors({ otp: getApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (timer > 0) return;
    try { 
      await authApi.sendOTP(phone); 
      setTimer(60);
      setErrors({});
    } catch (err) { 
      setErrors({ form: getApiError(err) }); 
    }
  };

  const masked = phone.replace(/(\+234)(\d{3})(\d{4})(\d{3})/, '$1 $2****$4');

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[styles.formScroll, { alignItems: 'center' }]} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={onBack} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.otpIconWrap}>
          <Text style={styles.otpIcon}>📱</Text>
        </View>
        <Text style={[styles.formTitle, { textAlign: 'center' }]}>Verify identity</Text>
        <Text style={[styles.formSub, { textAlign: 'center', marginBottom: spacing[6] }]}>
          Code sent to <Text style={{ color: colors.klakGreen }}>{masked}</Text>
        </Text>

        <OTPInput value={otp} onChange={setOtp} error={errors.otp} />

        {errors.otp ? <Text style={[styles.fieldError, { marginTop: spacing[3] }]}>⚠ {errors.otp}</Text> : null}
        {errors.form ? (
          <View style={[styles.formError, { marginTop: spacing[3] }]}>
            <Text style={styles.formErrorText}>⚠ {errors.form}</Text>
          </View>
        ) : null}

        <Button
          label={loading ? 'Verifying…' : 'Verify'}
          onPress={verify}
          loading={loading}
          style={{ marginTop: spacing[6], width: '100%' }}
        />

        <TouchableOpacity onPress={resend} disabled={timer > 0} style={{ marginTop: spacing[5] }}>
          <Text style={[styles.resendText, timer > 0 && { color: colors.textMuted }]}>
            {timer > 0 ? `Resend in ${timer}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.otpHint}>Check your spam folder if code doesn't arrive.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Main auth wrapper ─────────────────────────────────────────────────────────
export default function AuthScreen() {
  const [screen, setScreen] = useState<'login' | 'register' | 'otp'>('login');
  const [otpPhone, setOtpPhone] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const switchScreen = (next: typeof screen, phone?: string) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      if (phone) setOtpPhone(phone);
      setScreen(next);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Background gradient */}
      <LinearGradient
        colors={[colors.background, '#0A1F0E', colors.background]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient orbs */}
      <View style={[styles.bgOrb, styles.bgOrbTop]} />
      <View style={[styles.bgOrb, styles.bgOrbBottom]} />

      {/* Logo strip */}
      <View style={styles.logoStrip}>
        <View style={styles.logoMark}>
          <Text style={styles.logoK}>K</Text>
        </View>
        <Text style={styles.logoWordmark}>klak</Text>
      </View>

      {/* Screen content */}
      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        {screen === 'login'    && <LoginScreen    onRegister={() => switchScreen('register')} onOTP={p => switchScreen('otp', p)} />}
        {screen === 'register' && <RegisterScreen onLogin={()    => switchScreen('login')}    onOTP={p => switchScreen('otp', p)} />}
        {screen === 'otp'      && <OTPScreen      phone={otpPhone}                             onBack={() => switchScreen('login')} />}
      </Animated.View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Background
  bgOrb: {
    position: 'absolute',
    borderRadius: radius.full,
    opacity: 0.06,
  },
  bgOrbTop: {
    width: 300, height: 300,
    backgroundColor: colors.klakGreen,
    top: -150, right: -100,
  },
  bgOrbBottom: {
    width: 250, height: 250,
    backgroundColor: colors.klakGold,
    bottom: -80, left: -100,
  },

  // Logo
  logoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[5],
    gap: spacing[3],
  },
  logoMark: {
    width: 40, height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.klakGreen,
    alignItems: 'center', justifyContent: 'center',
    ...shadow.green,
  },
  logoK: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.xl,
    color: colors.background,
  },
  logoWordmark: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.xl,
    color: colors.white,
    letterSpacing: typography.tracking.wide,
  },

  // Form layout
  formScroll: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
  },
  formTitle: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size['2xl'],
    color: colors.white,
    letterSpacing: typography.tracking.tight,
    marginBottom: spacing[2],
  },
  formSub: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    color: colors.textSec,
    marginBottom: spacing[7],
    lineHeight: 22,
  },
  fieldGroup: { marginBottom: spacing[4] },

  // Errors
  fieldError: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    color: colors.alertRed,
    marginTop: spacing[2],
  },
  formError: {
    backgroundColor: colors.alertRedDim,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.alertRed,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  formErrorText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    color: colors.alertRed,
  },

  // Controls
  eyeToggle: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    color: colors.textSec,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  checkbox: {
    width: 22, height: 22,
    borderRadius: radius.xs,
    borderWidth: 1.5,
    borderColor: colors.borderBright,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.klakGreen, borderColor: colors.klakGreen },
  checkmark: { fontFamily: typography.family.bold, fontSize: 13, color: colors.background },
  checkLabel: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    color: colors.textSec,
    flex: 1,
    lineHeight: 20,
  },

  // Switch
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[5],
    gap: 4,
  },
  switchText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    color: colors.textSec,
  },
  switchLink: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    color: colors.klakGreen,
  },

  // Divider
  divRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginVertical: spacing[5],
  },
  divLine: { flex: 1, height: 1, backgroundColor: colors.border },
  divText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textMuted,
    letterSpacing: typography.tracking.wide,
  },

  // OTP button
  otpBtn: {
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.borderBright,
    paddingVertical: spacing[4],
    alignItems: 'center',
    backgroundColor: colors.glass,
  },
  otpBtnText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    color: colors.white,
    letterSpacing: typography.tracking.wide,
  },

  // Security tip
  secTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing[4],
    marginTop: spacing[5],
  },
  secTipIcon: { fontSize: 14 },
  secTipText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 18,
  },

  // OTP screen
  backLink: { alignSelf: 'flex-start', marginBottom: spacing[5] },
  backLinkText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    color: colors.klakGreen,
  },

  otpIconWrap: {
    width: 80, height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.klakGreenGlow,
    borderWidth: 1,
    borderColor: colors.klakGreen + '30',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing[5],
  },
  otpIcon: { fontSize: 36 },
  resendText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    color: colors.klakGreen,
    textAlign: 'center',
  },
  otpHint: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing[5],
  },
});
