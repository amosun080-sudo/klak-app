/**
 * Demo / preview data used when EXPO_PUBLIC_APP_ENV=demo
 * or when the user taps "Preview Demo" on the login screen.
 * Never imported in production API calls.
 */
import type {
  User, AuthTokens, BalanceResponse, Account,
  Transaction, TransactionSummary, Budget, BudgetOverview,
  Insight, AlertSettings, Alert as KlakAlert,
  SubscriptionPlan, Subscription, ExportRecord,
  ApiResponse, PaginatedResponse,
} from '../types/models';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const DEMO_USER: User = {
  id:          'demo-user-001',
  phone:       '+2348012345678',
  email:       'adaeze@getklak.ng',
  fullName:    'Adaeze Okonkwo',
  plan:        'PRO',
  language:    'ENGLISH',
  isVerified:  true,
  createdAt:   '2024-01-15T08:00:00.000Z',
};

export const DEMO_TOKENS: AuthTokens = {
  accessToken:  'demo-access-token',
  refreshToken: 'demo-refresh-token',
};

// ── Accounts ──────────────────────────────────────────────────────────────────
const DEMO_ACCOUNTS: Account[] = [
  {
    id: 'acc-001', userId: 'demo-user-001', monoAccountId: 'mono-001',
    institutionName: 'GTBank', accountName: 'Adaeze Okonkwo',
    accountType: 'CURRENT', currency: 'NGN',
    balanceCents: 124352000,  // ₦1,243,520
    balanceUpdatedAt: new Date().toISOString(), isActive: true,
  },
  {
    id: 'acc-002', userId: 'demo-user-001', monoAccountId: 'mono-002',
    institutionName: 'Kuda Bank', accountName: 'Adaeze Okonkwo',
    accountType: 'SAVINGS', currency: 'NGN',
    balanceCents: 34200000,   // ₦342,000
    balanceUpdatedAt: new Date().toISOString(), isActive: true,
  },
  {
    id: 'acc-003', userId: 'demo-user-001', monoAccountId: 'mono-003',
    institutionName: 'Opay', accountName: 'Adaeze Okonkwo',
    accountType: 'WALLET', currency: 'NGN',
    balanceCents: 8750000,    // ₦87,500
    balanceUpdatedAt: new Date().toISOString(), isActive: true,
  },
];

export const DEMO_BALANCE: BalanceResponse = {
  totalCents: DEMO_ACCOUNTS.reduce((s, a) => s + a.balanceCents, 0),
  accounts: DEMO_ACCOUNTS,
};

// ── Transactions ──────────────────────────────────────────────────────────────
const now = new Date();
const d = (daysAgo: number) => {
  const t = new Date(now); t.setDate(t.getDate() - daysAgo);
  return t.toISOString();
};

