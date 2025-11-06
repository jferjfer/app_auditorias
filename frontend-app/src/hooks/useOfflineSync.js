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
    if (!offlineDB.db) return;
    try {
      const pending = await offlineDB.getPendingChanges();
      const auditPending = auditId ? pending.filter(p => p.auditId === auditId) : [];
      setPendingCount(auditPending.length);
    } catch (err) {
      console.error('Error counting pending:', err);
    }
  };

  const syncPendingChanges = async () => {
    if (!isOnline || isSyncing || !auditId) return;

    setIsSyncing(true);
    let syncedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    try {
      const pending = await offlineDB.getPendingChanges();
      const auditPending = pending.filter(p => p.auditId === auditId);
      
      let hasAuthError = false;

      for (const change of auditPending) {
        // Validar cantidad antes de sincronizar
        if (change.changes.cantidad_fisica && change.changes.cantidad_fisica > 2147483647) {
          console.warn('Saltando cambio con cantidad inválida:', change);
          await offlineDB.deletePendingChange(change.id);
          skippedCount++;
          continue;
        }
        
        try {
          await updateProduct(change.auditId, change.productId, change.changes);
          await offlineDB.deletePendingChange(change.id);
          syncedCount++;
        } catch (err) {
          errorCount++;
          console.error('Error syncing change:', err, 'Data:', change);
          
          // Si es error 401, el token expiró
          if (err.message.includes('401') || err.message.includes('Unauthorized')) {
            hasAuthError = true;
            break;
          }
          
          // Si es error 500, puede ser problema en backend
          if (err.message.includes('500')) {
            console.error('Error 500 - Producto:', change.productId, 'Cambios:', change.changes);
            // Si es error de rango, eliminar el cambio inválido
            if (err.message.includes('out of range')) {
              await offlineDB.deletePendingChange(change.id);
              skippedCount++;
            }
          }
        }
      }
      
      if (hasAuthError) {
        alert('⚠️ Sesión expirada. Inicia sesión nuevamente para sincronizar.');
      } else if (skippedCount > 0) {
        alert(`✅ Sincronizados: ${syncedCount}. Saltados (inválidos): ${skippedCount}. Errores: ${errorCount}.`);
      } else if (errorCount > 0) {
        alert(`⚠️ Sincronizados: ${syncedCount}. Errores: ${errorCount}. Revisa la consola para detalles.`);
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
