import { C } from '@/constants/Colors';
import type { OrderStatus } from '@/types';

export type StatusConfig = {
  labelKey: string;
  color: string;
  bg: string;
  icon: string;
};

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  PendingPayment: {
    labelKey: 'status.PendingPayment',
    color: '#F59E0B',
    bg: '#FEF3C7',
    icon: 'time-outline',
  },
  Paid_WaitingForBatch: {
    labelKey: 'status.Paid_WaitingForBatch',
    color: '#3B82F6',
    bg: '#EFF6FF',
    icon: 'checkmark-circle-outline',
  },
  PackedAtWarehouse: {
    labelKey: 'status.PackedAtWarehouse',
    color: '#0891B2',
    bg: '#E0F2FE',
    icon: 'cube-outline',
  },
  ShippingToHub: {
    labelKey: 'status.ShippingToHub',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    icon: 'bicycle-outline',
  },
  InHub_ReadyForPickup: {
    labelKey: 'status.InHub_ReadyForPickup',
    color: C.primary,
    bg: '#E5F9FA',
    icon: 'storefront-outline',
  },
  Completed: {
    labelKey: 'status.Completed',
    color: '#22C55E',
    bg: '#F0FDF4',
    icon: 'checkmark-done-outline',
  },
  Cancelled: {
    labelKey: 'status.Cancelled',
    color: C.error,
    bg: '#FEF2F2',
    icon: 'close-circle-outline',
  },
  Refunded: {
    labelKey: 'status.Refunded',
    color: C.muted,
    bg: '#F8F9FA',
    icon: 'return-down-back-outline',
  },
};
