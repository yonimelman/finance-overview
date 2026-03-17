import type { RawCurrency } from '../types';

/** Convert a raw amount (in the API's native unit) to USD */
export function rawToUSD(amount: number, currency: RawCurrency, usdToNis: number): number {
  switch (currency) {
    case 'USD':
      return amount;
    case 'USX':
      return amount / 100; // cents to dollars
    case 'ILS':
      return amount / usdToNis;
    case 'ILA':
      return amount / 100 / usdToNis; // agorot to NIS to USD
  }
}

/** Convert a raw amount (in the API's native unit) to NIS */
export function rawToNIS(amount: number, currency: RawCurrency, usdToNis: number): number {
  switch (currency) {
    case 'ILS':
      return amount;
    case 'ILA':
      return amount / 100; // agorot to NIS
    case 'USD':
      return amount * usdToNis;
    case 'USX':
      return (amount / 100) * usdToNis; // cents to dollars to NIS
  }
}
