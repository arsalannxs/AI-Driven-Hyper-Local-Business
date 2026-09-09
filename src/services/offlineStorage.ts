import { Enterprise, LedgerEntry, LoanRecord, MarketRate, GovScheme, AdvisoryMessage, LoanDossier } from '../types';

const STORAGE_KEYS = {
  ENTERPRISES: 'gram_enterprises_v1',
  ACTIVE_ENT_ID: 'gram_active_enterprise_id',
  LEDGER: 'gram_ledger_v1',
  LOANS: 'gram_loans_v1',
  MARKET_RATES: 'gram_market_rates_v1',
  SCHEMES: 'gram_schemes_v1',
  ADVISORY_CHAT: 'gram_advisory_chat_v1',
  PENDING_SYNC_QUEUE: 'gram_pending_sync_queue_v1',
  OFFLINE_TOGGLE_OVERRIDE: 'gram_force_offline_override',
};

export interface SyncQueueItem {
  type: 'ledger_entry' | 'loan' | 'enterprise';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
}

export class OfflineStorageService {
  private listeners: Array<(isOnline: boolean, pendingCount: number) => void> = [];
  private isOnlineState: boolean = navigator.onLine;

  constructor() {
    this.initNetworkListeners();
  }

  private initNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnlineState = true;
      this.notifyListeners();
      // Auto-trigger sync on reconnect
      this.syncPendingItems();
    });

    window.addEventListener('offline', () => {
      this.isOnlineState = false;
      this.notifyListeners();
    });
  }

  isOnline(): boolean {
    // Check if user manually simulated offline mode
    const forced = localStorage.getItem(STORAGE_KEYS.OFFLINE_TOGGLE_OVERRIDE);
    if (forced === 'true') {
      return false;
    }
    return this.isOnlineState;
  }

  toggleSimulatedOffline(): boolean {
    const currentForced = localStorage.getItem(STORAGE_KEYS.OFFLINE_TOGGLE_OVERRIDE) === 'true';
    const nextVal = !currentForced;
    localStorage.setItem(STORAGE_KEYS.OFFLINE_TOGGLE_OVERRIDE, nextVal ? 'true' : 'false');
    this.notifyListeners();
    return !nextVal;
  }

  isForcedOffline(): boolean {
    return localStorage.getItem(STORAGE_KEYS.OFFLINE_TOGGLE_OVERRIDE) === 'true';
  }

  subscribe(callback: (isOnline: boolean, pendingCount: number) => void): () => void {
    this.listeners.push(callback);
    callback(this.isOnline(), this.getPendingSyncQueue().length);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners() {
    const online = this.isOnline();
    const count = this.getPendingSyncQueue().length;
    this.listeners.forEach(cb => cb(online, count));
  }

  // Pending Sync Queue
  getPendingSyncQueue(): SyncQueueItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC_QUEUE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private savePendingSyncQueue(queue: SyncQueueItem[]) {
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC_QUEUE, JSON.stringify(queue));
    this.notifyListeners();
  }

  private queueSyncItem(item: SyncQueueItem) {
    const queue = this.getPendingSyncQueue();
    queue.push(item);
    this.savePendingSyncQueue(queue);
  }

  // Enterprises
  getEnterprises(): Enterprise[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ENTERPRISES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveEnterprisesLocally(list: Enterprise[]) {
    localStorage.setItem(STORAGE_KEYS.ENTERPRISES, JSON.stringify(list));
  }

  getActiveEnterpriseId(): string {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ENT_ID) || 'ent_default_01';
  }

  setActiveEnterpriseId(id: string) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ENT_ID, id);
  }

  saveEnterprise(enterprise: Enterprise) {
    const list = this.getEnterprises();
    const idx = list.findIndex(e => e.id === enterprise.id);
    if (idx >= 0) {
      list[idx] = enterprise;
    } else {
      list.push(enterprise);
    }
    this.saveEnterprisesLocally(list);

    if (!this.isOnline()) {
      this.queueSyncItem({
        type: 'enterprise',
        action: 'create',
        data: enterprise,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Ledger Entries
  getLedger(enterpriseId: string): LedgerEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LEDGER);
      const all: LedgerEntry[] = raw ? JSON.parse(raw) : [];
      return all
        .filter(e => e.enterpriseId === enterpriseId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch {
      return [];
    }
  }

  saveLedgerLocally(entries: LedgerEntry[]) {
    localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(entries));
  }

  addLedgerEntry(entry: LedgerEntry): LedgerEntry {
    const raw = localStorage.getItem(STORAGE_KEYS.LEDGER);
    const all: LedgerEntry[] = raw ? JSON.parse(raw) : [];
    
    // Set local sync status if currently offline
    const finalEntry: LedgerEntry = {
      ...entry,
      syncStatus: this.isOnline() ? 'synced' : 'local',
    };

    all.unshift(finalEntry);
    this.saveLedgerLocally(all);

    if (!this.isOnline()) {
      this.queueSyncItem({
        type: 'ledger_entry',
        action: 'create',
        data: finalEntry,
        timestamp: new Date().toISOString(),
      });
    }

    return finalEntry;
  }

  deleteLedgerEntry(id: string) {
    const raw = localStorage.getItem(STORAGE_KEYS.LEDGER);
    const all: LedgerEntry[] = raw ? JSON.parse(raw) : [];
    const filtered = all.filter(l => l.id !== id);
    this.saveLedgerLocally(filtered);

    if (!this.isOnline()) {
      this.queueSyncItem({
        type: 'ledger_entry',
        action: 'delete',
        data: { id },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Loans
  getLoans(enterpriseId: string): LoanRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOANS);
      const all: LoanRecord[] = raw ? JSON.parse(raw) : [];
      return all.filter(l => l.enterpriseId === enterpriseId);
    } catch {
      return [];
    }
  }

  saveLoansLocally(loans: LoanRecord[]) {
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
  }

  addLoan(loan: LoanRecord): LoanRecord {
    const raw = localStorage.getItem(STORAGE_KEYS.LOANS);
    const all: LoanRecord[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex(l => l.id === loan.id);
    if (idx >= 0) {
      all[idx] = loan;
    } else {
      all.push(loan);
    }
    this.saveLoansLocally(all);

    if (!this.isOnline()) {
      this.queueSyncItem({
        type: 'loan',
        action: 'create',
        data: loan,
        timestamp: new Date().toISOString(),
      });
    }

    return loan;
  }

  deleteLoan(id: string) {
    const raw = localStorage.getItem(STORAGE_KEYS.LOANS);
    const all: LoanRecord[] = raw ? JSON.parse(raw) : [];
    const filtered = all.filter(l => l.id !== id);
    this.saveLoansLocally(filtered);

    if (!this.isOnline()) {
      this.queueSyncItem({
        type: 'loan',
        action: 'delete',
        data: { id },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Market Rates & Schemes Cache
  getCachedMarketRates(): MarketRate[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MARKET_RATES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  cacheMarketRates(rates: MarketRate[]) {
    localStorage.setItem(STORAGE_KEYS.MARKET_RATES, JSON.stringify(rates));
  }

  getCachedSchemes(): GovScheme[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SCHEMES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  cacheSchemes(schemes: GovScheme[]) {
    localStorage.setItem(STORAGE_KEYS.SCHEMES, JSON.stringify(schemes));
  }

  // Advisory Chat Cache
  getAdvisoryMessages(enterpriseId: string): AdvisoryMessage[] {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.ADVISORY_CHAT}_${enterpriseId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveAdvisoryMessages(enterpriseId: string, messages: AdvisoryMessage[]) {
    localStorage.setItem(`${STORAGE_KEYS.ADVISORY_CHAT}_${enterpriseId}`, JSON.stringify(messages));
  }

  // Synchronization with backend
  async syncPendingItems(): Promise<{ success: boolean; syncedCount: number }> {
    if (!this.isOnline()) {
      return { success: false, syncedCount: 0 };
    }

    const queue = this.getPendingSyncQueue();
    if (queue.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    const newLedgerEntries = queue
      .filter(q => q.type === 'ledger_entry' && q.action === 'create')
      .map(q => q.data);
    const newLoans = queue
      .filter(q => q.type === 'loan' && q.action === 'create')
      .map(q => q.data);
    const enterprise = queue.find(q => q.type === 'enterprise')?.data;

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enterprise,
          newLedgerEntries,
          newLoans,
        }),
      });

      if (response.ok) {
        // Clear queue
        this.savePendingSyncQueue([]);

        // Mark local ledger entries as synced
        const rawLedger = localStorage.getItem(STORAGE_KEYS.LEDGER);
        if (rawLedger) {
          const all: LedgerEntry[] = JSON.parse(rawLedger);
          const updated = all.map(entry => ({ ...entry, syncStatus: 'synced' as const }));
          this.saveLedgerLocally(updated);
        }

        return { success: true, syncedCount: queue.length };
      }
    } catch (e) {
      console.warn('Sync failed (server unreachable):', e);
    }

    return { success: false, syncedCount: 0 };
  }
}

export const offlineStorage = new OfflineStorageService();
