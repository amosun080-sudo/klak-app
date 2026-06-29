// ── AUTH ─────────────────────────────────────────────────────────────────────
export type Plan     = 'FREE' | 'PRO' | 'PREMIUM';
export type Language = 'ENGLISH' | 'PIDGIN';

export interface User {
  id:             string;
  phone:          string;
  email?:         string;
  fullName:       string;
  plan:           Plan;
  planExpiresAt?: string;
  language:       Language;
  fcmToken?:      string;
  isVerified:     boolean;
  createdAt:      string;
}

/** Returned directly by /auth/register and /auth/login (not wrapped in data:{}) */
export interface AuthResponse {
  user:          User;
  accessToken:   string;
  refreshToken:  string;
}

/** Returned by /auth/refresh */
export interface TokenPair {
  accessToken:  string;
  refreshToken: string;
}

// ── ACCOUNTS ─────────────────────────────────────────────────────────────────
export type AccountType = 'SAVINGS' | 'CURRENT' | 'WALLET';

export interface Account {
  id:              string;
  institutionName: string;
  accountName:     string;
  accountType:     AccountType;
  balanceCents:    number;      // stored in kobo
  currency:        string;
  lastSyncedAt:    string;
  isActive?:       boolean;
}

/** GET /accounts/balance */
export interface BalanceResponse {
  totalBalanceNaira: number;
  totalKobo:         number;
  accountCount:      number;
  currency:          string;
  accounts?:         Account[];
}

// ── TRANSACTIONS ──────────────────────────────────────────────────────────────
export type TransactionType = 'DEBIT' | 'CREDIT';

export interface Transaction {
  id:          string;
  description: string;
  amountCents: number;      // kobo — positive always, use `type` for direction
  amountNaira: number;      // Naira
  type:        TransactionType;
  date:        string;
  category?:   Category;
  account?:    { id: string; institutionName: string; accountName: string };
  // legacy compat — populated from description if narration missing
  narration?:  string;
  categoryId?: string;
  amount?:     number;      // negative = debit (legacy)
}

export interface TransactionListParams {
  page?:       number;
  limit?:      number;
  accountId?:  string;
  categoryId?: string;
  startDate?:  string;
  endDate?:    string;
  type?:       TransactionType;
  search?:     string;     // ← new: search in description
}

/** GET /transactions/summary */
export interface TransactionSummary {
  totalIncome:       number;   // Naira
  totalExpenses:     number;   // Naira
  netSavings:        number;   // Naira
  categoryBreakdown: Array<{
    category:   string;
    amount:     number;
    percentage: number;
  }>;
}

// ── CATEGORIES ────────────────────────────────────────────────────────────────
export interface Category {
  id:       string;
  name:     string;
  icon:     string;
  color?:   string;
  isSystem: boolean;
  userId?:  string;
}

// ── BUDGETS ───────────────────────────────────────────────────────────────────
export type BudgetPeriod = 'MONTHLY' | 'WEEKLY' | 'YEARLY';
export type BudgetStatus = 'ACTIVE' | 'EXCEEDED' | 'COMPLETED';

export interface Budget {
  id:         string;
  category:   Category;
  categoryId: string;
  limitNaira: number;    // backend sends Naira
  limitCents: number;    // populated client-side (limitNaira * 100)
  spentNaira: number;
  spentCents: number;    // populated client-side
  percentage: number;    // 0-100
  period:     BudgetPeriod;
  status:     BudgetStatus;
  month?:     number;
  year?:      number;
}

export interface BudgetOverview {
  totalBudget:     number;   // Naira
  totalSpent:      number;   // Naira
  percentage:      number;
  budgetCount:     number;
  overBudgetCount: number;
  status:          string;
  // client-side convenience
  overallLimitCents?: number;
  overallSpentCents?: number;
  budgets?: Budget[];
}

export interface CreateBudgetDto {
  categoryId: string;
  limitNaira: number;   // ← Naira (not kobo)
  month?:     number;
  year?:      number;
}

// ── INSIGHTS ──────────────────────────────────────────────────────────────────
export type InsightPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type InsightType     = 'SPENDING_PATTERN' | 'BUDGET_ALERT' | 'SAVINGS_TIP' | 'ANOMALY';

// Map backend priority → legacy severity for UI
export type InsightSeverity = 'warning' | 'info' | 'success';

export interface Insight {
  id:        string;
  type:      InsightType;
  title:     string;
  message:   string;        // backend field (was `body`)
  body?:     string;        // alias populated client-side from message
  priority:  InsightPriority;
  severity?: InsightSeverity; // populated client-side from priority
  isRead:    boolean;
  createdAt: string;
  generatedAt?: string;     // alias for createdAt
  emoji?:    string;        // client-side decoration
  category?: string;
}

// ── ALERTS ────────────────────────────────────────────────────────────────────
export interface AlertSettings {
  budgetAlerts:  boolean;
  pushEnabled:   boolean;
  emailEnabled:  boolean;
  smsEnabled:    boolean;
  thresholds:    number[];
  language?:     Language;
}

export interface Alert {
  id:       string;
  type:     string;
  category: string;
  message:  string;
  sentAt:   string;
  channels: string[];
  // legacy compat
  createdAt?: string;
  read?:      boolean;
}

// ── SUBSCRIPTIONS ─────────────────────────────────────────────────────────────
export interface SubscriptionPlan {
  name:          string;        // 'FREE' | 'PRO' | 'PREMIUM'
  slug?:         string;        // same as name
  price?:        number;        // FREE monthly price (0)
  priceMonthly?: number;
  priceAnnual?:  number;
  features:      string[];
  accountLimit:  number | null;
}

export interface Subscription {
  plan:               string;
  status:             'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  interval:           'MONTHLY' | 'ANNUAL';
  currentPeriodStart: string;
  currentPeriodEnd:   string;
  cancelAtPeriodEnd:  boolean;
  // legacy compat
  id?:           string;
  userId?:       string;
  cancelledAt?:  string;
}

export interface InitiateSubscriptionDto {
  plan:     'PRO' | 'PREMIUM';
  interval: 'MONTHLY' | 'ANNUAL';
}

// ── EXPORTS ───────────────────────────────────────────────────────────────────
export interface ExportRecord {
  id:           string;
  format:       'PDF' | 'EXCEL';
  status:       'PENDING' | 'COMPLETED' | 'FAILED';
  dateFrom:     string;
  dateTo:       string;
  downloadUrl?: string;
  urlExpiresAt?: string;
  createdAt:    string;
  // legacy compat
  type?:        'PDF' | 'EXCEL';
  url?:         string;
  expiresAt?:   string;
}

// ── API WRAPPERS ──────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success?: boolean;
  data?:    T;
  // Some endpoints return data directly without wrapper
  [key: string]: unknown;
}

export interface PaginatedResponse<T> {
  data:       T[];
  pagination: {
    page:  number;
    limit: number;
    total: number;
    // legacy compat
    totalPages?: number;
  };
  // legacy compat
  meta?: {
    page:       number;
    limit:      number;
    total:      number;
    totalPages: number;
  };
}

export interface ApiError {
  statusCode: number;
  error:      string;
  message:    string;
  timestamp:  string;
  path:       string;
}

// Legacy aliases kept for backward compat
export type AuthTokens = TokenPair;
