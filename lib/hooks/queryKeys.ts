export const queryKeys = {
  products: {
    all: ['products'] as const,
    list: (params?: Record<string, unknown>) => ['products', 'list', params] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
  },
  orders: {
    all: ['orders'] as const,
    my: (params?: Record<string, unknown>) => ['orders', 'my', params] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },
  cart: {
    all: ['cart'] as const,
  },
  profile: {
    me: ['profile', 'me'] as const,
  },
  addresses: {
    all: ['addresses'] as const,
  },
  wallet: {
    balance: ['wallet', 'balance'] as const,
    transactions: (page?: number) => ['wallet', 'transactions', page] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    unread: ['notifications', 'unread'] as const,
  },
  flashSale: {
    current: ['flashSale', 'current'] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  articles: {
    all: ['articles'] as const,
  },
  admin: {
    stats: ['admin', 'stats'] as const,
    orders: (params?: Record<string, unknown>) => ['admin', 'orders', params] as const,
    products: (params?: Record<string, unknown>) => ['admin', 'products', params] as const,
    categories: ['admin', 'categories'] as const,
    flashSale: {
      sessions: ['admin', 'flashSale', 'sessions'] as const,
      items: (sessionId: string) => ['admin', 'flashSale', 'items', sessionId] as const,
    },
    users: (params?: Record<string, unknown>) => ['admin', 'users', params] as const,
    warehouses: ['admin', 'warehouses'] as const,
    wallet: (status: string) => ['admin', 'wallet', status] as const,
  },
  warehouse: {
    dashboard: ['warehouse', 'dashboard'] as const,
    orders: (params?: Record<string, unknown>) => ['warehouse', 'orders', params] as const,
    inventory: (params?: Record<string, unknown>) => ['warehouse', 'inventory', params] as const,
    drivers: ['warehouse', 'drivers'] as const,
  },
  driver: {
    warehouse: ['driver', 'warehouse'] as const,
    orders: ['driver', 'orders'] as const,
    shipping: ['driver', 'shipping'] as const,
    completed: ['driver', 'completed'] as const,
  },
  agent: {
    orders: (status: string) => ['agent', 'orders', status] as const,
  },
  reviews: {
    byProduct: (productId: string, page?: number) => ['reviews', productId, page] as const,
  },
  hubs: {
    active: (city?: string, district?: string) => ['hubs', 'active', city, district] as const,
  },
  vouchers: {
    validate: (code: string) => ['vouchers', 'validate', code] as const,
  },
  claims: {
    all: ['claims'] as const,
    my: (params?: Record<string, unknown>) => ['claims', 'my', params] as const,
  },
};
