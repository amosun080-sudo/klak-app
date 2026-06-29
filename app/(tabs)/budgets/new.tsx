import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { budgetsApi, getApiError } from '../../../src/lib/api/index';
import { validation, validateFields, isFormValid } from '../../../src/lib/validation';
import { colors } from '../../../src/theme/colors';
import { typography, spacing, radius } from '../../../src/theme/index';
import { CurrencyInput } from '../../../src/components/forms/index';
import { Button } from '../../../src/components/layout/index';
import { SYSTEM_CATEGORIES, currentMonthYear, safeBack } from '../../../src/utils/index';

// This screen is pushed modally over the tab bar, so it uses its own
// bottom padding — not the tab-bar-aware one.
const BOTTOM_SAFE = Platform.OS === 'ios' ? 40 : 32;

export default function CreateBudgetScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const qc = useQueryClient();
  const { month, year } = currentMonthYear();
  const isEdit = !!id;

  const [selectedCat, setSelectedCat]   = useState<string>('');
  const [customCatName, setCustomCatName] = useState('');
  const [limitCents, setLimitCents]     = useState(0);
  const [errors, setErrors]             = useState<Record<string, string>>({});

  const isOther = selectedCat === 'other';
  // What we actually send to the backend: custom name for "other", slug for everything else
  const effectiveCategoryId = isOther ? customCatName.trim() : selectedCat;

  useQuery({
    queryKey: ['budget', id],
    queryFn: () => budgetsApi.list().then(r => {
      const b = r.data.data.find(x => x.id === id);
      if (b) { setSelectedCat(b.categoryId); setLimitCents(b.limitCents); }
      return b;
    }),
    enabled: isEdit,
  });

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: () => budgetsApi.create({
      categoryId: effectiveCategoryId,
      limitNaira: limitCents / 100,
      month,
      year,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); safeBack('/(tabs)/budgets/index'); },
    onError: (err) => setErrors({ form: getApiError(err) }),
  });

  const { mutate: update, isPending: updating } = useMutation({
    mutationFn: () => budgetsApi.update(id!, { limitNaira: limitCents / 100 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); safeBack('/(tabs)/budgets/index'); },
    onError: (err) => setErrors({ form: getApiError(err) }),
  });

  const { mutate: del, isPending: deleting } = useMutation({
    mutationFn: () => budgetsApi.delete(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); safeBack('/(tabs)/budgets/index'); },
    onError: (err) => Alert.alert('Delete Failed', getApiError(err)),
  });

  const handleDelete = () =>
    Alert.alert('Delete Budget', 'Remove this budget category?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => del() },
    ]);

  const validateForm = () => {
    const validationResults = validateFields(
      { selectedCat, limitCents: limitCents / 100 },
      {
        selectedCat: (value) => {
          if (!value) return 'Please choose a category';
          if (value === 'other' && !customCatName.trim()) return 'Please enter a category name';
          return true;
        },
        limitCents: validation.budgetLimit,
      }
    );
    setErrors(validationResults);
    return isFormValid(validationResults);
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    setErrors({});
    isEdit ? update() : create();
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack('/(tabs)/budgets/index')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Budget' : 'New Budget'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Category grid */}
          {!isEdit && (
            <>
              <Text style={styles.fieldLabel}>Choose a category</Text>
              <View style={styles.catGrid}>
                {SYSTEM_CATEGORIES.map(cat => {
                  const active = selectedCat === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => {
                        setSelectedCat(cat.id);
                        if (cat.id !== 'other') setCustomCatName('');
                        setErrors(prev => ({ ...prev, selectedCat: '' }));
                      }}
                      style={[
                        styles.catItem,
                        active && { borderColor: cat.color, backgroundColor: cat.color + '18' },
                        errors.selectedCat && !active ? { borderColor: colors.alertRed } : null
                      ]}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.catEmoji}>{cat.icon}</Text>
                      <Text style={[styles.catName, active && { color: cat.color }]}>
                        {cat.name}
                      </Text>
                      {active && (
                        <View style={[styles.catCheck, { backgroundColor: cat.color }]}>
                          <Text style={styles.catCheckTick}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.selectedCat && (
                <Text style={styles.fieldError}>⚠ {errors.selectedCat}</Text>
              )}

              {/* Custom name input — shown only when "Other" is selected */}
              {isOther && (
                <View style={styles.customCatWrap}>
                  <Text style={styles.customCatLabel}>Category name</Text>
                  <TextInput
                    style={[
                      styles.customCatInput,
                      errors.selectedCat ? styles.customCatInputError : null,
                    ]}
                    value={customCatName}
                    onChangeText={(t) => {
                      setCustomCatName(t);
                      setErrors(prev => ({ ...prev, selectedCat: '' }));
                    }}
                    placeholder="e.g. Rent, Gym, Pet care…"
                    placeholderTextColor={colors.textMuted}
                    autoFocus
                    autoCapitalize="words"
                    returnKeyType="done"
                    maxLength={40}
                  />
                </View>
              )}
            </>
          )}

          {/* Limit input */}
          <View style={styles.inputSection}>
            <CurrencyInput
              label="Monthly spending limit"
              valueCents={limitCents}
              onChange={(cents) => {
                setLimitCents(cents);
                setErrors(prev => ({ ...prev, limitCents: '' }));
              }}
              placeholder="20,000"
              error={errors.limitCents}
            />
          </View>

          {/* Tip */}
          <View style={styles.tip}>
            <Text style={styles.tipText}>
              💡 Klak alerts you at 80% and 100% of this limit — in English or Pidgin.
            </Text>
          </View>

          {/* Error */}
          {!!errors.form && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {errors.form}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              label={isEdit ? 'Save changes' : 'Create budget'}
              onPress={handleSubmit}
              loading={creating || updating}
            />
            {isEdit && (
              <Button
                label="Delete budget"
                onPress={handleDelete}
                loading={deleting}
                variant="danger"
                style={{ marginTop: spacing[3] }}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  cancelText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    color: colors.klakGreen,
    width: 60,
  },
  headerTitle: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.lg,
    color: colors.white,
  },

  scroll: {
    padding: spacing[5],
    paddingBottom: BOTTOM_SAFE,
  },

  fieldLabel: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    color: colors.textSec,
    letterSpacing: 0.8,
    marginBottom: spacing[4],
    textTransform: 'uppercase',
  },

  // Category grid
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  catItem: {
    // 3 per row with gaps
    width: '30.5%',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[3],
    alignItems: 'center',
    gap: spacing[1],
    position: 'relative',
  },
  catEmoji: { fontSize: 24 },
  catName: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    color: colors.textSec,
    textAlign: 'center',
  },
  catCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catCheckTick: {
    fontSize: 10,
    color: colors.background,
    fontFamily: typography.family.bold,
    lineHeight: 14,
  },

  // Custom category input
  customCatWrap: {
    marginTop: spacing[2],
    marginBottom: spacing[3],
  },
  customCatLabel: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    color: colors.textSec,
    letterSpacing: 0.8,
    marginBottom: spacing[2],
    textTransform: 'uppercase',
  },
  customCatInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    color: colors.white,
  },
  customCatInputError: {
    borderColor: colors.alertRed,
  },

  // Field error
  fieldError: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.xs,
    color: colors.alertRed,
    marginTop: spacing[2],
    marginLeft: spacing[1],
  },

  // Input
  inputSection: {
    marginBottom: spacing[2],
  },

  // Tip
  tip: {
    backgroundColor: 'rgba(0,214,143,0.07)',
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.klakGreen,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  tipText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    color: colors.textSec,
    lineHeight: 20,
  },

  // Error
  errorBox: {
    backgroundColor: 'rgba(255,90,90,0.1)',
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.alertRed,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  errorText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    color: colors.alertRed,
  },

  // Actions — pinned at bottom of scroll with safe area
  actions: {
    marginTop: spacing[4],
    paddingBottom: spacing[2],
  },
});
