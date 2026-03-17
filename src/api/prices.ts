import type { Holding, PriceResult, ExchangeRate, PortfolioItem } from '../types';
import { fetchYahooPrices } from './yahoo';
import { fetchMayaFundPrices } from './maya';
import { fetchCryptoPrices } from './coingecko';
import { fetchStonksPrices } from './stonks';
import { fetchUsdNisRate } from './boi';
import { rawToUSD, rawToNIS } from '../utils/currency';

const CACHE_KEY = 'finance_price_cache';

interface PriceCache {
  prices: Record<string, PriceResult>;
  exchangeRate: ExchangeRate;
  timestamp: number;
}

function saveToCache(prices: Map<string, PriceResult>, exchangeRate: ExchangeRate) {
  // Merge with existing cache so we don't lose prices from previous successful fetches
  const existing = loadFromCache();
  const merged: Record<string, PriceResult> = existing?.prices ?? {};

  for (const [k, v] of prices) {
    // Only cache successful results
    if (!v.error) {
      merged[k] = v;
    }
  }

  const cache: PriceCache = {
    prices: merged,
    exchangeRate,
    timestamp: Date.now(),
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

function loadFromCache(): PriceCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export interface FetchResult {
  items: PortfolioItem[];
  exchangeRate: ExchangeRate;
  errors: string[];
}

export async function fetchAllPrices(holdings: Holding[]): Promise<FetchResult> {
  const errors: string[] = [];
  const cached = loadFromCache();

  // Group holdings by type
  const stockHoldings = holdings.filter(h => h.type === 'stock' || h.type === 'tase_stock');
  const fundHoldings = holdings.filter(h => h.type === 'money_fund');
  const cryptoHoldings = holdings.filter(h => h.type === 'crypto');
  const stonksHoldings = holdings.filter(h => h.type === 'stonks');

  // Fetch all prices in parallel
  const [rateResult, yahooResult, mayaResult, cryptoResult, stonksResult] = await Promise.allSettled([
    fetchUsdNisRate(),
    fetchYahooPrices(stockHoldings.map(h => ({ ticker: h.id, currency: h.currency }))),
    fetchMayaFundPrices(fundHoldings.map(h => h.id)),
    fetchCryptoPrices(cryptoHoldings.map(h => h.id)),
    fetchStonksPrices(stonksHoldings.map(h => ({ id: h.id, currency: h.currency }))),
  ]);

  // Extract exchange rate (fallback to cache)
  let exchangeRate: ExchangeRate;
  if (rateResult.status === 'fulfilled') {
    exchangeRate = rateResult.value;
  } else {
    errors.push(`Exchange rate: ${rateResult.reason}`);
    exchangeRate = cached?.exchangeRate ?? { usdToNis: 3.6, asOf: 'fallback' };
  }

  // Collect all price results
  const allPrices = new Map<string, PriceResult>();

  if (yahooResult.status === 'fulfilled') {
    for (const [k, v] of yahooResult.value) allPrices.set(k, v);
  } else {
    errors.push(`Stocks: ${yahooResult.reason}`);
  }

  if (mayaResult.status === 'fulfilled') {
    for (const [k, v] of mayaResult.value) allPrices.set(k, v);
  } else {
    errors.push(`Funds: ${mayaResult.reason}`);
  }

  if (cryptoResult.status === 'fulfilled') {
    for (const [k, v] of cryptoResult.value) allPrices.set(k, v);
  } else {
    errors.push(`Crypto: ${cryptoResult.reason}`);
  }

  if (stonksResult.status === 'fulfilled') {
    for (const [k, v] of stonksResult.value) allPrices.set(k, v);
  } else {
    errors.push(`Stonks: ${stonksResult.reason}`);
  }

  // Save successful results to cache (merges with existing)
  saveToCache(allPrices, exchangeRate);

  // Build portfolio items — fall back to cached price for individual failures
  const items: PortfolioItem[] = holdings.map((holding) => {
    // Cash and education funds don't need price fetching
    if (holding.type === 'cash') {
      const totalUSD = rawToUSD(holding.units, holding.currency, exchangeRate.usdToNis);
      const totalNIS = rawToNIS(holding.units, holding.currency, exchangeRate.usdToNis);
      return {
        holding,
        pricePerUnit: 1,
        totalValueUSD: totalUSD,
        totalValueNIS: totalNIS,
      };
    }

    if (holding.type === 'education_fund') {
      const value = holding.manualValue ?? 0;
      const totalUSD = rawToUSD(value, holding.currency, exchangeRate.usdToNis);
      const totalNIS = rawToNIS(value, holding.currency, exchangeRate.usdToNis);
      return {
        holding,
        pricePerUnit: null,
        totalValueUSD: totalUSD,
        totalValueNIS: totalNIS,
      };
    }

    // Look up fetched price, fall back to cache
    let priceData = allPrices.get(holding.id);
    let fromCache = false;

    if (!priceData || priceData.error) {
      const cachedPrice = cached?.prices?.[holding.id];
      if (cachedPrice && !cachedPrice.error) {
        priceData = cachedPrice;
        fromCache = true;
      }
    }

    if (!priceData || priceData.error) {
      // Last resort: if holding has manual_value, use it (works for money_fund, education_fund, etc.)
      if (holding.manualValue != null) {
        const value = holding.manualValue;
        const totalUSD = rawToUSD(value, holding.currency, exchangeRate.usdToNis);
        const totalNIS = rawToNIS(value, holding.currency, exchangeRate.usdToNis);
        return {
          holding,
          pricePerUnit: null,
          totalValueUSD: totalUSD,
          totalValueNIS: totalNIS,
          error: 'Using manual value',
        };
      }
      return {
        holding,
        pricePerUnit: null,
        totalValueUSD: null,
        totalValueNIS: null,
        error: priceData?.error ?? 'Price not available',
      };
    }

    const rawTotal = priceData.price * holding.units;
    const currency = priceData.rawCurrency;
    const totalUSD = rawToUSD(rawTotal, currency, exchangeRate.usdToNis);
    const totalNIS = rawToNIS(rawTotal, currency, exchangeRate.usdToNis);

    // Normalize price per unit to NIS for display consistency
    const pricePerUnitNIS = rawToNIS(priceData.price, currency, exchangeRate.usdToNis);

    return {
      holding,
      pricePerUnit: pricePerUnitNIS,
      totalValueUSD: totalUSD,
      totalValueNIS: totalNIS,
      error: fromCache ? 'Using cached price' : undefined,
    };
  });

  return { items, exchangeRate, errors };
}
