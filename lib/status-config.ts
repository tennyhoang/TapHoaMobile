import { C } from '@/constants/Colors';
import type { OrderStatus } from '@/types';

export type StatusConfig = {
  label: string;
  color: string;
  bg: string;
  icon: string;
};

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  PendingPayment: {
    label: 'Chờ thanh toán',
    color: '#F59E0B',
    bg: '#FEF3C7',
    icon: 'time-outline',
  },
  Paid_WaitingForBatch: {
    label: 'Đã thanh toán',
    color: '#3B82F6',
    bg: '#EFF6FF',
    icon: 'checkmark-circle-outline',
  },
  PackedAtWarehouse: {
    label: 'Đã đóng gói',
    color: '#F97316',
    bg: '#FFF7ED',
    icon: 'cube-outline',
  },
  ShippingToHub: {
    label: 'Đang vận chuyển',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    icon: 'bicycle-outline',
  },
  InHub_ReadyForPickup: {
    label: 'Sẵn sàng lấy hàng',
    color: C.primary,
    bg: '#E5F9FA',
    icon: 'storefront-outline',
  },
  Completed: {
    label: 'Hoàn thành',
    color: '#22C55E',
    bg: '#F0FDF4',
    icon: 'checkmark-done-outline',
  },
  Cancelled: {
    label: 'Đã huỷ',
    color: C.error,
    bg: '#FEF2F2',
    icon: 'close-circle-outline',
  },
  Refunded: {
    label: 'Hoàn tiền',
    color: C.muted,
    bg: '#F8F9FA',
    icon: 'return-down-back-outline',
  },
};
