import vehicleGateChecklistService from './vehicleGateChecklistService';

export interface OfflineChecklistEntry {
  id: string;
  timestamp: number;
  data: Parameters<typeof vehicleGateChecklistService.create>[0];
  vehiclePlate?: string;
  driverName?: string;
}

const STORAGE_KEY = 'fluxbus_offline_driver_checklists';

export const offlineSyncService = {
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  getPendingChecklists(): OfflineChecklistEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveOfflineChecklist(
    data: Parameters<typeof vehicleGateChecklistService.create>[0],
    extra?: { vehiclePlate?: string; driverName?: string }
  ): OfflineChecklistEntry {
    const pending = this.getPendingChecklists();
    const entry: OfflineChecklistEntry = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      data,
      vehiclePlate: extra?.vehiclePlate,
      driverName: extra?.driverName,
    };
    pending.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
    window.dispatchEvent(new CustomEvent('fluxbus-offline-queue-changed', { detail: pending.length }));
    return entry;
  },

  removePendingChecklist(id: string): void {
    const pending = this.getPendingChecklists().filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
    window.dispatchEvent(new CustomEvent('fluxbus-offline-queue-changed', { detail: pending.length }));
  },

  async syncAllPending(onSuccessItem?: (entry: OfflineChecklistEntry) => void): Promise<{ synced: number; failed: number }> {
    if (!this.isOnline()) {
      return { synced: 0, failed: 0 };
    }

    const pending = this.getPendingChecklists();
    if (pending.length === 0) {
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;

    for (const item of pending) {
      try {
        await vehicleGateChecklistService.create(item.data);
        this.removePendingChecklist(item.id);
        synced++;
        if (onSuccessItem) {
          onSuccessItem(item);
        }
      } catch (err: any) {
        // Se for erro de validação do servidor (4xx), não adianta reenviar infinitamente se o dado for inválido
        if (err?.response?.status && err.response.status >= 400 && err.response.status < 500) {
          this.removePendingChecklist(item.id);
        }
        failed++;
      }
    }

    return { synced, failed };
  },

  initAutoSync(onAutoSyncComplete?: (count: number) => void): () => void {
    const handleOnline = async () => {
      const { synced } = await this.syncAllPending();
      if (synced > 0 && onAutoSyncComplete) {
        onAutoSyncComplete(synced);
      }
    };

    window.addEventListener('online', handleOnline);

    // Tenta sincronizar imediatamente se já estiver online
    if (this.isOnline()) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  },
};

export default offlineSyncService;
