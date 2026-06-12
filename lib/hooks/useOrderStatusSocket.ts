import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { API_BASE_URL } from '@/constants/api';
import { queryKeys } from './queryKeys';

const STATUS_LABELS: Record<string, string> = {
  AwaitingPayment: 'Đơn hàng đang chờ cổng thanh toán xác nhận.',
  ShippingToHub: 'Đơn hàng đang được vận chuyển đến Hub.',
  InHub_ReadyForPickup: 'Hàng đã đến Hub, bạn có thể đến lấy!',
  Completed: 'Đơn hàng hoàn thành. Cảm ơn bạn đã mua sắm!',
  Cancelled: 'Đơn hàng của bạn đã bị hủy.',
};

export function useOrderStatusSocket(onStatusChange?: (status: string) => void) {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/order-tracking`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on('OrderStatusChanged', (payload: { orderId: string; status: string }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(payload.orderId) });
      const label = STATUS_LABELS[payload.status];
      if (label) onStatusChange?.(label);
    });

    connectionRef.current = connection;
    connection.start().catch(() => {});

    return () => {
      connection.stop();
      connectionRef.current = null;
    };
    // token change triggers reconnect with new credentials
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps
}
