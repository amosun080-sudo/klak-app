import api from '../api';
import type {
  AuthResponse, TokenPair, User,
  Account, BalanceResponse,
  Transaction, TransactionListParams, TransactionSummary,
  Budget, BudgetOverview, CreateBudgetDto,
  Category,
  Insight,
  AlertSettings, Alert,
  SubscriptionPlan, Subscription, InitiateSubscriptionDto,
  ExportRecord,
} from '../../types/models';

export { getApiError } from '../api';

// ── HELPERS ───────────────────────────────────────────────────────────────────
/** Convert Naira to kobo (cents) */
const toCents = (naira: number) => Math.round(naira * 100);

/** Normalise a Budget from the backend (adds *Cents fields) */
function normaliseBudget(b: any): Budget {
  return {
    ...b,
    limitCents: toCents(b.limitNaira ?? 0),
    spentCents: toCents(b.spentNaira ?? 0),
    categoryId: b.categoryId ?? b.category?.id ?? '',
  };
}

/** Normalise an Insight (adds legacy fields) */
function normaliseInsight(i: any): Insight {
  const priorityMap: Record<string, 'warning' | 'info' | 'success'> = {
    HIGH:   'warning',
    MEDIUM: 'info',
    LOW:    'success',
  };
  return {
    ...i,
    body:         i.message,
    severity:     priorityMap[i.priority] ?? 'info',
    generatedAt:  i.createdAt,
    emoji:        i.type === 'BUDGET_ALERT' ? '⚠️' : i.type === 'SPENDING_PATTERN' ? '📊' : i.type === 'SAVINGS_TIP' ? '💡' : '✨',
  };
}

