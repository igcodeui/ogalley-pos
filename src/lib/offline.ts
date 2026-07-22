const QUEUE_KEY = 'ogalley_offline_queue';
const PRODUCTS_KEY = 'ogalley_cached_products';

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function getQueue(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addToQueue(order: any): void {
  const queue = getQueue();
  queue.push({ ...order, _queuedAt: new Date().toISOString() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getQueueCount(): number {
  return getQueue().length;
}

export function cacheProducts(products: any[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function getCachedProducts(): any[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(PRODUCTS_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

export async function submitOrder(body: any): Promise<{ order: any; offline: boolean }> {
  if (isOnline()) {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const createdOrder = await res.json();
      return { order: createdOrder, offline: false };
    } catch {
      // Network dropped mid-request — save offline
      addToQueue(body);
      return { order: { ...body, id: 'offline-' + Date.now(), status: 'OFFLINE_PENDING' }, offline: true };
    }
  } else {
    addToQueue(body);
    return { order: { ...body, id: 'offline-' + Date.now(), status: 'OFFLINE_PENDING' }, offline: true };
  }
}

export async function syncPendingOrders(): Promise<{ synced: number; failed: number }> {
  if (!isOnline()) return { synced: 0, failed: 0 };

  const queue = getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const order of queue) {
    try {
      const { _queuedAt, ...orderData } = order;
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (res.ok) {
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  // Remove successfully synced orders from queue
  if (synced > 0) {
    const remaining = queue.slice(synced);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  }

  return { synced, failed };
}