export const DEMO_TRANSACTIONS: Transaction[] = [
  { id: 'tx-001', accountId: 'acc-001', userId: 'demo-user-001', monoTxRef: 'ref-001', amount: -450000, type: 'DEBIT',  description: 'POS Purchase', categoryId: 'food',          category: { id: 'food',          name: 'Food',          icon: '🍔', color: '#C99240', isSystem: true }, date: d(0),  narration: 'Chicken Republic VI Lagos' },
  { id: 'tx-002', accountId: 'acc-001', userId: 'demo-user-001', monoTxRef: 'ref-002', amount:  5000000, type: 'CREDIT', description: 'Transfer',     categoryId: 'income',       category: { id: 'income',        name: 'Income',        icon: '💰', color: '#00D68F', isSystem: true }, date: d(1),  narration: 'Salary - Acme Corp Ltd' },
  { id: 'tx-003', accountId: 'acc-001', userId: 'demo-user-001', monoTxRef: 'ref-003', amount: -120000, type: 'DEBIT',  description: 'Airtime',       categoryId: 'airtime',      category: { id: 'airtime',       name: 'Airtime',       icon: '📱', color: '#9B4AB0', isSystem: true }, date: d(2),  narration: 'MTN Airtime Recharge' },
  { id: 'tx-004', accountId: 'acc-002', userId: 'demo-user-001', monoTxRef: 'ref-004', amount: -85000,  type: 'DEBIT',  description: 'Uber',          categoryId: 'transport',    category: { id: 'transport',     name: 'Transport',     icon: '🚖', color: '#3A9E52', isSystem: true }, date: d(2),  narration: 'Uber Technologies' },
  { id: 'tx-005', accountId: 'acc-001', userId: 'demo-user-001', monoTxRef: 'ref-005', amount: -320000, type: 'DEBIT',  description: 'Utility',       categoryId: 'bills',        category: { id: 'bills',         name: 'Bills',         icon: '🔌', color: '#D08A45', isSystem: true }, date: d(3),  narration: 'EKEDC Electricity Bill' },
  { id: 'tx-006', accountId: 'acc-001', userId: 'demo-user-001', monoTxRef: 'ref-006', amount: -650000, type: 'DEBIT',  description: 'Groceries',     categoryId: 'food',         category: { id: 'food',          name: 'Food',          icon: '🍔', color: '#C99240', isSystem: true }, date: d(4),  narration: 'Shoprite Lekki Phase 1' },
  { id: 'tx-007', accountId: 'acc-003', userId: 'demo-user-001', monoTxRef: 'ref-007', amount: -200000, type: 'DEBIT',  description: 'Entertainment', categoryId: 'entertainment',category: { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#5B9E72', isSystem: true }, date: d(5),  narration: 'Netflix Monthly Sub' },
  { id: 'tx-008', accountId: 'acc-001', userId: 'demo-user-001', monoTxRef: 'ref-008', amount:  800000, type: 'CREDIT', description: 'Transfer',      categoryId: 'income',       category: { id: 'income',        name: 'Income',        icon: '💰', color: '#00D68F', isSystem: true }, date: d(6),  narration: 'Freelance Payment - Taiwo' },
  { id: 'tx-009', accountId: 'acc-002', userId: 'demo-user-001', monoTxRef: 'ref-009', amount: -180000, type: 'DEBIT',  description: 'POS',           categoryId: 'food',         category: { id: 'food',          name: 'Food',          icon: '🍔', color: '#C99240', isSystem: true }, date: d(7),  narration: 'Dominos Pizza Ikeja' },
  { id: 'tx-010', accountId: 'acc-001', userId: 'demo-user-001', monoTxRef: 'ref-010', amount: -500000, type: 'DEBIT',  description: 'Savings',       categoryId: 'savings',      category: { id: 'savings',       name: 'Savings',       icon: '💰', color: '#46C495', isSystem: true }, date: d(8),  narration: 'PiggyVest Weekly Save' },
];

export const DEMO_TRANSACTION_SUMMARY: TransactionSummary[] = [
  { categoryId: 'food',          categoryName: 'Food',          color: '#C99240', emoji: '🍔', totalCents: -1400000, count: 3 },
  { categoryId: 'income',        categoryName: 'Income',        color: '#00D68F', emoji: '💰', totalCents:  5800000, count: 2 },
  { categoryId: 'transport',     categoryName: 'Transport',     color: '#3A9E52', emoji: '🚖', totalCents:  -85000,  count: 1 },
  { categoryId: 'bills',         categoryName: 'Bills',         color: '#D08A45', emoji: '🔌', totalCents: -320000,  count: 1 },
  { categoryId: 'entertainment', categoryName: 'Entertainment', color: '#5B9E72', emoji: '🎬', totalCents: -200000,  count: 1 },
  { categoryId: 'airtime',       categoryName: 'Airtime',       color: '#9B4AB0', emoji: '📱', totalCents: -120000,  count: 1 },
  { categoryId: 'savings',       categoryName: 'Savings',       color: '#46C495', emoji: '💰', totalCents: -500000,  count: 1 },
];

// ── Budgets ───────────────────────────────────────────────────────────────────
const DEMO_BUDGETS: Budget[] = [
  { id: 'bud-001', userId: 'demo-user-001', categoryId: 'food',          category: { id: 'food',          name: 'Food',          icon: '🍔', color: '#C99240', isSystem: true }, limitCents: 5000000,  month: now.getMonth() + 1, year: now.getFullYear(), spentCents: 1400000 },
  { id: 'bud-002', userId: 'demo-user-001', categoryId: 'transport',     category: { id: 'transport',     name: 'Transport',     icon: '🚖', color: '#3A9E52', isSystem: true }, limitCents: 2000000,  month: now.getMonth() + 1, year: now.getFullYear(), spentCents: 850000  },
  { id: 'bud-003', userId: 'demo-user-001', categoryId: 'entertainment', category: { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#5B9E72', isSystem: true }, limitCents: 1000000,  month: now.getMonth() + 1, year: now.getFullYear(), spentCents: 200000  },
  { id: 'bud-004', userId: 'demo-user-001', categoryId: 'bills',         category: { id: 'bills',         name: 'Bills',         icon: '🔌', color: '#D08A45', isSystem: true }, limitCents: 3000000,  month: now.getMonth() + 1, year: now.getFullYear(), spentCents: 3200000 },
  { id: 'bud-005', userId: 'demo-user-001', categoryId: 'airtime',       category: { id: 'airtime',       name: 'Airtime',       icon: '📱', color: '#9B4AB0', isSystem: true }, limitCents: 500000,   month: now.getMonth() + 1, year: now.getFullYear(), spentCents: 120000  },
];

export const DEMO_BUDGET_OVERVIEW: BudgetOverview = {
  month: now.getMonth() + 1,
  year:  now.getFullYear(),
  overallLimitCents: DEMO_BUDGETS.reduce((s, b) => s + b.limitCents,  0),
  overallSpentCents: DEMO_BUDGETS.reduce((s, b) => s + b.spentCents, 0),
  budgets: DEMO_BUDGETS,
};

// ── Insights ──────────────────────────────────────────────────────────────────
export const DEMO_INSIGHTS: Insight[] = [
  { id: 'ins-001', title: 'Bills exceeded limit', body: 'Your EKEDC bill pushed your Bills category 7% over budget. Consider switching to a prepaid meter to control electricity costs.', category: 'bills', severity: 'warning', emoji: '⚡', generatedAt: d(1) },
  { id: 'ins-002', title: 'Food spending on track', body: 'You\'ve used only 28% of your food budget with 3 weeks left. Keep this pace to save ₦36,000 this month vs last month.', category: 'food', severity: 'success', emoji: '🎯', generatedAt: d(1) },
  { id: 'ins-003', title: 'Savings opportunity', body: 'Your income was ₦58,000 this month. Automating ₦10,000/week to PiggyVest could grow your emergency fund to ₦120,000 in 3 months.', category: 'savings', severity: 'info', emoji: '💡', generatedAt: d(1) },
  { id: 'ins-004', title: 'Transport costs rising', body: 'Uber spend is up 40% from last month. Combining rides or using public transit on 2 days a week could save ₦8,500/month.', category: 'transport', severity: 'warning', emoji: '🚖', generatedAt: d(2) },
];

// ── Alerts ────────────────────────────────────────────────────────────────────
export const DEMO_ALERT_SETTINGS: AlertSettings = {
  pushEnabled:  true,
  smsEnabled:   false,
  emailEnabled: true,
  language:     'ENGLISH',
};

export const DEMO_ALERTS: KlakAlert[] = [
  { id: 'alr-001', type: 'budget_100', message: 'Bills budget exceeded! You\'ve spent ₦32,000 of your ₦30,000 Bills limit.', createdAt: d(3), read: false },
  { id: 'alr-002', type: 'budget_80',  message: 'Heads up: Food budget is 28% used with 3 weeks remaining. You\'re on track!', createdAt: d(4), read: true  },
  { id: 'alr-003', type: 'insight',    message: 'New AI insight available: Savings opportunity detected in your spending patterns.', createdAt: d(5), read: true  },
];

// ── Subscriptions ─────────────────────────────────────────────────────────────
export const DEMO_PLANS: SubscriptionPlan[] = [
  { id: 'plan-free',    name: 'See Am',  slug: 'FREE',    monthlyPrice: 0,     annualPrice: 0,      features: ['1 bank account', 'Basic overview', '30 days history'] },
  { id: 'plan-pro',     name: 'Know Am', slug: 'PRO',     monthlyPrice: 200000, annualPrice: 1920000, features: ['4 bank accounts', 'Full breakdown', 'AI insights', 'Smart alerts'] },
  { id: 'plan-premium', name: 'Gbam',   slug: 'PREMIUM', monthlyPrice: 400000, annualPrice: 3840000, features: ['Unlimited accounts', 'Full history', 'PDF exports', 'Priority support'] },
];

export const DEMO_SUBSCRIPTION: Subscription = {
  id: 'sub-001', userId: 'demo-user-001',
  plan: 'PRO', interval: 'MONTHLY', status: 'ACTIVE',
  currentPeriodStart: d(15), currentPeriodEnd: d(-15), // 15 days ago → 15 days from now
};

// ── Exports ───────────────────────────────────────────────────────────────────
export const DEMO_EXPORTS: ExportRecord[] = [
  { id: 'exp-001', type: 'PDF',   url: 'https://example.com/demo-statement.pdf',  createdAt: d(5),  expiresAt: d(-25) },
  { id: 'exp-002', type: 'EXCEL', url: 'https://example.com/demo-statement.xlsx', createdAt: d(10), expiresAt: d(-20) },
];

// ── React Query mock helper ───────────────────────────────────────────────────
// Wraps demo data in the same shape the API returns so screens work unchanged.
export function mockResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function mockPaginated<T>(items: T[]): PaginatedResponse<T> {
  return { success: true, data: items, meta: { page: 1, limit: 25, total: items.length, totalPages: 1 } };
}

// Flag — set via useAuthStore to tell interceptors to use demo data
export const IS_DEMO_MODE = process.env.EXPO_PUBLIC_APP_ENV === 'demo';