/** Normalise a Transaction (adds legacy fields) */
function normaliseTransaction(t: any): Transaction {
  return {
    ...t,
    narration:   t.description ?? t.narration ?? '',
    amount:      t.type === 'DEBIT' ? -(t.amountCents ?? toCents(t.amountNaira ?? 0)) : (t.amountCents ?? toCents(t.amountNaira ?? 0)),
    amountCents: t.amountCents ?? toCents(t.amountNaira ?? 0),
    categoryId:  t.category?.id ?? t.categoryId,
  };
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
// NOTE: The real API returns { user, accessToken, refreshToken } DIRECTLY —
// not wrapped in a data envelope.
export const authApi = {
  register: (body: { phone: string; fullName: string; password: string; email?: string }) =>
    api.post<AuthResponse>('/auth/register', body),

  login: (body: { phone: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', body),

  sendOTP: (phone: string) =>
    api.post<{ message: string; expiresIn: string }>('/auth/otp/send', { phone }),

  verifyOTP: (body: { phone: string; code: string }) =>
    api.post<{ verified: boolean; message: string }>('/auth/otp/verify', body),

  refresh: (refreshToken: string) =>
    api.post<TokenPair>('/auth/refresh', { refreshToken }),

  logout: (refreshToken?: string) =>
    api.post<{ message: string }>('/auth/logout', { refreshToken }),
};

// ── USERS ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  me: () =>
    api.get<User>('/users/me'),

  updateMe: (body: Partial<Pick<User, 'fullName' | 'language'>>) =>
    api.patch<User>('/users/me', body),

  updateFcmToken: (fcmToken: string) =>
    api.patch<{ message: string }>('/users/me/fcm-token', { fcmToken }),

  deleteMe: () =>
    api.delete<{ message: string }>('/users/me'),
};

// ── ACCOUNTS ─────────────────────────────────────────────────────────────────
export const accountsApi = {
  list: () =>
    api.get<Account[]>('/accounts'),

  /** Generate a Plaid Link token to initialise the bank linking widget */
  createLinkToken: () =>
    api.post<{ linkToken: string }>('/accounts/plaid/link-token'),

  /** Exchange Plaid public token to link a bank account */
  link: (code: string) =>
    api.post<Account & { message: string }>('/accounts/link', { code }),

  balance: () =>
    api.get<BalanceResponse>('/accounts/balance'),

  unlink: (id: string) =>
    api.delete<{ message: string }>(`/accounts/${id}`),

  sync: (id: string) =>
    api.post<{ message: string; newTransactions: number }>(`/accounts/${id}/sync`),
};

// ── TRANSACTIONS ──────────────────────────────────────────────────────────────
export const transactionsApi = {
  list: async (params?: TransactionListParams) => {
    const res = await api.get<{
      data: any[];
      pagination: { page: number; limit: number; total: number };
    }>('/transactions', { params });
    return {
      ...res,
      data: {
        data: (res.data.data ?? []).map(normaliseTransaction),
        pagination: res.data.pagination,
        // legacy compat
        meta: res.data.pagination ? {
          page:       res.data.pagination.page,
          limit:      res.data.pagination.limit,
          total:      res.data.pagination.total,
          totalPages: Math.ceil(res.data.pagination.total / (res.data.pagination.limit || 25)),
        } : undefined,
      },
    };
  },

  get: async (id: string) => {
    const res = await api.get<any>(`/transactions/${id}`);
    return { ...res, data: { data: normaliseTransaction(res.data) } };
  },

  recategorise: (id: string, categoryId: string) =>
    api.patch<{ id: string; category: Category; message: string }>(
      `/transactions/${id}/category`,
      { categoryId },
    ),

  summary: (params?: { startDate?: string; endDate?: string; month?: number; year?: number }) =>
    api.get<TransactionSummary>('/transactions/summary', { params }),
};

// ── BUDGETS ───────────────────────────────────────────────────────────────────
export const budgetsApi = {
  list: async () => {
    const res = await api.get<any[]>('/budgets');
    return { ...res, data: { data: (res.data ?? []).map(normaliseBudget) } };
  },

  overview: async () => {
    const res = await api.get<any>('/budgets/overview');
    const d = res.data;
    // Attach normalised budget list for screens that expect overview.budgets
    const overview: BudgetOverview = {
      ...d,
      overallLimitCents: toCents(d.totalBudget ?? 0),
      overallSpentCents: toCents(d.totalSpent  ?? 0),
      budgets: [],  // filled separately via budgetsApi.list()
    };
    return { ...res, data: { data: overview } };
  },

  create: (dto: CreateBudgetDto) =>
    api.post<any>('/budgets', {
      categoryId: dto.categoryId,
      limitNaira: dto.limitCents ? dto.limitCents / 100 : (dto as any).limitNaira,
      month:      dto.month,
      year:       dto.year,
    }),

  update: (id: string, dto: Partial<CreateBudgetDto>) =>
    api.patch<any>(`/budgets/${id}`, {
      limitNaira: dto.limitCents ? dto.limitCents / 100 : (dto as any).limitNaira,
    }),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/budgets/${id}`),
};

// ── INSIGHTS ─────────────────────────────────────────────────────────────────
export const insightsApi = {
  list: async () => {
    const res = await api.get<any[]>('/insights');
    return { ...res, data: { data: (res.data ?? []).map(normaliseInsight) } };
  },

  generate: async () => {
    const res = await api.post<{ message: string; insightsCount: number; insights: any[] }>('/insights/generate');
    return { ...res, data: { data: (res.data.insights ?? []).map(normaliseInsight) } };
  },

  markAsRead: (id: string) =>
    api.patch<{ id: string; isRead: boolean; message: string }>(`/insights/${id}/read`),
};

// ── CATEGORIES ────────────────────────────────────────────────────────────────
export const categoriesApi = {
  list: () =>
    api.get<Category[]>('/categories'),

  create: (dto: { name: string; icon?: string; color?: string }) =>
    api.post<Category & { message: string }>('/categories', dto),

  update: (id: string, dto: { name?: string; icon?: string; color?: string }) =>
    api.patch<Category>(`/categories/${id}`, dto),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/categories/${id}`),
};

// ── ALERTS ───────────────────────────────────────────────────────────────────
export const alertsApi = {
  settings: () =>
    api.get<AlertSettings>('/alerts/settings'),

  /** Backend takes { channels: ['PUSH','EMAIL','SMS'], language, enabled } */
  updateSettings: (dto: {
    channels?:  Array<'PUSH' | 'EMAIL' | 'SMS'>;
    language?:  'ENGLISH' | 'PIDGIN';
    enabled?:   boolean;
  }) => api.patch<AlertSettings & { message: string }>('/alerts/settings', dto),

  history: () =>
    api.get<Alert[]>('/alerts/history'),
};

// ── SUBSCRIPTIONS ─────────────────────────────────────────────────────────────
export const subscriptionsApi = {
  plans: () =>
    api.get<SubscriptionPlan[]>('/subscriptions/plans'),

  /** Backend takes { plan, interval } — not planId */
  initiate: (dto: InitiateSubscriptionDto) =>
    api.post<{ authorizationUrl: string; reference: string; plan: string; interval: string; amount: number }>(
      '/subscriptions/initiate',
      dto,
    ),

  me: () =>
    api.get<Subscription | null>('/subscriptions/me'),

  cancel: () =>
    api.post<{ message: string; accessUntil: string }>('/subscriptions/cancel'),
};

// ── EXPORTS ───────────────────────────────────────────────────────────────────
export const exportsApi = {
  request: (params: { format: 'PDF' | 'EXCEL'; dateFrom: string; dateTo: string }) =>
    api.post<{ exportId: string; status: string; message: string; format: string; dateFrom: string; dateTo: string }>(
      '/exports',
      params,
    ),

  history: async () => {
    const res = await api.get<any[]>('/exports/history');
    // Normalise to legacy ExportRecord shape
    const records: ExportRecord[] = (res.data ?? []).map((e: any) => ({
      ...e,
      type:      e.format,
      url:       e.downloadUrl ?? '',
      expiresAt: e.urlExpiresAt ?? '',
    }));
    return { ...res, data: { data: records } };
  },
};
