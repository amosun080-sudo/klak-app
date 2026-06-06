import React, { useState } from 'react';
import {
  View, Text, TextInput as RNTextInput, StyleSheet,
  Pressable, ScrollView, FlatList, ActivityIndicator,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography, spacing, radius, shadow } from '../../theme/index';

// ── PHONE INPUT ───────────────────────────────────────────────────────────────
interface PhoneInputProps {
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
  placeholder?: string;
  label?: string;
}
export function PhoneInput({
  value, onChangeText, error, placeholder, label,
}: PhoneInputProps) {
  const [focused, setFocused] = useState(false);
  const displayValue = value.startsWith('+234') ? value : `+234${value}`;

  return (
    <View style={styles.inputWrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.phoneInputBox,
          focused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      >
        <Text style={styles.phonePrefix}>+234</Text>
        <RNTextInput
          value={value.replace(/^\+234/, '')}
          onChangeText={(t) => onChangeText(t.replace(/[^0-9]/g, ''))}
          keyboardType="phone-pad"
          placeholder={placeholder || '801234567'}
          placeholderTextColor={colors.textSec}
          maxLength={10}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.phoneInput}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ── OTP INPUT ─────────────────────────────────────────────────────────────────
interface OTPInputProps {
  value: string;
  onChangeText: (t: string) => void;
  length?: number;
  error?: string;
}
export function OTPInput({ value, onChangeText, length = 6, error }: OTPInputProps) {
  const [focused, setFocused] = useState<number | null>(null);

  return (
    <View style={styles.inputWrapper}>
      <View style={styles.otpContainer}>
        {Array.from({ length }).map((_, i) => (
          <Pressable
            key={i}
            onPress={() => setFocused(i)}
            style={[
              styles.otpBox,
              focused === i && styles.otpBoxFocused,
              !!error && styles.otpBoxError,
            ]}
          >
            <Text style={styles.otpText}>{value[i] || ''}</Text>
          </Pressable>
        ))}
      </View>
      <RNTextInput
        value={value}
        onChangeText={(t) => {
          const sanitized = t.replace(/[^0-9]/g, '').slice(0, length);
          onChangeText(sanitized);
          if (sanitized.length < length) {
            setFocused(sanitized.length);
          }
        }}
        keyboardType="numeric"
        maxLength={length}
        style={styles.otpHiddenInput}
        onFocus={() => setFocused(Math.min(value.length, length - 1))}
        autoFocus
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ── CURRENCY INPUT ────────────────────────────────────────────────────────────
interface CurrencyInputProps {
  value: string;
  onChangeText: (t: string) => void;
  label?: string;
  error?: string;
  placeholder?: string;
}
export function CurrencyInput({
  value, onChangeText, label, error, placeholder,
}: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);

  const formatCurrency = (text: string) => {
    const nums = text.replace(/[^0-9]/g, '');
    if (!nums) return '';
    return Number(nums).toLocaleString('en-NG');
  };

  return (
    <View style={styles.inputWrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.currencyInputBox,
          focused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      >
        <Text style={styles.currencyPrefix}>₦</Text>
        <RNTextInput
          value={formatCurrency(value)}
          onChangeText={(t) => onChangeText(t.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          placeholder={placeholder || '0'}
          placeholderTextColor={colors.textSec}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.currencyInput}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ── CATEGORY PICKER ───────────────────────────────────────────────────────────
interface CategoryOption {
  id: string;
  label: string;
  emoji: string;
  color?: string;
}
interface CategoryPickerProps {
  categories: CategoryOption[];
  selected: string;
  onSelect: (id: string) => void;
  label?: string;
}
export function CategoryPicker({
  categories, selected, onSelect, label,
}: CategoryPickerProps) {
  return (
    <View style={styles.inputWrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            style={[
              styles.categoryPill,
              selected === cat.id && styles.categoryPillActive,
            ]}
          >
            <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
            <Text
              style={[
                styles.categoryLabel,
                selected === cat.id && styles.categoryLabelActive,
              ]}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ── LANGUAGE TOGGLE ───────────────────────────────────────────────────────────
interface LanguageToggleProps {
  value: 'en' | 'pidgin';
  onChange: (lang: 'en' | 'pidgin') => void;
}
export function LanguageToggle({ value, onChange }: LanguageToggleProps) {
  return (
    <View style={styles.languageToggle}>
      <Pressable
        onPress={() => onChange('en')}
        style={[
          styles.languageBtnLeft,
          value === 'en' && styles.languageBtnActive,
        ]}
      >
        <Text style={[styles.languageBtnText, value === 'en' && styles.languageBtnTextActive]}>
          English
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('pidgin')}
        style={[
          styles.languageBtnRight,
          value === 'pidgin' && styles.languageBtnActive,
        ]}
      >
        <Text style={[styles.languageBtnText, value === 'pidgin' && styles.languageBtnTextActive]}>
          Pidgin
        </Text>
      </Pressable>
    </View>
  );
}

// ── SEARCH INPUT ──────────────────────────────────────────────────────────────
interface SearchInputProps {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  onClear?: () => void;
}
export function SearchInput({
  value, onChangeText, placeholder, onClear,
}: SearchInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.searchBox,
        focused && styles.searchBoxFocused,
      ]}
    >
      <Text style={styles.searchIcon}>🔍</Text>
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'Search...'}
        placeholderTextColor={colors.textSec}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.searchInput}
      />
      {value && onClear && (
        <Pressable onPress={onClear} style={{ padding: spacing[2] }}>
          <Text style={{ fontSize: 16, color: colors.textSec }}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

// ── CHECKBOX ──────────────────────────────────────────────────────────────────
interface CheckboxProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  label?: string;
}
export function Checkbox({ value, onValueChange, label }: CheckboxProps) {
  return (
    <Pressable
      style={styles.checkboxContainer}
      onPress={() => onValueChange(!value)}
    >
      <View style={[styles.checkboxBox, value && styles.checkboxBoxChecked]}>
        {value && <Text style={styles.checkmark}>✓</Text>}
      </View>
      {label && <Text style={styles.checkboxLabel}>{label}</Text>}
    </Pressable>
  );
}

// ── RADIO GROUP ───────────────────────────────────────────────────────────────
interface RadioOption {
  id: string;
  label: string;
}
interface RadioGroupProps {
  options: RadioOption[];
  selected: string;
  onSelect: (id: string) => void;
  label?: string;
}
export function RadioGroup({
  options, selected, onSelect, label,
}: RadioGroupProps) {
  return (
    <View style={styles.inputWrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      {options.map((opt) => (
        <Pressable
          key={opt.id}
          onPress={() => onSelect(opt.id)}
          style={styles.radioItem}
        >
          <View style={[styles.radioCircle, selected === opt.id && styles.radioCircleSelected]}>
            {selected === opt.id && <View style={styles.radioDot} />}
          </View>
          <Text style={styles.radioLabel}>{opt.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ── DROPDOWN SELECT ───────────────────────────────────────────────────────────
interface DropdownOption {
  label: string;
  value: string;
}
interface DropdownProps {
  options: DropdownOption[];
  selected: string;
  onSelect: (val: string) => void;
  label?: string;
  placeholder?: string;
}
export function Dropdown({
  options, selected, onSelect, label, placeholder,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === selected)?.label || placeholder || 'Select...';

  return (
    <View style={styles.inputWrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable
        onPress={() => setOpen(!open)}
        style={[styles.dropdownTrigger, open && styles.dropdownTriggerOpen]}
      >
        <Text style={styles.dropdownText}>{selectedLabel}</Text>
        <Text style={styles.dropdownIcon}>{open ? '▲' : '▼'}</Text>
      </Pressable>
      {open && (
        <View style={[styles.dropdownMenu, shadow.card]}>
          {options.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => {
                onSelect(opt.value);
                setOpen(false);
              }}
              style={[
                styles.dropdownItem,
                selected === opt.value && styles.dropdownItemSelected,
              ]}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  selected === opt.value && styles.dropdownItemTextSelected,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  inputWrapper: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: typography.size.sm,
    fontFamily: typography.family.semibold,
    color: colors.klakBlack,
    marginBottom: spacing[2],
  },
  phoneInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    backgroundColor: colors.offWhite,
  },
  phonePrefix: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    color: colors.textSec,
    marginRight: spacing[2],
  },
  phoneInput: {
    flex: 1,
    paddingVertical: spacing[3],
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    color: colors.klakBlack,
  },
  currencyInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    backgroundColor: colors.offWhite,
  },
  currencyPrefix: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.lg,
    color: colors.klakBlack,
    marginRight: spacing[2],
  },
  currencyInput: {
    flex: 1,
    paddingVertical: spacing[3],
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    color: colors.klakBlack,
    textAlign: 'right',
  },
  inputFocused: {
    borderColor: colors.klakBlue,
    borderWidth: 2,
  },
  inputError: {
    borderColor: colors.alertRed,
  },
  errorText: {
    fontSize: typography.size.xs,
    fontFamily: typography.family.regular,
    color: colors.alertRed,
    marginTop: spacing[1],
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  otpBox: {
    width: '14%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.offWhite,
  },
  otpBoxFocused: {
    borderColor: colors.klakBlue,
  },
  otpBoxError: {
    borderColor: colors.alertRed,
  },
  otpText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xl,
    color: colors.klakBlack,
  },
  otpHiddenInput: {
    width: 0,
    height: 0,
  },
  categoryScroll: {
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  categoryPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginHorizontal: spacing[1],
  },
  categoryPillActive: {
    backgroundColor: colors.klakGreen,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: spacing[1],
  },
  categoryLabel: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    color: colors.textSec,
  },
  categoryLabelActive: {
    color: colors.offWhite,
  },
  languageToggle: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  languageBtnLeft: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
    backgroundColor: colors.offWhite,
  },
  languageBtnRight: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    borderLeftWidth: 1.5,
    borderLeftColor: colors.border,
  },
  languageBtnActive: {
    backgroundColor: colors.klakBlue,
  },
  languageBtnText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    color: colors.textSec,
  },
  languageBtnTextActive: {
    color: colors.offWhite,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    backgroundColor: colors.offWhite,
  },
  searchBoxFocused: {
    borderColor: colors.klakBlue,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing[2],
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing[3],
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    color: colors.klakBlack,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  checkboxBox: {
    width: spacing[5],
    height: spacing[5],
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  checkboxBoxChecked: {
    backgroundColor: colors.klakGreen,
    borderColor: colors.klakGreen,
  },
  checkmark: {
    color: colors.offWhite,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
  },
  checkboxLabel: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    color: colors.klakBlack,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  radioCircle: {
    width: spacing[5],
    height: spacing[5],
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: colors.klakBlue,
  },
  radioDot: {
    width: spacing[2],
    height: spacing[2],
    borderRadius: spacing[1],
    backgroundColor: colors.klakBlue,
  },
  radioLabel: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    color: colors.klakBlack,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.offWhite,
  },
  dropdownTriggerOpen: {
    borderColor: colors.klakBlue,
  },
  dropdownText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    color: colors.klakBlack,
  },
  dropdownIcon: {
    fontSize: 12,
    color: colors.textSec,
  },
  dropdownMenu: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.offWhite,
    marginTop: spacing[2],
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemSelected: {
    backgroundColor: '#F0F7FF',
  },
  dropdownItemText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    color: colors.klakBlack,
  },
  dropdownItemTextSelected: {
    color: colors.klakBlue,
    fontFamily: typography.family.semibold,
  },
});
