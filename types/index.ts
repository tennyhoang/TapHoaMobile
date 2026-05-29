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

export type WalletTransactionType = 'TopUp' | 'OrderPayment' | 'Refund' | 'Withdrawal';

export type WalletTransaction = {
  id: string;
  type: WalletTransactionType;
  amount: number;
  description: string;
  createdAt: string;
  balanceAfter: number;
};

export type WalletBalance = {
  balance: number;
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
