import { useEffect } from 'react';
import * as signalR from '@microsoft/signalr';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

interface OrderStatusChangedPayload {
  orderId: string;
  status: string;
}

export function useOrderTracking(token: string | null, orderId: string, onUpdate: () => void) {
  useEffect(() => {
    if (!token || !orderId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/hubs/order-tracking?access_token=${encodeURIComponent(token)}`)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on('OrderStatusChanged', (payload: OrderStatusChangedPayload) => {
      if (payload.orderId === orderId) {
        onUpdate();
      }
    });

    connection.start().catch(err => console.warn('[SignalR] Connection failed:', err));

    return () => {
      connection.stop();
    };
  }, [token, orderId, onUpdate]);
}
