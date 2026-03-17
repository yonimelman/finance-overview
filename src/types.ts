export type HoldingType =
  | 'stock'
  | 'tase_stock'
  | 'money_fund'
  | 'education_fund'
  | 'crypto'
  | 'cash'
  | 'stonks'; // fetched from yonimelman/stonks GitHub repo

// Currency codes as stored in the Google Sheet
// USD = US dollars, ILS = NIS, ILA = Israeli Agorot (1/100 NIS), USX = US cents (1/100 USD)
export type RawCurrency = 'USD' | 'ILS' | 'ILA' | 'USX';

export interface Holding {
  type: HoldingType;
  id: string;
  name: string;
  units: number;
  currency: RawCurrency;
  manualValue?: number;
  manualDate?: string; // when the manual value was last updated
  group: string; // pie chart grouping label (user-defined in sheet)
}

export interface PriceResult {
  price: number; // in the raw currency the API returns
  rawCurrency: RawCurrency;
  error?: string;
}

export interface ExchangeRate {
  usdToNis: number;
  asOf: string;
}

export interface PortfolioItem {
  holding: Holding;
  pricePerUnit: number | null; // normalized to base currency (USD or ILS)
  totalValueUSD: number | null;
  totalValueNIS: number | null;
  error?: string;
}

export type DisplayCurrency = 'USD' | 'ILS';

export const HOLDING_TYPE_LABELS: Record<HoldingType, string> = {
  stock: 'Stocks',
  tase_stock: 'TASE Stocks',
  money_fund: 'Money Funds',
  education_fund: 'Education Funds',
  crypto: 'Crypto',
  cash: 'Cash',
  stonks: 'Stonks',
};
