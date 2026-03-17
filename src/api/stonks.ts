import type { PriceResult, RawCurrency } from '../types';

const STONKS_BASE = 'https://raw.githubusercontent.com/yonimelman/stonks/gh-pages';

interface StonksInfo {
  id: string;
  type: string;
  source: string;
  symbol: string;
  currency: string;
  price: number;
  price_date: string;
}


export async function fetchStonksPrice(id: string, expectedCurrency: RawCurrency): Promise<PriceResult> {
  const url = `${STONKS_BASE}/${encodeURIComponent(id)}/info.json`;
  const response = await fetch(url); // raw.githubusercontent.com supports CORS natively
  if (!response.ok) {
    throw new Error(`Stonks: ${id} not found (${response.status})`);
  }

  const data: StonksInfo = await response.json();

  if (!data.price) {
    throw new Error(`Stonks: no price for ${id}`);
  }

  return {
    price: data.price,
    rawCurrency: expectedCurrency, // trust the sheet's currency since the user configured it
  };
}

export async function fetchStonksPrices(
  items: Array<{ id: string; currency: RawCurrency }>
): Promise<Map<string, PriceResult>> {
  const results = new Map<string, PriceResult>();

  const promises = items.map(async ({ id, currency }) => {
    try {
      const price = await fetchStonksPrice(id, currency);
      results.set(id, price);
    } catch (err) {
      results.set(id, {
        price: 0,
        rawCurrency: currency,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });

  await Promise.allSettled(promises);
  return results;
}
