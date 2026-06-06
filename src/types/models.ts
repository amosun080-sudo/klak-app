// ── AUTH ─────────────────────────────────────────────────────────────────────
export type Plan = 'FREE' | 'PRO' | 'PREMIUM';
export type Language = 'ENGLISH' | 'PIDGIN';

export interface User {
  id: string;
  phone: string;
  email?: string;
  fullName: string;
  plan: Plan;
  planExpiresAt?: string;
  language: Language;
  fcmToken?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ── ACCOUNTS ─────────────────────────────────────────────────────────────────
export type AccountType = 'SAVINGS' | 'CURRENT' | 'WALLET';

export interface Account {
  id: string;
  userId: string;
  monoAccountId: string;
  institutionName: string;
  accountName: string;
  accountType: AccountType;
  currency: string;
  balanceCents: number;         // in kobo
  balanceUpdatedAt: string;
  isActive: boolean;
}

export interface BalanceResponse {
  totalCents: number;
  accounts: Account[];
}

// ── TRANSACTIONS ──────────────────────────────────────────────────────────────
export type TransactionType = 'DEBIT' | 'CREDIT';

export interface Transaction {
  id: string;
  accountId: string;
  userId: string;
  monoTxRef: string;
  amount: number;               // kobo, negative = debit
  type: TransactionType;
  description: string;
  categoryId?: string;
  category?: Category;
  date: string;
  narration: string;
}

export interface TransactionListParams {
  page?: number;
  limit?: number;
  accountId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
}

export interface TransactionSummary {
  categoryId: string;
  categoryName: string;
  color: string;
  emoji: string;
  totalCents: number;
  count: number;
}

// ── CATEGORIES ────────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  userId?: string;
  name: string;
  icon: string;   // emoji
  color: string;  // hex
  isSystem: boolean;
}

// ── BUDGETS ───────────────────────────────────────────────────────────────────
export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  category: Category;
  limitCents: number;
  month: number;
  year: number;
  spentCents: number;
  alertSentAt80?: string;
  alertSentAt100?: string;
}

export interface BudgetOverview {
  month: number;
  year: number;
  overallLimitCents: number;
  overallSpentCents: number;
  budgets: Budget[];
}

export interface CreateBudgetDto {
  categoryId: string;
  limitCents: number;
  month: number;
  year: number;
}

// ── INSIGHTS ──────────────────────────────────────────────────────────────────
export type InsightSeverity = 'warning' | 'info' | 'success';

export interface Insight {
  id: string;
  title: string;
  body: string;
  category: string;
  severity: InsightSeverity;
  emoji: string;
  generatedAt: string;
}

// ── ALERTS ────────────────────────────────────────────────────────────────────
export interface AlertSettings {
  pushEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  language: Language;
}

export interface Alert {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
}

// ── SUBSCRIPTIONS ─────────────────────────────────────────────────────────────
export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: 'FREE' | 'PRO' | 'PREMIUM';
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
}

export interface Subscription {
  id: string;
  userId: string;
  plan: 'PRO' | 'PREMIUM';
  interval: 'MONTHLY' | 'ANNUAL';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
}

// ── EXPORTS ───────────────────────────────────────────────────────────────────
export interface ExportRecord {
  id: string;
  type: 'PDF' | 'EXCEL';
  url: string;
  createdAt: string;
  expiresAt: string;
}

// ── API RESPONSE WRAPPER ──────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  statusCode: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
}
