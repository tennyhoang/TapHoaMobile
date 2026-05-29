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
