import { proxiedFetch } from './proxy';
import type { ExchangeRate } from '../types';

interface BoiResponse {
  key: string;
  currentExchangeRate: number;
  lastUpdate: string;
}

export async function fetchUsdNisRate(): Promise<ExchangeRate> {
  const url = 'https://boi.org.il/PublicApi/GetExchangeRate?key=USD';
  const response = await proxiedFetch(url);
  const data: BoiResponse = await response.json();

  return {
    usdToNis: data.currentExchangeRate,
    asOf: data.lastUpdate,
  };
}
