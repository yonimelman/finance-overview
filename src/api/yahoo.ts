import { proxiedFetch } from './proxy';
import type { PriceResult, RawCurrency } from '../types';

interface YahooChartResponse {
  chart: {
    result: Array<{
      meta: {
        currency: string;
        regularMarketPrice: number;
      };
    }> | null;
    error: { description: string } | null;
  };
}

export async function fetchYahooPrice(ticker: string, expectedCurrency: RawCurrency): Promise<PriceResult> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=1d`;
  const response = await proxiedFetch(url);
  const data: YahooChartResponse = await response.json();

  if (data.chart.error) {
    throw new Error(data.chart.error.description);
  }

  const result = data.chart.result?.[0];
  if (!result) {
    throw new Error(`No data for ticker ${ticker}`);
  }

  return {
    price: result.meta.regularMarketPrice,
    rawCurrency: expectedCurrency,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchYahooPrices(
  tickers: Array<{ ticker: string; currency: RawCurrency }>
): Promise<Map<string, PriceResult>> {
  const results = new Map<string, PriceResult>();

  // Stagger requests to avoid 429 rate limiting
  for (const { ticker, currency } of tickers) {
    try {
      const price = await fetchYahooPrice(ticker, currency);
      results.set(ticker, price);
    } catch (err) {
      results.set(ticker, {
        price: 0,
        rawCurrency: currency,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
    // Small delay between requests to avoid rate limiting
    if (tickers.length > 1) {
      await delay(300);
    }
  }

  return results;
}
