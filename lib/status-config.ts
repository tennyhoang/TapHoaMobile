import i18next from '@/lib/i18n';
import { C } from '@/constants/Colors';
import type { OrderStatus } from '@/types';

export type StatusConfig = {
  label: string;
  color: string;
  bg: string;
  icon: string;
};

function statusLabel(key: string): string {
  return i18next.t(`status.${key}`, key);
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  PendingPayment: {
    label: statusLabel('PendingPayment'),
    color: '#F59E0B',
    bg: '#FEF3C7',
    icon: 'time-outline',
  },
  Paid_WaitingForBatch: {
    label: statusLabel('Paid_WaitingForBatch'),
    color: '#3B82F6',
    bg: '#EFF6FF',
    icon: 'checkmark-circle-outline',
  },
  PackedAtWarehouse: {
    label: statusLabel('PackedAtWarehouse'),
    color: '#F97316',
    bg: '#FFF7ED',
    icon: 'cube-outline',
  },
  ShippingToHub: {
    label: statusLabel('ShippingToHub'),
    color: '#8B5CF6',
    bg: '#F5F3FF',
    icon: 'bicycle-outline',
  },
  InHub_ReadyForPickup: {
    label: statusLabel('InHub_ReadyForPickup'),
    color: C.primary,
    bg: '#E5F9FA',
    icon: 'storefront-outline',
  },
  Completed: {
    label: statusLabel('Completed'),
    color: '#22C55E',
    bg: '#F0FDF4',
    icon: 'checkmark-done-outline',
  },
  Cancelled: {
    label: statusLabel('Cancelled'),
    color: C.error,
    bg: '#FEF2F2',
    icon: 'close-circle-outline',
  },
  Refunded: {
    label: statusLabel('Refunded'),
    color: C.muted,
    bg: '#F8F9FA',
    icon: 'return-down-back-outline',
  },
};
