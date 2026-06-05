export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export function discountPercent(original: number, discounted: number): number {
  return Math.round(((original - discounted) / original) * 100);
}

export function formatCountdown(endTime: string | undefined | null): string {
  if (!endTime) return '--:--:--';
  const ts = new Date(endTime).getTime();
  if (isNaN(ts)) return '--:--:--';
  const diff = Math.max(0, ts - Date.now());
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
