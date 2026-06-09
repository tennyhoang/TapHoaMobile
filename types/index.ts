export type Category = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  children: Category[];
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  thumbnailUrl?: string;
  categoryId: string;
  categoryName: string;
  averageRating: number;
  reviewCount: number;
  images: string[];
  createdAt: string;
};

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CartItem = {
  productId: string;
  productName: string;
  thumbnailUrl?: string;
  price: number;
  discountPrice?: number;
  quantity: number;
  stock: number;
  unitPrice: number;
  subtotal: number;
};

export type Cart = {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
};

export type FlashSaleProduct = {
  id: string;
  name: string;
  thumbnailUrl?: string;
  categoryName: string;
  originalPrice: number;
  flashSalePrice: number;
  flashSaleStock: number;
  soldCount: number;
  stockRemaining: number;
};

export type FlashSaleSession = {
  sessionId: string;
  name: string;
  startTime: string;
  endTime: string;
  products: FlashSaleProduct[];
};

export type Hub = {
  id: string;
  name: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  latitude: number;
  longitude: number;
};

export type OrderStatus =
  | 'PendingPayment'
  | 'Paid_WaitingForBatch'
  | 'PackedAtWarehouse'
  | 'ShippingToHub'
  | 'InHub_ReadyForPickup'
  | 'Completed'
  | 'Cancelled'
  | 'Refunded';

export type OrderItem = {
  productId: string;
  productName: string;
  thumbnailUrl?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type Order = {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  walletAmountUsed: number;
  paymentMethod?: 'COD' | 'BankTransfer' | 'Wallet';
  note?: string;
  hub: Hub;
  items: OrderItem[];
  createdAt: string;
  cancelReason?: string;
  paymentRef?: string;
  paidAt?: string;
  shippingToHubAt?: string;
  inHubAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
  deliveryPhotoUrl?: string;
};

export type Address = {
  id: string;
  receiverName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  isDefault: boolean;
};

export type WalletTransactionType = 'Credit' | 'Debit';

export type WalletTransaction = {
  id: string;
  type: WalletTransactionType;
  amount: number;
  description: string;
  createdAt: string;
};

export type WalletBalance = {
  balance: number;
  recentTransactions: WalletTransaction[];
};

export type Review = {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: string;
};

export type DriverHubBatch = {
  hubId: string;
  hubName: string;
  hubFullAddress: string;
  orderCount: number;
  totalAmount: number;
  orders: Order[];
};

export type RouteStop = {
  stopNumber: number;
  originalIndex: number;
  address: string;
  lng: number | null;
  lat: number | null;
};

export type OptimizeRouteResponse = {
  stops: RouteStop[];
  isOptimized: boolean;
  hubLng: number | null;
  hubLat: number | null;
};

export type AssignedWarehouseDto = {
  id: string;
  name: string;
  fullAddress: string;
  phoneNumber: string | null;
};

export type NotificationType = 'OrderStatus' | 'FlashSale' | 'Promotion' | 'System';

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, string>;
};

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  agentHubId?: string;
  createdAt: string;
  warehouseId?: string;
  warehouseName?: string;
  managedWarehouseId?: string;
  managedWarehouseName?: string;
};

export type AdminFlashSaleSession = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  itemCount: number;
};

export type AdminFlashSaleItem = {
  id: string;
  productId: string;
  productName: string;
  thumbnailUrl?: string;
  originalPrice: number;
  flashSalePrice: number;
  flashSaleStock: number;
  soldCount: number;
};

export type WithdrawRequest = {
  id: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  holderName: string;
  status: 'Pending' | 'Completed' | 'Rejected';
  createdAt: string;
  processedAt?: string;
  adminNote?: string;
  userName: string;
  userEmail: string;
};

export type Warehouse = {
  id: string;
  name: string;
  address: string;
  ward: string;
  district: string;
  province: string;
  phoneNumber?: string;
  isActive?: boolean;
};

export type WarehouseOrderStatus = 'Paid_WaitingForBatch' | 'PackedAtWarehouse' | 'ShippingToHub';

export type WarehouseOrder = {
  id: string;
  status: WarehouseOrderStatus;
  totalAmount: number;
  createdAt: string;
  paidAt?: string;
  packedAtWarehouseAt?: string;
  note?: string;
  hub: { id: string; name: string; address: string };
  customer: { fullName: string; phoneNumber?: string };
  items: {
    productId: string;
    name: string;
    thumbnailUrl?: string;
    quantity: number;
    unitPrice: number;
  }[];
};

export type WarehouseInventoryItem = {
  id: string;
  name: string;
  thumbnailUrl?: string;
  stock: number;
  price: number;
  categoryName: string;
  isLowStock: boolean;
  isOutOfStock: boolean;
};

export type WarehouseDriver = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  isActive: boolean;
  activeOrders: number;
};

export type WarehouseDashboard = {
  warehouse: {
    id: string;
    name: string;
    address: string;
    district: string;
    province: string;
    isActive: boolean;
  } | null;
  pendingOrders: number;
  packedOrders: number;
  shippingOrders: number;
  packedToday: number;
  activeDrivers: number;
  lowStockProducts: number;
};

export type ClaimType =
  | 'DamagedProduct'
  | 'WrongProduct'
  | 'MissingProduct'
  | 'LateDelivery'
  | 'Other';

export type ClaimStatus = 'Pending' | 'UnderReview' | 'Resolved' | 'Rejected';

export type Claim = {
  id: string;
  orderId: string;
  type: ClaimType;
  description: string;
  status: ClaimStatus;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
};
