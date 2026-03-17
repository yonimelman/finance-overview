import type { DisplayCurrency } from '../types';

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const nisFormatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const usdFormatterDetailed = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const nisFormatterDetailed = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(
  amount: number | null,
  currency: DisplayCurrency,
  detailed = false
): string {
  if (amount === null) return '—';
  if (currency === 'USD') {
    return detailed ? usdFormatterDetailed.format(amount) : usdFormatter.format(amount);
  }
  return detailed ? nisFormatterDetailed.format(amount) : nisFormatter.format(amount);
}

export function formatNumber(n: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(n);
}
