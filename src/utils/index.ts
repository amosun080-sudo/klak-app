import { router } from 'expo-router';

// ── NAVIGATION ────────────────────────────────────────────────────────────────
export function safeBack(fallback = '/(tabs)/home') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as any);
  }
}

// ── CURRENCY ──────────────────────────────────────────────────────────────────
export function formatNaira(amountCents: number): string {
  const naira = Math.abs(amountCents) / 100;
  if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(1)}M`;
  if (naira >= 1_000)     return `₦${(naira / 1_000).toFixed(0)}k`;
  return `₦${naira.toLocaleString('en-NG')}`;
}

export function formatNairaFull(amountCents: number): string {
  const naira = Math.abs(amountCents) / 100;
  return '₦' + naira.toLocaleString('en-NG', { minimumFractionDigits: 0 });
}

export function formatAmount(amountCents: number): { text: string; sign: '+' | '-' | '' } {
  if (amountCents < 0) return { text: formatNairaFull(amountCents), sign: '-' };
  if (amountCents > 0) return { text: formatNairaFull(amountCents), sign: '+' };
  return { text: formatNairaFull(0), sign: '' };
}

export function centsFromInput(nairaString: string): number {
  const clean = nairaString.replace(/[^0-9.]/g, '');
  return Math.round(parseFloat(clean || '0') * 100);
}

export function nairaFromCents(cents: number): string {
  return (cents / 100).toFixed(0);
}

// ── DATES ─────────────────────────────────────────────────────────────────────
export function formatTxDate(iso: string): string {
  const date = new Date(iso);
  const now  = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const txDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff  = today.getTime() - txDay.getTime();

  if (diff === 0) {
    return `Today, ${date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (diff === 86_400_000) return 'Yesterday';
  return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

export function formatMonthYear(month: number, year: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('en-NG', {
    month: 'long', year: 'numeric',
  });
}

export function currentMonthYear(): { month: number; year: number } {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

// ── CATEGORIES ────────────────────────────────────────────────────────────────
import { colors } from '../theme/colors';

export const SYSTEM_CATEGORIES = [
  { id: 'food',          name: 'Food',          icon: '🍔', color: colors.catFood },
  { id: 'transport',     name: 'Transport',      icon: '🚖', color: colors.catTransport },
  { id: 'entertainment', name: 'Entertainment',  icon: '🎬', color: colors.catEntertainment },
  { id: 'airtime',       name: 'Airtime',        icon: '📱', color: colors.catAirtime },
  { id: 'bills',         name: 'Bills',          icon: '🔌', color: colors.catBills },
  { id: 'savings',       name: 'Savings',        icon: '💰', color: colors.catSavings },
  { id: 'shopping',      name: 'Shopping',       icon: '🛍️', color: '#C45C6A' },
  { id: 'health',        name: 'Health',         icon: '💊', color: '#2E8B6E' },
  { id: 'education',     name: 'Education',      icon: '📚', color: '#4A6BB5' },
  { id: 'other',         name: 'Other',          icon: '📦', color: colors.catOther },
] as const;

export function getCategoryById(id?: string) {
  return SYSTEM_CATEGORIES.find(c => c.id === id) ?? SYSTEM_CATEGORIES[SYSTEM_CATEGORIES.length - 1];
}

// ── BUDGET STATUS ─────────────────────────────────────────────────────────────
export function getBudgetStatus(spentCents: number, limitCents: number) {
  if (limitCents === 0) return { pct: 0, color: colors.klakGreen, label: 'No limit' };
  const pct = (spentCents / limitCents) * 100;
  if (pct >= 100) return { pct: Math.min(pct, 100), color: colors.alertRed,   label: 'Exceeded' };
  if (pct >= 80)  return { pct, color: '#E5A500', label: 'Almost full' };
  return { pct, color: colors.klakGreen, label: 'On track' };
}

// ── PLAN ──────────────────────────────────────────────────────────────────────
import type { Plan } from '../types/models';

export function planLabel(plan: Plan): string {
  if (plan === 'PRO')     return 'Know Am';
  if (plan === 'PREMIUM') return 'Gbam';
  return 'See Am';
}

export function planMeetsRequirement(userPlan: Plan, required: Plan): boolean {
  const order: Plan[] = ['FREE', 'PRO', 'PREMIUM'];
  return order.indexOf(userPlan) >= order.indexOf(required);
}

// ── GREETING ──────────────────────────────────────────────────────────────────
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── PHONE ─────────────────────────────────────────────────────────────────────
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) return '+234' + digits.slice(1);
  if (digits.startsWith('234') && digits.length === 13) return '+' + digits;
  return '+234' + digits;
}

export function isValidNigerianPhone(phone: string): boolean {
  return /^\+234[789][01]\d{8}$/.test(normalizePhone(phone));
}
