// IndexedDB para almacenamiento offline
const DB_NAME = 'AuditoriasDB';
const DB_VERSION = 1;

class OfflineDB {
  constructor() {
    this.db = null;
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

  // Guardar productos de auditoría
  async saveProducts(auditId, products) {
    const tx = this.db.transaction(['products'], 'readwrite');
    const store = tx.objectStore('products');
    
    for (const product of products) {
      await store.put({ ...product, auditId });
    }
    
    return tx.complete;
  }

  // Obtener productos de auditoría
  async getProducts(auditId) {
    const tx = this.db.transaction(['products'], 'readonly');
    const store = tx.objectStore('products');
    const products = await store.getAll();
    
    return products.filter(p => p.auditId === auditId);
  }

  // Guardar cambio pendiente de sincronizar
  async savePendingChange(auditId, productId, changes) {
    const tx = this.db.transaction(['pendingChanges'], 'readwrite');
    const store = tx.objectStore('pendingChanges');
    
    await store.add({
      auditId,
      productId,
      changes,
      timestamp: Date.now()
    });
    
    return tx.complete;
  }

  // Obtener cambios pendientes
  async getPendingChanges() {
    const tx = this.db.transaction(['pendingChanges'], 'readonly');
    const store = tx.objectStore('pendingChanges');
    return store.getAll();
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
