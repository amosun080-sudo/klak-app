/**
 * Drop-in React Query hooks that return demo data when isDemoMode is true,
 * otherwise fall through to the real API. Every screen that calls useQuery
 * for live data can use these instead.
 */
import { useQuery, useMutation, UseQueryResult, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import {
  DEMO_BALANCE, DEMO_TRANSACTIONS, DEMO_TRANSACTION_SUMMARY,
  DEMO_BUDGET_OVERVIEW, DEMO_INSIGHTS, DEMO_ALERTS, DEMO_ALERT_SETTINGS,
  DEMO_PLANS, DEMO_SUBSCRIPTION, DEMO_EXPORTS, DEMO_USER,
  mockResponse, mockPaginated,
} from './demo';
import {
  accountsApi, transactionsApi, budgetsApi, insightsApi,
  alertsApi, subscriptionsApi, exportsApi, usersApi,
} from './api/index';
import type {
  BalanceResponse, Transaction, TransactionSummary,
  BudgetOverview, Budget, Insight, AlertSettings, Alert as KlakAlert,
  SubscriptionPlan, Subscription, ExportRecord, User,
} from '../types/models';

// ── Helper: 200ms fake latency for demo ───────────────────────────────────────
function fakeFetch<T>(data: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(data), 200));
}

// ── Balance ───────────────────────────────────────────────────────────────────
export function useBalance() {
  const demo = useAuthStore(s => s.isDemoMode);
  return useQuery<BalanceResponse>({
    queryKey: ['balance'],
    queryFn: demo
      ? () => fakeFetch(DEMO_BALANCE)
      : () => accountsApi.balance().then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

// ── Recent transactions (home screen) ────────────────────────────────────────
export function useRecentTransactions(limit = 5) {
  const demo = useAuthStore(s => s.isDemoMode);
  return useQuery<Transaction[]>({
    queryKey: ['transactions', { limit }],
    queryFn: demo
      ? () => fakeFetch(DEMO_TRANSACTIONS.slice(0, limit))
      : () => transactionsApi.list({ limit, page: 1 }).then(r => r.data.data),
    staleTime: 2 * 60 * 1000,
  });
}

// ── Transaction summary ───────────────────────────────────────────────────────
export function useTransactionSummary(startDate: string, endDate: string) {
  const demo = useAuthStore(s => s.isDemoMode);
  return useQuery<TransactionSummary[]>({
    queryKey: ['transactions', 'summary', startDate, endDate],
    queryFn: demo
      ? () => fakeFetch(DEMO_TRANSACTION_SUMMARY)
      : () => transactionsApi.summary({ startDate, endDate }).then(r => r.data.data),
    staleTime: 2 * 60 * 1000,
  });
}

// ── Budget overview ───────────────────────────────────────────────────────────
export function useBudgetOverview() {
  const demo = useAuthStore(s => s.isDemoMode);
  return useQuery<BudgetOverview>({
    queryKey: ['budgets', 'overview'],
    queryFn: demo
      ? () => fakeFetch(DEMO_BUDGET_OVERVIEW)
      : () => budgetsApi.overview().then(r => r.data.data),
    staleTime: 60 * 1000,
  });
}

// ── Budget list ───────────────────────────────────────────────────────────────
export function useBudgetList() {
  const demo = useAuthStore(s => s.isDemoMode);
  return useQuery<Budget[]>({
    queryKey: ['budgets', 'list'],
    queryFn: demo
      ? () => fakeFetch(DEMO_BUDGET_OVERVIEW.budgets)
      : () => budgetsApi.list().then(r => r.data.data),
    staleTime: 60 * 1000,
  });
}

// ── Insights ──────────────────────────────────────────────────────────────────
export function useInsights(enabled = true) {
  const demo = useAuthStore(s => s.isDemoMode);
  return useQuery<Insight[]>({
    queryKey: ['insights'],
    queryFn: demo
      ? () => fakeFetch(DEMO_INSIGHTS)
      : () => insightsApi.list().then(r => r.data.data),
    staleTime: 60 * 60 * 1000,
    enabled,
  });
}

// ── Alert history ─────────────────────────────────────────────────────────────
export function useAlertHistory() {
  const demo = useAuthStore(s => s.isDemoMode);
  return useQuery<KlakAlert[]>({
    queryKey: ['alerts', 'history'],
    queryFn: demo
      ? () => fakeFetch(DEMO_ALERTS)
      : () => alertsApi.history().then(r => r.data.data),
    staleTime: 60 * 1000,
  });
}

// ── Alert settings ────────────────────────────────────────────────────────────
export function useAlertSettings() {
  const demo = useAuthStore(s => s.isDemoMode);
  return useQuery<AlertSettings>({
    queryKey: ['alerts', 'settings'],
    queryFn: demo
      ? () => fakeFetch(DEMO_ALERT_SETTINGS)
      : () => alertsApi.settings().then(r => r.data.data),
  });
}

// ── Subscription plans ────────────────────────────────────────────────────────
export function usePlans() {
  const demo = useAuthStore(s => s.isDemoMode);
  return useQuery<SubscriptionPlan[]>({
    queryKey: ['plans'],
    queryFn: demo
      ? () => fakeFetch(DEMO_PLANS)
      : () => subscriptionsApi.plans().then(r => r.data.data),
    staleTime: 60 * 60 * 1000,
  });
}

// ── My subscription ───────────────────────────────────────────────────────────
export function useMySubscription() {
  const demo = useAuthStore(s => s.isDemoMode);
  return useQuery<Subscription | null>({
    queryKey: ['subscription'],
    queryFn: demo
      ? () => fakeFetch(DEMO_SUBSCRIPTION as Subscription)
      : () => subscriptionsApi.me().then(r => r.data.data),
    staleTime: 10 * 60 * 1000,
  });
}

// ── Export history ────────────────────────────────────────────────────────────
export function useExportHistory(enabled = true) {
  const demo = useAuthStore(s => s.isDemoMode);
  return useQuery<ExportRecord[]>({
    queryKey: ['exports', 'history'],
    queryFn: demo
      ? () => fakeFetch(DEMO_EXPORTS)
      : () => exportsApi.history().then(r => r.data.data),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// ── User profile ──────────────────────────────────────────────────────────────
export function useCurrentUser() {
  const demo = useAuthStore(s => s.isDemoMode);
  const updateUser = useAuthStore(s => s.updateUser);
  return useQuery<User>({
    queryKey: ['user', 'me'],
    queryFn: demo
      ? () => fakeFetch(DEMO_USER)
      : () => usersApi.me().then(r => { updateUser(r.data.data); return r.data.data; }),
    staleTime: 5 * 60 * 1000,
  });
}
