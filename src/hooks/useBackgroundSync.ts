import { useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '../lib/api/index';
import { cacheManager } from '../lib/cache';
import type { Account } from '../types/models';

// Only re-sync an account if it hasn't been synced in the last 30 minutes
const STALE_THRESHOLD_MS = 30 * 60 * 1000;

export function useBackgroundSync() {
  const qc = useQueryClient();
  const isSyncingRef = useRef(false);

  const syncStaleAccounts = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      const res = await accountsApi.list();
      const accounts = res.data as Account[];
      if (!accounts?.length) return;

      const now = Date.now();
      let anysynced = false;

      for (const account of accounts) {
        const lastSyncStr = account.balanceUpdatedAt ?? account.lastSyncedAt;
        const lastSyncMs = lastSyncStr ? new Date(lastSyncStr).getTime() : 0;

        if (now - lastSyncMs > STALE_THRESHOLD_MS) {
          try {
            await accountsApi.sync(account.id);
            anysynced = true;
          } catch {
            // Skip failed accounts silently; don't abort the loop
          }
        }
      }

      if (anysynced) {
        // accountsApi.sync already clears caches, but also clear
        // here in case we synced multiple accounts
        await cacheManager.clear('accounts');
        await cacheManager.clear('balance');
        qc.invalidateQueries({ queryKey: ['accounts'] });
        qc.invalidateQueries({ queryKey: ['balance'] });
        qc.invalidateQueries({ queryKey: ['transactions'] });
      }
    } catch {
      // Network error or no accounts — fail silently
    } finally {
      isSyncingRef.current = false;
    }
  }, [qc]);

  // Sync on first mount (app cold start)
  useEffect(() => {
    syncStaleAccounts();
  }, []);

  // Sync when app comes back to foreground from background
  useEffect(() => {
    let lastState: AppStateStatus = AppState.currentState;

    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (lastState.match(/inactive|background/) && nextState === 'active') {
        syncStaleAccounts();
      }
      lastState = nextState;
    });

    return () => sub.remove();
  }, [syncStaleAccounts]);
}
