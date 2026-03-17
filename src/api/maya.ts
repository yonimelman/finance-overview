import { proxiedFetch } from './proxy';
import type { PriceResult } from '../types';

interface MayaFundResponse {
  FundNavPrice?: number;
  NavPrice?: number;
  Price?: number;
  CurrencyId?: number;
}

export async function fetchMayaFundPrice(fundId: string): Promise<PriceResult> {
  const url = `https://mayaapi.tase.co.il/api/fund/details?fundId=${fundId}`;
  const response = await proxiedFetch(url);
  const data: MayaFundResponse = await response.json();

  // The Maya API may return the NAV in different fields
  const price = data.FundNavPrice ?? data.NavPrice ?? data.Price;
  if (price === undefined || price === null) {
    throw new Error(`No NAV found for fund ${fundId}`);
  }

  // CurrencyId 1 = ILS, 2 = USD — default to ILS for Israeli money funds
  const isUSD = data.CurrencyId === 2;

  return {
    price,
    rawCurrency: isUSD ? 'USD' : 'ILS',
  };
}

export async function fetchMayaFundPrices(
  fundIds: string[]
): Promise<Map<string, PriceResult>> {
  const results = new Map<string, PriceResult>();

  const promises = fundIds.map(async (fundId) => {
    try {
      const price = await fetchMayaFundPrice(fundId);
      results.set(fundId, price);
    } catch (err) {
      results.set(fundId, {
        price: 0,
        rawCurrency: 'ILS',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });

  await Promise.allSettled(promises);
  return results;
}
