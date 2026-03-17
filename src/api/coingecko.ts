import type { PriceResult } from '../types';

export async function fetchCryptoPrices(
  coinIds: string[]
): Promise<Map<string, PriceResult>> {
  const results = new Map<string, PriceResult>();

  if (coinIds.length === 0) return results;

  try {
    const ids = coinIds.join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
    const response = await fetch(url); // CoinGecko supports CORS natively
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: Record<string, { usd: number }> = await response.json();

    for (const coinId of coinIds) {
      if (data[coinId]?.usd !== undefined) {
        results.set(coinId, { price: data[coinId].usd, rawCurrency: 'USD' });
      } else {
        results.set(coinId, {
          price: 0,
          rawCurrency: 'USD',
          error: `No price data for ${coinId}`,
        });
      }
    }
  } catch (err) {
    for (const coinId of coinIds) {
      if (!results.has(coinId)) {
        results.set(coinId, {
          price: 0,
          rawCurrency: 'USD',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }
  }

  return results;
}
