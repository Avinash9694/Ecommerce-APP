import { describe, expect, it } from 'vitest';
import { formatMoney, majorUnits, parseMoneyInput } from '../money';

describe('formatMoney', () => {
  it('formats INR in Indian digit grouping without paise for whole rupees', () => {
    expect(formatMoney(1299900)).toBe('₹12,999');
  });

  it('keeps paise when the amount is not a whole rupee', () => {
    expect(formatMoney(129950)).toBe('₹1,299.50');
  });

  it('formats other currencies with their own symbol', () => {
    expect(formatMoney(199900, 'USD')).toBe('$1,999');
  });
});

describe('parseMoneyInput', () => {
  it('parses a typed rupee amount into paise', () => {
    expect(parseMoneyInput('1,299.50')).toBe(129950);
    expect(parseMoneyInput('₹ 499')).toBe(49900);
  });

  it('rejects invalid input', () => {
    expect(parseMoneyInput('')).toBeNull();
    expect(parseMoneyInput('abc')).toBeNull();
    expect(parseMoneyInput('1.2.3')).toBeNull();
  });

  it('round-trips through majorUnits', () => {
    expect(parseMoneyInput(majorUnits(799900))).toBe(799900);
  });
});
