import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput as RNTextInput, StyleSheet,
  TouchableOpacity, NativeSyntheticEvent, TextInputKeyPressEventData,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography, spacing, radius } from '../../theme/index';

// ── LABELLED TEXT INPUT ───────────────────────────────────────────────────────
interface InputProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'numeric' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  error?: string;
  rightIcon?: React.ReactNode;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
}
export function LabelledInput({
  label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType = 'default', autoCapitalize = 'sentences',
  error, rightIcon, editable = true, multiline, numberOfLines,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[
        styles.inputBox,
        focused && styles.inputFocused,
        !!error && styles.inputError,
        !editable && styles.inputDisabled,
      ]}>
        <RNTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSec}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={[styles.inputText, multiline && { height: 80, textAlignVertical: 'top' }]}
        />
        {rightIcon && <View style={styles.inputRight}>{rightIcon}</View>}
      </View>
      {!!error && <Text style={styles.inputErrorText}>{error}</Text>}
    </View>
  );
}

// ── PHONE INPUT ───────────────────────────────────────────────────────────────
interface PhoneInputProps {
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
}
export function PhoneInput({ value, onChangeText, error }: PhoneInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>Phone number</Text>
      <View style={[styles.inputBox, focused && styles.inputFocused, !!error && styles.inputError]}>
        <View style={styles.phonePrefix}>
          <Text style={styles.phonePrefixText}>🇳🇬 +234</Text>
        </View>
        <View style={styles.phoneDivider} />
        <RNTextInput
          value={value}
          onChangeText={(t) => onChangeText(t.replace(/[^0-9]/g, ''))}
          placeholder="8012345678"
          placeholderTextColor={colors.textSec}
          keyboardType="phone-pad"
          maxLength={10}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.inputText, { flex: 1 }]}
        />
      </View>
      {!!error && <Text style={styles.inputErrorText}>{error}</Text>}
    </View>
  );
}

// ── OTP INPUT ─────────────────────────────────────────────────────────────────
interface OTPInputProps {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  error?: string;
}
export function OTPInput({ value, onChange, length = 6, error }: OTPInputProps) {
  const refs = useRef<(RNTextInput | null)[]>([]);

  const handleChange = (text: string, idx: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const arr = value.split('');
    arr[idx] = digit;
    const next = arr.join('').slice(0, length);
    onChange(next);
    if (digit && idx < length - 1) refs.current[idx + 1]?.focus();
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  return (
    <View style={styles.otpWrapper}>
      <View style={styles.otpRow}>
        {Array.from({ length }).map((_, i) => (
          <RNTextInput
            key={i}
            ref={(r) => { refs.current[i] = r; }}
            value={value[i] ?? ''}
            onChangeText={(t) => handleChange(t, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            keyboardType="number-pad"
            maxLength={1}
            style={[
              styles.otpBox,
              !!value[i] && styles.otpBoxFilled,
              !!error && styles.otpBoxError,
            ]}
            textAlign="center"
          />
        ))}
      </View>
      {!!error && <Text style={styles.inputErrorText}>{error}</Text>}
    </View>
  );
}

// ── CURRENCY INPUT ────────────────────────────────────────────────────────────
interface CurrencyInputProps {
  label: string;
  valueCents: number;
  onChange: (cents: number) => void;
  error?: string;
  placeholder?: string;
}
export function CurrencyInput({ label, valueCents, onChange, error, placeholder = '0' }: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);
  const display = valueCents > 0 ? (valueCents / 100).toFixed(0) : '';

  const handleChange = (t: string) => {
    const digits = t.replace(/[^0-9]/g, '');
    onChange(parseInt(digits || '0', 10) * 100);
  };

  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputBox, focused && styles.inputFocused, !!error && styles.inputError]}>
        <Text style={styles.currencyPrefix}>₦</Text>
        <RNTextInput
          value={display}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textSec}
          keyboardType="numeric"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.inputText, { flex: 1, fontSize: typography.size.lg, fontFamily: typography.family.bold }]}
        />
      </View>
      {!!error && <Text style={styles.inputErrorText}>{error}</Text>}
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  inputWrapper: { marginBottom: spacing[4] },
  inputLabel: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    color: colors.klakBlack,
    marginBottom: spacing[2],
    letterSpacing: 0.3,
  },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.xl, backgroundColor: colors.surface,
    paddingHorizontal: spacing[4],
    minHeight: 56,
  },
  inputFocused: { borderColor: colors.klakBlue, backgroundColor: colors.surfaceAlt },
  inputError:   { borderColor: colors.alertRed },
  inputDisabled:{ backgroundColor: colors.offWhite },
  inputText: {
    flex: 1,
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    color: colors.klakBlack,
    paddingVertical: spacing[3],
  },
  inputRight: { marginLeft: spacing[2] },
  inputErrorText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    color: colors.alertRed,
    marginTop: spacing[2],
  },
  phonePrefix: { flexDirection: 'row', alignItems: 'center', paddingRight: spacing[3] },
  phonePrefixText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    color: colors.klakBlack,
  },
  phoneDivider: { width: 1, height: 28, backgroundColor: colors.border, marginRight: spacing[3] },
  otpWrapper: { alignItems: 'center' },
  otpRow: { flexDirection: 'row', gap: spacing[3], marginVertical: spacing[4] },
  otpBox: {
    width: 52, height: 60,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, backgroundColor: colors.surface,
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.xl,
    color: colors.klakBlack,
  },
  otpBoxFilled:  { borderColor: colors.klakBlue, backgroundColor: colors.klakBlue + '10' },
  otpBoxError:   { borderColor: colors.alertRed },
  currencyPrefix: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.lg,
    color: colors.klakBlack,
    marginRight: spacing[2],
  },
});
