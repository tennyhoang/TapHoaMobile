import { useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import { API_BASE_URL } from '@/constants/api';

interface OrderStatusChangedPayload {
  orderId: string;
  status: string;
}

// Per-order SignalR listener used on the order detail screen.
// The global useOrderStatusSocket (wired at root) handles app-wide cache invalidation;
// this hook calls onUpdate() so the detail screen can re-fetch its own data immediately.
export function useOrderTracking(token: string | null, orderId: string, onUpdate: () => void) {
  useEffect(() => {
    if (!token || !orderId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/order-tracking`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on('OrderStatusChanged', (payload: OrderStatusChangedPayload) => {
      if (payload.orderId === orderId) {
        onUpdate();
      }
    });

    connection.start().catch(() => {});

    return () => {
      connection.stop();
    };
  }, [token, orderId]); // eslint-disable-line react-hooks/exhaustive-deps
}
