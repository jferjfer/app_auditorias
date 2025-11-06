import { useState, useEffect } from 'react';
import { offlineDB } from '../utils/offlineDB';
import { updateProduct } from '../services/api';

export function useOfflineSync(auditId) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Detectar cambios de conexión (siempre activo)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (auditId) syncPendingChanges();
    };
    
    const handleOffline = () => setIsOnline(false);
    
    const handlePendingUpdate = () => {
      if (auditId) updatePendingCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('pendingChangesUpdated', handlePendingUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pendingChangesUpdated', handlePendingUpdate);
    };
  }, [auditId]);

  // Inicializar DB y actualizar contador de pendientes
  useEffect(() => {
    const init = async () => {
      try {
        await offlineDB.init();
        if (auditId) await updatePendingCount();
      } catch (err) {
        console.error('Error initializing offline DB:', err);
      }
    };
    init();
  }, [auditId]);

  const updatePendingCount = async () => {
    if (!offlineDB.db) {
      console.log('DB no inicializada');
      return;
    }
    try {
      const pending = await offlineDB.getPendingChanges();
      console.log('Total pending changes:', pending.length);
      const auditPending = auditId ? pending.filter(p => p.auditId === auditId) : [];
      console.log('Pending for audit', auditId, ':', auditPending.length);
      setPendingCount(auditPending.length);
    } catch (err) {
      console.error('Error counting pending:', err);
    }
  };

  const syncPendingChanges = async () => {
    if (!isOnline || isSyncing || !auditId) return;

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
