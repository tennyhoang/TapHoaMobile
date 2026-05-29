import { formatCurrency, discountPercent, formatCountdown } from '../../lib/utils';

describe('formatCurrency', () => {
  it('formats positive amount as VND', () => {
    const result = formatCurrency(50000);
    expect(result).toContain('50');
    expect(result).toMatch(/[₫đ]|VND/);
  });

  it('formats zero', () => {
    const result = formatCurrency(0);
    expect(result).toMatch(/0/);
  });

  it('formats large amount with thousands separator', () => {
    const result = formatCurrency(1000000);
    // vi-VN uses dot as thousands separator: 1.000.000
    expect(result).toContain('1');
    expect(result).toContain('000');
  });
});

describe('discountPercent', () => {
  it('returns correct percent for 20% off', () => {
    expect(discountPercent(100, 80)).toBe(20);
  });

  it('returns 0 when no discount', () => {
    expect(discountPercent(100, 100)).toBe(0);
  });

  it('returns 100 when fully discounted', () => {
    expect(discountPercent(100, 0)).toBe(100);
  });

  it('rounds to nearest integer', () => {
    // (60000 - 45000) / 60000 = 25%
    expect(discountPercent(60000, 45000)).toBe(25);
  });

  it('rounds fractional percent', () => {
    // (3 - 2) / 3 = 33.33... -> 33
    expect(discountPercent(3, 2)).toBe(33);
  });

  it('handles real flash sale discount', () => {
    // originalPrice 85000, flashSalePrice 68000 -> 20%
    expect(discountPercent(85000, 68000)).toBe(20);
  });
});

describe('formatCountdown', () => {
  const FIXED_NOW = new Date('2025-05-01T08:00:00Z').getTime();

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('formats 1h 30m 45s countdown correctly', () => {
    const endTime = new Date(FIXED_NOW + 90 * 60_000 + 45_000).toISOString();
    expect(formatCountdown(endTime)).toBe('01:30:45');
  });

  it('formats exactly 2 hours remaining', () => {
    const endTime = new Date(FIXED_NOW + 2 * 3_600_000).toISOString();
    expect(formatCountdown(endTime)).toBe('02:00:00');
  });

  it('formats less than 1 minute remaining', () => {
    const endTime = new Date(FIXED_NOW + 30_000).toISOString();
    expect(formatCountdown(endTime)).toBe('00:00:30');
  });

  it('returns 00:00:00 when endTime is in the past', () => {
    const endTime = new Date(FIXED_NOW - 5000).toISOString();
    expect(formatCountdown(endTime)).toBe('00:00:00');
  });

  it('pads single-digit values with leading zero', () => {
    const endTime = new Date(FIXED_NOW + 3_661_000).toISOString(); // 1h 1m 1s
    expect(formatCountdown(endTime)).toBe('01:01:01');
  });
});
