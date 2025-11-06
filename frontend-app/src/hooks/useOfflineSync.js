import { useState, useEffect } from 'react';
import { offlineDB } from '../utils/offlineDB';
import { updateProduct } from '../services/api';

export function useOfflineSync(auditId) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Detectar cambios de conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingChanges();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [auditId]);

  // Inicializar DB y actualizar contador de pendientes
  useEffect(() => {
    const init = async () => {
      try {
        await offlineDB.init();
        await updatePendingCount();
      } catch (err) {
        console.error('Error initializing offline DB:', err);
      }
    };
    if (auditId) init();
  }, [auditId]);

  const updatePendingCount = async () => {
    if (!offlineDB.db) return; // DB no inicializada
    try {
      const pending = await offlineDB.getPendingChanges();
      const auditPending = auditId ? pending.filter(p => p.auditId === auditId) : [];
      setPendingCount(auditPending.length);
    } catch (err) {
      console.error('Error counting pending:', err);
    }
  };

  const syncPendingChanges = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      const pending = await offlineDB.getPendingChanges();
      const auditPending = pending.filter(p => p.auditId === auditId);

      for (const change of auditPending) {
        try {
          await updateProduct(change.auditId, change.productId, change.changes);
          await offlineDB.deletePendingChange(change.id);
        } catch (err) {
          console.error('Error syncing change:', err);
          // Si falla, lo dejamos para el próximo intento
        }
      }

      await updatePendingCount();
    } catch (err) {
      console.error('Error syncing:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isOnline,
    pendingCount,
    isSyncing,
    syncNow: syncPendingChanges
  };
}
