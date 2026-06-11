import { useOrderStatusSocket } from '@/lib/hooks/useOrderStatusSocket';
import { useToast } from '@/components/Toast';

export default function OrderSocketBridge() {
  const { show } = useToast();
  useOrderStatusSocket(msg => show(msg, 'info'));
  return null;
}
