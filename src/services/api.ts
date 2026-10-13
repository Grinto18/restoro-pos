import {
  setCachedData,
  getCachedData,
  saveOfflineOrder,
  getOfflineOrders,
  deleteOfflineOrder,
  OfflineOrderPayload,
} from './offlineStorage.ts';

const TOKEN_KEY = 'golden_palace_auth_token';

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let isUnauthorized = false;
  try {
    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      if (res.status === 401) {
        isUnauthorized = true;
      }
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error || `Request failed with status ${res.status}`);
    }

    const data = await res.json();

    // Cache successful GET responses for offline resilience
    if (options.method === undefined || options.method === 'GET') {
      await setCachedData(endpoint, data);
    }

    return data;
  } catch (error: any) {
    // If network error / offline (and NOT 401 Unauthorized), fallback to cache for GET requests
    if (!isUnauthorized && (options.method === undefined || options.method === 'GET')) {
      const cached = await getCachedData<T>(endpoint);
      if (cached) {
        console.warn(`Serving offline cached data for /api${endpoint}`);
        return cached;
      }
    }
    throw error;
  }
}

export const api = {
  // Auth
  login: (identifier: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),
  pinLogin: (pin: string) =>
    request<{ token: string; user: any }>('/auth/pin-login', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),
  getMe: () => request<{ user: any }>('/auth/me'),

  // Users
  getUsers: () => request<any[]>('/users'),
  createUser: (data: any) =>
    request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (id: number, data: any) =>
    request<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Categories & Products
  getCategories: () => request<any[]>('/categories'),
  createCategory: (data: any) =>
    request<any>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id: number, data: any) =>
    request<any>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: number) =>
    request<any>(`/categories/${id}`, { method: 'DELETE' }),

  getProducts: () => request<any[]>('/products'),
  createProduct: (data: any) =>
    request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProduct: (id: number, data: any) =>
    request<any>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  toggleProductAvailability: (id: number) =>
    request<any>(`/products/${id}/toggle-available`, { method: 'PATCH' }),
  deleteProduct: (id: number) =>
    request<any>(`/products/${id}`, { method: 'DELETE' }),
  getProductPriceHistory: (id: number) =>
    request<any[]>(`/products/${id}/price-history`),

  // Tables
  getTables: () => request<any[]>('/tables'),
  createTable: (data: any) =>
    request<any>('/tables', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTableStatus: (id: number, status: string, currentOrderId?: number | null) =>
    request<any>(`/tables/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, currentOrderId }),
    }),
  transferTable: (fromTableId: number, toTableId: number) =>
    request<any>('/tables/transfer', {
      method: 'POST',
      body: JSON.stringify({ fromTableId, toTableId }),
    }),

  // Orders
  getOrders: (params?: { heldOnly?: boolean; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.heldOnly) q.set('heldOnly', 'true');
    if (params?.limit) q.set('limit', String(params.limit));
    return request<any[]>(`/orders?${q.toString()}`);
  },
  getOrder: (id: number) => request<any>(`/orders/${id}`),
  createOrder: async (data: any) => {
    // If offline, queue locally
    if (!navigator.onLine) {
      const offlineId = `off-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const payload: OfflineOrderPayload = {
        offlineId,
        type: data.type || 'DINE_IN',
        tableId: data.tableId,
        items: data.items,
        subtotal: data.subtotal,
        discount: data.discount || 0,
        deliveryFee: data.deliveryFee || 0,
        total: data.total,
        paidAmount: data.paidAmount || 0,
        paymentStatus: data.paymentStatus || 'UNPAID',
        paymentMethod: data.paymentMethod,
        idempotencyKey: data.idempotencyKey || offlineId,
        createdAt: new Date().toISOString(),
      };
      await saveOfflineOrder(payload);
      return {
        id: -Date.now(),
        orderNumber: `BON-OFF-${offlineId.slice(-4)}`,
        ...payload,
        offline: true,
      };
    }

    return request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  resumeHeldOrder: (id: number) =>
    request<any>(`/orders/${id}/resume`, { method: 'POST' }),
  cancelOrder: (id: number, reason?: string) =>
    request<any>(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Payments
  processPayment: (data: { orderId: number; payments: any[]; idempotencyKey?: string }) =>
    request<any>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Cash Register
  getCurrentShift: () => request<any>('/cash-register/current'),
  openShift: (openingCash: number, notes?: string) =>
    request<any>('/cash-register/open', {
      method: 'POST',
      body: JSON.stringify({ openingCash, notes }),
    }),
  closeShift: (shiftId: number, closingCash: number, notes?: string) =>
    request<any>('/cash-register/close', {
      method: 'POST',
      body: JSON.stringify({ shiftId, closingCash, notes }),
    }),
  recordCashMovement: (data: { shiftId: number; type: string; amount: number; reason: string }) =>
    request<any>('/cash-register/movement', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getShiftHistory: () => request<any[]>('/cash-register/history'),

  // Kitchen (KDS)
  getKitchenTickets: (station?: string) => {
    const q = station ? `?station=${station}` : '';
    return request<any[]>(`/kitchen/tickets${q}`);
  },
  updateKitchenItemStatus: (id: number, status: string) =>
    request<any>(`/kitchen/items/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Inventory
  getInventory: () => request<any[]>('/inventory'),
  createIngredient: (data: any) =>
    request<any>('/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateIngredient: (id: number, data: any) =>
    request<any>(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  adjustStock: (data: { ingredientId: number; actualQuantity: number; reason?: string; notes?: string }) =>
    request<any>('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Waste (Pertes)
  getWasteRecords: () => request<any[]>('/waste'),
  recordWaste: (data: any) =>
    request<any>('/waste', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Purchases & Suppliers
  getSuppliers: () => request<any[]>('/suppliers'),
  createSupplier: (data: any) =>
    request<any>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getPurchases: () => request<any[]>('/purchases'),
  createPurchase: (data: any) =>
    request<any>('/purchases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Customers & Delivery
  getCustomers: () => request<any[]>('/customers'),
  createCustomer: (data: any) =>
    request<any>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getDeliveries: () => request<any[]>('/deliveries'),
  updateDeliveryStatus: (id: number, data: any) =>
    request<any>(`/deliveries/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Expenses
  getExpenses: () => request<any[]>('/expenses'),
  createExpense: (data: any) =>
    request<any>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Reports
  getDashboardReport: () => request<any>('/reports/dashboard'),
  getSalesReport: (startDate?: string, endDate?: string) => {
    const q = new URLSearchParams();
    if (startDate) q.set('startDate', startDate);
    if (endDate) q.set('endDate', endDate);
    return request<any[]>(`/reports/sales?${q.toString()}`);
  },

  // Settings & Audit
  getSettings: () => request<Record<string, string>>('/settings'),
  updateSettings: (data: Record<string, string>) =>
    request<any>('/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAuditLogs: () => request<any[]>('/audit-logs'),

  // Windows Thermal Printer Spooler
  getPrinterStatus: () => request<any>('/printer/status'),
  spoolPrintJob: (data: { printerName?: string; rawBase64?: string; textContent?: string; orderNumber?: string; copies?: number }) =>
    request<any>('/printer/spool', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Menu Reset
  resetGrineMenu: () =>
    request<{ success: boolean; message: string }>('/menu/reset-grine', {
      method: 'POST',
    }),

  // Backup & Export
  exportBackup: async () => {
    const [settings, categories, products, inventory] = await Promise.all([
      request<Record<string, string>>('/settings').catch(() => ({})),
      request<any[]>('/categories').catch(() => []),
      request<any[]>('/products').catch(() => []),
      request<any[]>('/inventory').catch(() => []),
    ]);
    return {
      appName: 'Golden Palace POS',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      settings,
      categories,
      products,
      inventory,
    };
  },

  // Offline Sync
  syncOfflineQueue: async () => {
    const offlineOrders = await getOfflineOrders();
    if (offlineOrders.length === 0) return { count: 0 };

    const res = await request<any>('/sync/batch', {
      method: 'POST',
      body: JSON.stringify({ offlineOrders }),
    });

    if (res.syncedIds && Array.isArray(res.syncedIds)) {
      for (const id of res.syncedIds) {
        await deleteOfflineOrder(id);
      }
    }

    return { count: res.syncedIds?.length || 0 };
  },
};
