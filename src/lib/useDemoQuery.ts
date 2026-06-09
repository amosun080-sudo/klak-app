/**
 * Production API hooks — direct wrappers around React Query + real API.
 * All demo mode branching removed for production launch.
 */
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import {
  accountsApi, transactionsApi, budgetsApi, insightsApi,
  alertsApi, subscriptionsApi, exportsApi, usersApi,
} from './api/index';
import type {
  BalanceResponse, Transaction, TransactionSummary,
  BudgetOverview, Budget, Insight, AlertSettings, Alert as KlakAlert,
  SubscriptionPlan, Subscription, ExportRecord, User,
} from '../types/models';

export function useBalance() {
  return useQuery<BalanceResponse>({
    queryKey: ['balance'],
    queryFn: () => accountsApi.balance().then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecentTransactions(limit = 5) {
  return useQuery<Transaction[]>({
    queryKey: ['transactions', { limit }],
    queryFn: () => transactionsApi.list({ limit, page: 1 }).then(r => r.data.data),
    staleTime: 2 * 60 * 1000,
  });
}

export function useTransactionSummary(startDate: string, endDate: string) {
  return useQuery<TransactionSummary[]>({
    queryKey: ['transactions', 'summary', startDate, endDate],
    queryFn: () => transactionsApi.summary({ startDate, endDate }).then(r => r.data.data),
    staleTime: 2 * 60 * 1000,
  });
}

export function useBudgetOverview() {
  return useQuery<BudgetOverview>({
    queryKey: ['budgets', 'overview'],
    queryFn: () => budgetsApi.overview().then(r => r.data.data),
    staleTime: 60 * 1000,
  });
}

export function useBudgetList() {
  return useQuery<Budget[]>({
    queryKey: ['budgets', 'list'],
    queryFn: () => budgetsApi.list().then(r => r.data.data),
    staleTime: 60 * 1000,
  });
}

export function useInsights(enabled = true) {
  return useQuery<Insight[]>({
    queryKey: ['insights'],
    queryFn: () => insightsApi.list().then(r => r.data.data),
    staleTime: 60 * 60 * 1000,
    enabled,
  });
}

export function useAlertHistory() {
  return useQuery<KlakAlert[]>({
    queryKey: ['alerts', 'history'],
    queryFn: () => alertsApi.history().then(r => r.data.data),
    staleTime: 60 * 1000,
  });
}

export function useAlertSettings() {
  return useQuery<AlertSettings>({
    queryKey: ['alerts', 'settings'],
    queryFn: () => alertsApi.settings().then(r => r.data.data),
  });
}

export function usePlans() {
  return useQuery<SubscriptionPlan[]>({
    queryKey: ['plans'],
    queryFn: () => subscriptionsApi.plans().then(r => r.data.data),
    staleTime: 60 * 60 * 1000,
  });
}

export function useMySubscription() {
  return useQuery<Subscription | null>({
    queryKey: ['subscription'],
    queryFn: () => subscriptionsApi.me().then(r => r.data.data),
    staleTime: 10 * 60 * 1000,
  });
}

export function useExportHistory(enabled = true) {
  return useQuery<ExportRecord[]>({
    queryKey: ['exports', 'history'],
    queryFn: () => exportsApi.history().then(r => r.data.data),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCurrentUser() {
  const updateUser = useAuthStore(s => s.updateUser);
  return useQuery<User>({
    queryKey: ['user', 'me'],
    queryFn: () => usersApi.me().then(r => { updateUser(r.data.data); return r.data.data; }),
    staleTime: 5 * 60 * 1000,
  });
}
