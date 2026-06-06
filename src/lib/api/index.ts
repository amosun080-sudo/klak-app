import api from '../api';
import type {
  AuthTokens, User, Account, BalanceResponse,
  Transaction, TransactionListParams, TransactionSummary,
  Budget, BudgetOverview, CreateBudgetDto,
  Category,
  Insight, AlertSettings, Alert,
  SubscriptionPlan, Subscription, ExportRecord,
  ApiResponse, PaginatedResponse,
} from '../../types/models';

// Re-export error helper so screens import from one place
export { getApiError } from '../api';

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (body: { phone: string; fullName: string; password: string }) =>
    api.post<ApiResponse<{ userId: string }>>('/auth/register', body),

  login: (body: { phone: string; password: string }) =>
    api.post<ApiResponse<{ tokens: AuthTokens; user: User }>>('/auth/login', body),

  sendOTP: (phone: string) =>
    api.post<ApiResponse<void>>('/auth/otp/send', { phone }),

  verifyOTP: (body: { phone: string; code: string }) =>
    api.post<ApiResponse<{ tokens: AuthTokens; user: User }>>('/auth/otp/verify', body),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken }),

  logout: () => api.post<ApiResponse<void>>('/auth/logout'),
};

// ── USERS ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  me: () =>
    api.get<ApiResponse<User>>('/users/me'),

  updateMe: (body: Partial<Pick<User, 'fullName' | 'language'>>) =>
    api.patch<ApiResponse<User>>('/users/me', body),

  updateFcmToken: (fcmToken: string) =>
    api.patch<ApiResponse<void>>('/users/me/fcm-token', { fcmToken }),

  deleteMe: () =>
    api.delete<ApiResponse<void>>('/users/me'),
};

// ── ACCOUNTS ─────────────────────────────────────────────────────────────────
export const accountsApi = {
  list: () =>
    api.get<ApiResponse<Account[]>>('/accounts'),

  link: (code: string) =>
    api.post<ApiResponse<Account>>('/accounts/link', { code }),

  balance: () =>
    api.get<ApiResponse<BalanceResponse>>('/accounts/balance'),

  unlink: (id: string) =>
    api.delete<ApiResponse<void>>(`/accounts/${id}`),

  sync: (id: string) =>
    api.post<ApiResponse<void>>(`/accounts/${id}/sync`),
};

// ── TRANSACTIONS ──────────────────────────────────────────────────────────────
export const transactionsApi = {
  list: (params?: TransactionListParams) =>
    api.get<PaginatedResponse<Transaction>>('/transactions', { params }),

  get: (id: string) =>
    api.get<ApiResponse<Transaction>>(`/transactions/${id}`),

  recategorise: (id: string, categoryId: string) =>
    api.patch<ApiResponse<Transaction>>(`/transactions/${id}/category`, { categoryId }),

  summary: (params?: { startDate?: string; endDate?: string; accountId?: string }) =>
    api.get<ApiResponse<TransactionSummary[]>>('/transactions/summary', { params }),
};

// ── BUDGETS ───────────────────────────────────────────────────────────────────
export const budgetsApi = {
  list: () =>
    api.get<ApiResponse<Budget[]>>('/budgets'),

  overview: () =>
    api.get<ApiResponse<BudgetOverview>>('/budgets/overview'),

  create: (dto: CreateBudgetDto) =>
    api.post<ApiResponse<Budget>>('/budgets', dto),

  update: (id: string, dto: Partial<CreateBudgetDto>) =>
    api.patch<ApiResponse<Budget>>(`/budgets/${id}`, dto),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/budgets/${id}`),
};

// ── INSIGHTS ─────────────────────────────────────────────────────────────────
export const insightsApi = {
  list: () =>
    api.get<ApiResponse<Insight[]>>('/insights'),

  generate: () =>
    api.post<ApiResponse<Insight[]>>('/insights/generate'),

  markAsRead: (id: string) =>
    api.patch<ApiResponse<void>>(`/insights/${id}/read`),
};

// ── CATEGORIES ────────────────────────────────────────────────────────────────
export const categoriesApi = {
  list: () =>
    api.get<ApiResponse<Category[]>>('/categories'),

  create: (dto: Pick<Category, 'name' | 'icon' | 'color'>) =>
    api.post<ApiResponse<Category>>('/categories', dto),

  update: (id: string, dto: Partial<Pick<Category, 'name' | 'icon' | 'color'>>) =>
    api.patch<ApiResponse<Category>>(`/categories/${id}`, dto),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/categories/${id}`),
};

// ── ALERTS ───────────────────────────────────────────────────────────────────
export const alertsApi = {
  settings: () =>
    api.get<ApiResponse<AlertSettings>>('/alerts/settings'),

  updateSettings: (dto: Partial<AlertSettings>) =>
    api.patch<ApiResponse<AlertSettings>>('/alerts/settings', dto),

  history: () =>
    api.get<ApiResponse<Alert[]>>('/alerts/history'),
};

// ── SUBSCRIPTIONS ─────────────────────────────────────────────────────────────
export const subscriptionsApi = {
  plans: () =>
    api.get<ApiResponse<SubscriptionPlan[]>>('/subscriptions/plans'),

  initiate: (planId: string) =>
    api.post<ApiResponse<{ authorizationUrl: string }>>('/subscriptions/initiate', { planId }),

  me: () =>
    api.get<ApiResponse<Subscription | null>>('/subscriptions/me'),

  cancel: () =>
    api.post<ApiResponse<void>>('/subscriptions/cancel'),
};

// ── EXPORTS ───────────────────────────────────────────────────────────────────
export const exportsApi = {
  request: (params: { format: 'PDF' | 'EXCEL'; dateFrom: string; dateTo: string }) =>
    api.post<ApiResponse<{ exportId: string }>>('/exports', params),

  history: () =>
    api.get<ApiResponse<ExportRecord[]>>('/exports/history'),
};
