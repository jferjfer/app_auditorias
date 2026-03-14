// IndexedDB para almacenamiento offline
const DB_NAME = 'AuditoriasDB';
const DB_VERSION = 1;

class OfflineDB {
  constructor() {
    this.db = null;
    this.writeQueue = [];
    this.isProcessing = false;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store para productos de auditoría
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }

        // Store para cambios pendientes de sincronizar
        if (!db.objectStoreNames.contains('pendingChanges')) {
          const store = db.createObjectStore('pendingChanges', { keyPath: 'id', autoIncrement: true });
          store.createIndex('auditId', 'auditId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Guardar productos de auditoría (batch optimizado)
  async saveProducts(auditId, products) {
    const tx = this.db.transaction(['products'], 'readwrite');
    const store = tx.objectStore('products');
    
    const promises = products.map(product => store.put({ ...product, auditId }));
    await Promise.all(promises);
    
    return tx.complete;
  }

  // Obtener productos de auditoría
  async getProducts(auditId) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['products'], 'readonly');
      const store = tx.objectStore('products');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const products = request.result || [];
        resolve(products.filter(p => p.auditId === auditId));
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Guardar cambio pendiente de sincronizar (con batch)
  async savePendingChange(auditId, productId, changes) {
    return new Promise((resolve) => {
      this.writeQueue.push({ auditId, productId, changes, timestamp: Date.now(), resolve });
      this.processBatch();
    });
  }

  processBatch() {
    if (this.isProcessing || this.writeQueue.length === 0) return;
    
    const scheduleWrite = window.requestIdleCallback || ((cb) => setTimeout(cb, 50));
    
    scheduleWrite(async () => {
      this.isProcessing = true;
      const batch = this.writeQueue.splice(0, 10);
      
      try {
        const tx = this.db.transaction(['pendingChanges'], 'readwrite');
        const store = tx.objectStore('pendingChanges');
        
        for (const item of batch) {
          await store.add({
            auditId: item.auditId,
            productId: item.productId,
            changes: item.changes,
            timestamp: item.timestamp
          });
          item.resolve();
        }
        
        await tx.complete;
      } catch (err) {
        console.error('Batch write error:', err);
      }
      
      this.isProcessing = false;
      if (this.writeQueue.length > 0) this.processBatch();
    });
  }

  // Obtener cambios pendientes
  async getPendingChanges() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['pendingChanges'], 'readonly');
      const store = tx.objectStore('pendingChanges');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Eliminar cambio sincronizado
  async deletePendingChange(id) {
    const tx = this.db.transaction(['pendingChanges'], 'readwrite');
    const store = tx.objectStore('pendingChanges');
    await store.delete(id);
    return tx.complete;
  }

  // Limpiar datos de auditoría finalizada
  async clearAudit(auditId) {
    const tx = this.db.transaction(['products', 'pendingChanges'], 'readwrite');
    
    // Eliminar productos
    const productsStore = tx.objectStore('products');
    const products = await productsStore.getAll();
    for (const product of products) {
      if (product.auditId === auditId) {
        await productsStore.delete(product.id);
      }
    }
    
    // Eliminar cambios pendientes
    const changesStore = tx.objectStore('pendingChanges');
    const index = changesStore.index('auditId');
    const changes = await index.getAll(auditId);
    for (const change of changes) {
      await changesStore.delete(change.id);
    }
    
    return tx.complete;
  }
}

export const offlineDB = new OfflineDB();
